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


interface PromoEmailRequest {
  targetEmails?: string[]; // Specific emails, or null for all patients
  subject?: string;
  customMessage?: string;
  customHtml?: string; // Full HTML from visual editor
}

const getEmailTemplate = (patientName: string, customMessage?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Programa de Referidos NovellDent</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Header -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="color: #1e3a5f; margin: 0; font-size: 28px;">🦷 NovellDent</h1>
            </td>
          </tr>
        </table>
        
        <!-- Main Content -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px;">
              <!-- Gift Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 60px;">🎁</span>
              </div>
              
              <h2 style="color: #1e3a5f; text-align: center; margin: 0 0 20px 0; font-size: 24px;">
                ¡Hola ${patientName}!
              </h2>
              
              <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0; text-align: center; font-size: 16px;">
                ${customMessage || "Queremos agradecerte por confiar en nosotros para tu salud dental. Como muestra de agradecimiento, te invitamos a participar en nuestro programa de referidos."}
              </p>
              
              <!-- Benefit Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <h3 style="color: #0369a1; margin: 0 0 16px 0; font-size: 20px;">
                      💰 Gana 5% de descuento
                    </h3>
                    <p style="color: #0c4a6e; margin: 0; font-size: 14px; line-height: 1.6;">
                      Por cada amigo o familiar que refieras y complete su primera cita, 
                      <strong>recibirás un 5% de descuento</strong> en tu próximo tratamiento.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- How it works -->
              <h3 style="color: #1e3a5f; margin: 24px 0 16px 0; font-size: 18px;">
                ¿Cómo funciona?
              </h3>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold;">1</span>
                        </td>
                        <td style="color: #475569; font-size: 14px; line-height: 1.5;">
                          Inicia sesión en tu portal de paciente y obtén tu código de referido único
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold;">2</span>
                        </td>
                        <td style="color: #475569; font-size: 14px; line-height: 1.5;">
                          Comparte tu código con amigos y familiares
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold;">3</span>
                        </td>
                        <td style="color: #475569; font-size: 14px; line-height: 1.5;">
                          Cuando agendan y completan su cita, ¡tu descuento se activa automáticamente!
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://novelldent.com/portal" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Obtener mi código de referido
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits List -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #fefce8; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #854d0e; margin: 0; font-size: 14px; font-weight: 600;">
                      ✨ Beneficios del programa:
                    </p>
                    <ul style="color: #713f12; margin: 12px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                      <li>Sin límite de referidos</li>
                      <li>Descuentos acumulables</li>
                      <li>Tus amigos también reciben 5% en su primera cita</li>
                      <li>Aplicación automática en tu próximo tratamiento</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Este correo fue enviado por NovellDent | Tu sonrisa, nuestra prioridad
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0 0;">
                Si no deseas recibir estos correos, responde a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { targetEmails, subject, customMessage }: PromoEmailRequest = await req.json();

    let emailsToSend: { email: string; name: string }[] = [];

    if (targetEmails && targetEmails.length > 0) {
      // Send to specific emails - fetch names from profiles if available
      for (const email of targetEmails) {
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
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("full_name, email");

      if (error) throw error;

      // Also get unique emails from appointments that might not have profiles
      const { data: appointments } = await supabase
        .from("appointments")
        .select("patient_email, patient_name")
        .eq("status", "completed");

      const profileEmails = new Set(profiles?.map((p) => p.email) || []);
      
      emailsToSend = (profiles || []).map((p) => ({
        email: p.email,
        name: p.full_name,
      }));

      // Add appointment emails that don't have profiles
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
      return new Response(
        JSON.stringify({ success: true, message: "No emails to send", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailSubject = subject || "🎁 ¡Gana descuentos con nuestro programa de referidos! - NovellDent";

    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < emailsToSend.length; i += batchSize) {
      const batch = emailsToSend.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(async ({ email, name }) => {
          const result = await sendEmail(
            [email],
            emailSubject,
            getEmailTemplate(name, customMessage)
          );
          return result;
        })
      );

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successCount++;
          console.log(`Email sent to: ${batch[index].email}`);
        } else {
          failCount++;
          errors.push(`${batch[index].email}: ${result.reason}`);
          console.error(`Failed to send to ${batch[index].email}:`, result.reason);
        }
      });

      // Small delay between batches
      if (i + batchSize < emailsToSend.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Promo emails sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        total: emailsToSend.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending promo emails:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
