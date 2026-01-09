import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppointmentConfirmationRequest {
  patientName: string;
  patientEmail: string;
  locationName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      patientName, 
      patientEmail, 
      locationName, 
      serviceName, 
      appointmentDate, 
      appointmentTime,
      appointmentId
    }: AppointmentConfirmationRequest = await req.json();

    // Get confirmation token if appointmentId is provided
    let confirmationToken = "";
    if (appointmentId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: appointment } = await supabase
        .from("appointments")
        .select("confirmation_token")
        .eq("id", appointmentId)
        .single();
      
      if (appointment?.confirmation_token) {
        confirmationToken = appointment.confirmation_token;
      }
    }

    const baseUrl = Deno.env.get("SUPABASE_URL");
    const confirmUrl = confirmationToken 
      ? `${baseUrl}/functions/v1/appointment-action?token=${confirmationToken}&action=confirm`
      : "";
    const cancelUrl = confirmationToken
      ? `${baseUrl}/functions/v1/appointment-action?token=${confirmationToken}&action=cancel`
      : "";

    const emailResponse = await resend.emails.send({
      from: "NovellDent <onboarding@resend.dev>",
      to: [patientEmail],
      subject: "✅ Confirmación de Cita - NovellDent",
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
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">NovellDent</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Clínica Dental Premium</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                  <span style="font-size: 40px;">✅</span>
                </div>
                <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 24px;">¡Cita Registrada!</h2>
                <p style="color: #64748b; margin: 0;">Hola <strong>${patientName}</strong>, tu cita ha sido agendada exitosamente.</p>
              </div>
              
              <!-- Appointment Details -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <h3 style="color: #0ea5e9; margin: 0 0 20px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Detalles de tu Cita</h3>
                
                <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px;">📍</span>
                  <div>
                    <div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Sucursal</div>
                    <div style="color: #1e293b; font-weight: 600;">${locationName}</div>
                  </div>
                </div>
                
                <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px;">🦷</span>
                  <div>
                    <div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Servicio</div>
                    <div style="color: #1e293b; font-weight: 600;">${serviceName}</div>
                  </div>
                </div>
                
                <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px;">📅</span>
                  <div>
                    <div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Fecha</div>
                    <div style="color: #1e293b; font-weight: 600;">${appointmentDate}</div>
                  </div>
                </div>
                
                <div style="display: flex; align-items: flex-start;">
                  <span style="font-size: 20px; margin-right: 12px;">🕐</span>
                  <div>
                    <div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Hora</div>
                    <div style="color: #1e293b; font-weight: 600;">${appointmentTime} hrs</div>
                  </div>
                </div>
              </div>
              
              <!-- Action Buttons -->
              ${confirmationToken ? `
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #64748b; margin: 0 0 20px; font-size: 14px;">Por favor confirma tu asistencia:</p>
                <div style="display: inline-block;">
                  <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; margin-right: 10px;">
                    ✅ Confirmar Asistencia
                  </a>
                  <a href="${cancelUrl}" style="display: inline-block; background: #f1f5f9; color: #64748b; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    ❌ Cancelar Cita
                  </a>
                </div>
              </div>
              ` : ''}
              
              <!-- Reminder -->
              <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Recordatorio:</strong> Por favor, llega 10 minutos antes de tu cita. Si necesitas cancelar o reprogramar, usa los botones de arriba o contáctanos con al menos 24 horas de anticipación.
                </p>
              </div>
              
              <!-- Contact -->
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0 0 10px; font-size: 14px;">¿Tienes alguna pregunta?</p>
                <a href="https://wa.me/523221837666" style="display: inline-block; background: #25d366; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  💬 Contáctanos por WhatsApp
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; margin: 0 0 10px; font-size: 14px;">
                © ${new Date().getFullYear()} NovellDent. Todos los derechos reservados.
              </p>
              <p style="color: #64748b; margin: 0; font-size: 12px;">
                Nayarit & Jalisco, México | +52 322 183 7666
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Appointment confirmation email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending appointment confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
