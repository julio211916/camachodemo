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

    // Get tomorrow's date
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Checking for appointments on ${tomorrowStr}`);

    // Find appointments for tomorrow that are confirmed or pending and haven't received a reminder
    const { data: appointments, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', tomorrowStr)
      .in('status', ['pending', 'confirmed'])
      .is('reminder_sent', null);

    if (fetchError) {
      console.error("Error fetching appointments:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${appointments?.length || 0} appointments needing reminders`);

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No appointments to remind", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = [];

    for (const appointment of appointments) {
      try {
        // Format the date nicely
        const appointmentDate = new Date(appointment.appointment_date + 'T00:00:00');
        const formattedDate = appointmentDate.toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Send reminder email
        const emailResponse = await resend.emails.send({
          from: "NovellDent <onboarding@resend.dev>",
          to: [appointment.patient_email],
          subject: "⏰ Recordatorio: Tu cita es mañana - NovellDent",
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
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Recordatorio de Cita</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 80px; height: 80px; background: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                      <span style="font-size: 40px;">⏰</span>
                    </div>
                    <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 24px;">¡Tu cita es mañana!</h2>
                    <p style="color: #64748b; margin: 0;">Hola <strong>${appointment.patient_name}</strong>, te recordamos que tienes una cita programada.</p>
                  </div>
                  
                  <!-- Appointment Details -->
                  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                    <h3 style="color: #f59e0b; margin: 0 0 20px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Detalles de tu Cita</h3>
                    
                    <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
                      <span style="font-size: 20px; margin-right: 12px;">📍</span>
                      <div>
                        <div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Sucursal</div>
                        <div style="color: #1e293b; font-weight: 600;">${appointment.location_name}</div>
                      </div>
                    </div>
                    
                    <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
                      <span style="font-size: 20px; margin-right: 12px;">🦷</span>
                      <div>
                        <div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Servicio</div>
                        <div style="color: #1e293b; font-weight: 600;">${appointment.service_name}</div>
                      </div>
                    </div>
                    
                    <div style="margin-bottom: 16px; display: flex; align-items: flex-start;">
                      <span style="font-size: 20px; margin-right: 12px;">📅</span>
                      <div>
                        <div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Fecha</div>
                        <div style="color: #1e293b; font-weight: 600;">${formattedDate}</div>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: flex-start;">
                      <span style="font-size: 20px; margin-right: 12px;">🕐</span>
                      <div>
                        <div style="color: #64748b; font-size: 12px; text-transform: uppercase;">Hora</div>
                        <div style="color: #1e293b; font-weight: 600;">${appointment.appointment_time} hrs</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Important Notes -->
                  <div style="background: #dbeafe; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                    <p style="color: #1e40af; margin: 0; font-size: 14px;">
                      <strong>💡 Recuerda:</strong> Llega 10 minutos antes de tu cita para completar el registro.
                    </p>
                  </div>
                  
                  <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                      <strong>¿Necesitas cancelar o reprogramar?</strong> Por favor contáctanos lo antes posible para poder atender a otro paciente.
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

        console.log(`Reminder sent to ${appointment.patient_email}:`, emailResponse);

        // Mark reminder as sent
        await supabase
          .from('appointments')
          .update({ reminder_sent: new Date().toISOString() })
          .eq('id', appointment.id);

        results.push({
          id: appointment.id,
          email: appointment.patient_email,
          status: 'sent'
        });

      } catch (emailError) {
        console.error(`Failed to send reminder to ${appointment.patient_email}:`, emailError);
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
        message: "Reminders processed", 
        count: results.filter(r => r.status === 'sent').length,
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in send-appointment-reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
