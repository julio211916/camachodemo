import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get yesterday's date to find completed appointments
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`Looking for completed appointments from ${yesterdayStr}`);

    // Find completed appointments that haven't received a review request
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', yesterdayStr)
      .eq('status', 'completed')
      .is('review_sent_at', null);

    if (fetchError) {
      console.error("Error fetching appointments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${appointments?.length || 0} appointments for review requests`);

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No appointments need review requests", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = [];
    const appUrl = supabaseUrl.replace(".supabase.co", ".lovable.app");

    for (const appointment of appointments) {
      try {
        const reviewUrl = `${appUrl}/review?token=${appointment.review_token}`;

        // Send review request email
        const emailResponse = await resend.emails.send({
          from: "NovellDent <onboarding@resend.dev>",
          to: [appointment.patient_email],
          subject: "⭐ ¿Cómo fue tu experiencia? - NovellDent",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">NovellDent</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Tu opinión nos importa</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">⭐</div>
                    <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 24px;">¡Gracias por visitarnos!</h2>
                    <p style="color: #64748b; margin: 0;">
                      Hola <strong>${appointment.patient_name}</strong>, esperamos que tu visita a 
                      <strong>${appointment.location_name}</strong> haya sido excelente.
                    </p>
                  </div>
                  
                  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px; text-align: center;">
                    <p style="color: #64748b; margin: 0 0 20px; font-size: 16px;">
                      Tu opinión nos ayuda a mejorar. ¿Podrías tomarte un momento para contarnos cómo fue tu experiencia?
                    </p>
                    <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      ⭐ Dejar mi Reseña
                    </a>
                  </div>
                  
                  <p style="color: #94a3b8; font-size: 14px; text-align: center;">
                    Solo te tomará 30 segundos y nos ayudarás mucho. 🙏
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: #1e293b; padding: 30px; text-align: center;">
                  <p style="color: #94a3b8; margin: 0 0 10px; font-size: 14px;">
                    © ${new Date().getFullYear()} NovellDent. Todos los derechos reservados.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        console.log(`Review request sent to ${appointment.patient_email}:`, emailResponse);

        // Mark as sent
        await supabase
          .from('appointments')
          .update({ review_sent_at: new Date().toISOString() })
          .eq('id', appointment.id);

        results.push({
          id: appointment.id,
          email: appointment.patient_email,
          status: 'sent'
        });

      } catch (emailError) {
        console.error(`Failed to send review request to ${appointment.patient_email}:`, emailError);
        results.push({
          id: appointment.id,
          email: appointment.patient_email,
          status: 'failed',
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Review requests processed", 
        count: results.filter(r => r.status === 'sent').length,
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in send-review-requests:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
