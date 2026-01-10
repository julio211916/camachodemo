import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { appointmentId, referralCode } = await req.json();

    if (!appointmentId || !referralCode) {
      return new Response(
        JSON.stringify({ error: "Missing appointmentId or referralCode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error("Appointment not found");
    }

    // Find the referral by code and referred email
    const { data: referral, error: referralError } = await supabase
      .from("referrals")
      .select("*")
      .eq("referral_code", referralCode)
      .eq("referred_email", appointment.patient_email)
      .eq("status", "pending")
      .single();

    if (referralError || !referral) {
      console.log("No pending referral found for this code and email");
      return new Response(
        JSON.stringify({ success: true, message: "No pending referral found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate discount (5% of appointment cost - we'll apply it later in invoicing)
    const discountPercentage = 5;

    // Update referral status to completed
    const { error: updateError } = await supabase
      .from("referrals")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        discount_percentage: discountPercentage,
        referred_patient_id: appointment.patient_email,
      })
      .eq("id", referral.id);

    if (updateError) {
      throw updateError;
    }

    // Send push notification to the referrer
    const { error: notifyError } = await supabase.functions.invoke("send-push-notification", {
      body: {
        patientEmail: referral.referrer_email,
        title: "🎉 ¡Tu referido completó su cita!",
        body: `${appointment.patient_name} completó su cita. Has ganado un 5% de descuento para tu próximo tratamiento.`,
        data: {
          type: "referral_complete",
          referralId: referral.id,
          discountPercentage,
        },
      },
    });

    if (notifyError) {
      console.error("Error sending push notification:", notifyError);
    }

    // Also send email notification via Resend if configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "NovellDent <noreply@novelldent.com>",
            to: [referral.referrer_email],
            subject: "🎉 ¡Tu referido completó su cita! - NovellDent",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">¡Felicitaciones!</h1>
                <p>Tu referido <strong>${appointment.patient_name}</strong> ha completado su primera cita en NovellDent.</p>
                <p>Has ganado un <strong style="color: #16a34a; font-size: 24px;">5% de descuento</strong> que se aplicará automáticamente en tu próximo tratamiento o pago.</p>
                <p>Gracias por recomendar NovellDent a tus amigos y familiares.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">Este es un correo automático, por favor no responder.</p>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    console.log(`Referral ${referral.id} marked as completed. Referrer: ${referral.referrer_email}`);

    return new Response(
      JSON.stringify({
        success: true,
        referralId: referral.id,
        referrerEmail: referral.referrer_email,
        discountPercentage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing referral completion:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
