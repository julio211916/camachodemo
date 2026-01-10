import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string[], subject: string, html: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "NovellDent <noreply@novelldent.com>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return response.json();
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pending scheduled emails that are due
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from("scheduled_emails")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No scheduled emails to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    const results: { id: string; success: boolean; sent?: number; failed?: number; error?: string }[] = [];

    for (const scheduled of scheduledEmails) {
      try {
        let emailsToSend: { email: string; name: string }[] = [];

        if (scheduled.target_emails && scheduled.target_emails.length > 0) {
          // Send to specific emails
          for (const email of scheduled.target_emails) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("email", email)
              .single();

            emailsToSend.push({
              email,
              name: profile?.full_name || email.split("@")[0],
            });
          }
        } else {
          // Send to all patients
          const { data: profiles } = await supabase
            .from("profiles")
            .select("email, full_name");

          const { data: appointments } = await supabase
            .from("appointments")
            .select("patient_email, patient_name")
            .eq("status", "completed");

          const profileEmails = new Set((profiles || []).map((p) => p.email));

          emailsToSend = (profiles || []).map((p) => ({
            email: p.email,
            name: p.full_name,
          }));

          (appointments || []).forEach((apt) => {
            if (!profileEmails.has(apt.patient_email)) {
              emailsToSend.push({
                email: apt.patient_email,
                name: apt.patient_name,
              });
              profileEmails.add(apt.patient_email);
            }
          });
        }

        if (emailsToSend.length === 0) {
          await supabase
            .from("scheduled_emails")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              result: { sent: 0, failed: 0, message: "No recipients found" },
            })
            .eq("id", scheduled.id);

          results.push({ id: scheduled.id, success: true, sent: 0, failed: 0 });
          processedCount++;
          continue;
        }

        // Send emails in batches
        const batchSize = 10;
        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < emailsToSend.length; i += batchSize) {
          const batch = emailsToSend.slice(i, i + batchSize);

          const batchResults = await Promise.allSettled(
            batch.map(async ({ email }) => {
              const result = await sendEmail(
                [email],
                scheduled.subject,
                scheduled.html_content
              );
              return result;
            })
          );

          batchResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              successCount++;
            } else {
              failCount++;
              errors.push(`${batch[index].email}: ${result.reason}`);
            }
          });

          // Small delay between batches
          if (i + batchSize < emailsToSend.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Update scheduled email status
        await supabase
          .from("scheduled_emails")
          .update({
            status: failCount > 0 && successCount === 0 ? "failed" : "sent",
            sent_at: new Date().toISOString(),
            result: { sent: successCount, failed: failCount, errors: errors.length > 0 ? errors : undefined },
          })
          .eq("id", scheduled.id);

        results.push({ id: scheduled.id, success: true, sent: successCount, failed: failCount });
        processedCount++;
        console.log(`Processed scheduled email ${scheduled.id}: ${successCount} sent, ${failCount} failed`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error processing scheduled email ${scheduled.id}:`, error);

        await supabase
          .from("scheduled_emails")
          .update({
            status: "failed",
            result: { error: message },
          })
          .eq("id", scheduled.id);

        results.push({ id: scheduled.id, success: false, error: message });
        processedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing scheduled emails:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
