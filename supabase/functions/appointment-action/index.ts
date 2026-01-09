import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = url.searchParams.get("action"); // 'confirm' or 'cancel'

    if (!token || !action) {
      return new Response(generateHtml("error", "Enlace inválido", "El enlace que usaste no es válido o ha expirado."), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (action !== "confirm" && action !== "cancel") {
      return new Response(generateHtml("error", "Acción inválida", "La acción solicitada no es válida."), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find appointment by token
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("confirmation_token", token)
      .single();

    if (fetchError || !appointment) {
      return new Response(generateHtml("error", "Cita no encontrada", "No pudimos encontrar tu cita. Es posible que el enlace haya expirado."), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Check if appointment is already processed
    if (appointment.status === "cancelled") {
      return new Response(generateHtml("info", "Cita ya cancelada", "Esta cita ya fue cancelada anteriormente."), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (appointment.status === "completed") {
      return new Response(generateHtml("info", "Cita completada", "Esta cita ya fue completada."), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Format date for display
    const appointmentDate = new Date(appointment.appointment_date + 'T00:00:00');
    const formattedDate = appointmentDate.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (action === "confirm") {
      // Confirm the appointment
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ 
          status: "confirmed",
          confirmed_at: new Date().toISOString()
        })
        .eq("id", appointment.id);

      if (updateError) {
        console.error("Error confirming appointment:", updateError);
        return new Response(generateHtml("error", "Error", "No pudimos confirmar tu cita. Por favor intenta de nuevo."), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        });
      }

      return new Response(
        generateHtml(
          "success",
          "¡Cita Confirmada!",
          `Tu cita para <strong>${appointment.service_name}</strong> el <strong>${formattedDate}</strong> a las <strong>${appointment.appointment_time} hrs</strong> en <strong>${appointment.location_name}</strong> ha sido confirmada. ¡Te esperamos!`
        ),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        }
      );
    } else {
      // Cancel the appointment
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointment.id);

      if (updateError) {
        console.error("Error cancelling appointment:", updateError);
        return new Response(generateHtml("error", "Error", "No pudimos cancelar tu cita. Por favor contáctanos directamente."), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        });
      }

      return new Response(
        generateHtml(
          "cancelled",
          "Cita Cancelada",
          `Tu cita del <strong>${formattedDate}</strong> a las <strong>${appointment.appointment_time} hrs</strong> ha sido cancelada. Si cambiaste de opinión, puedes agendar una nueva cita en nuestra página.`
        ),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
  } catch (error) {
    console.error("Error in appointment-action:", error);
    return new Response(generateHtml("error", "Error", "Ocurrió un error inesperado. Por favor contáctanos."), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
};

function generateHtml(type: "success" | "cancelled" | "error" | "info", title: string, message: string): string {
  const colors = {
    success: { bg: "#dcfce7", icon: "✅", accent: "#22c55e" },
    cancelled: { bg: "#fef3c7", icon: "📅", accent: "#f59e0b" },
    error: { bg: "#fee2e2", icon: "❌", accent: "#ef4444" },
    info: { bg: "#dbeafe", icon: "ℹ️", accent: "#3b82f6" },
  };

  const style = colors[type];

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - NovellDent</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          max-width: 480px;
          width: 100%;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          color: white;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          margin-top: 5px;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .icon-wrapper {
          width: 100px;
          height: 100px;
          background: ${style.bg};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 48px;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }
        .message {
          color: #64748b;
          line-height: 1.6;
          font-size: 16px;
        }
        .message strong {
          color: #1e293b;
        }
        .cta {
          margin-top: 30px;
        }
        .cta a {
          display: inline-block;
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cta a:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(14, 165, 233, 0.3);
        }
        .footer {
          background: #f8fafc;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          color: #94a3b8;
          font-size: 13px;
        }
        .whatsapp {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #25d366;
          color: white;
          padding: 12px 24px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🦷 NovellDent</h1>
          <p>Clínica Dental Premium</p>
        </div>
        <div class="content">
          <div class="icon-wrapper">${style.icon}</div>
          <h2 class="title">${title}</h2>
          <p class="message">${message}</p>
          <div class="cta">
            <a href="https://${Deno.env.get("SUPABASE_URL")?.replace("https://", "").replace(".supabase.co", "")}.lovable.app">Ir a la página</a>
          </div>
          <a href="https://wa.me/523221837666" class="whatsapp">
            💬 Contactar por WhatsApp
          </a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} NovellDent. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
