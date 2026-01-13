import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  appointmentId?: string;
  patientPhone: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  locationName: string;
  doctorName?: string;
  reminderType: 'whatsapp' | 'sms';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      appointmentId,
      patientPhone, 
      patientName, 
      appointmentDate,
      appointmentTime,
      serviceName,
      locationName,
      doctorName,
      reminderType 
    }: ReminderRequest = await req.json();

    // Format phone number for WhatsApp (remove spaces, add country code if needed)
    let formattedPhone = patientPhone.replace(/\s+/g, '').replace(/-/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+52' + formattedPhone; // Default to Mexico
    }

    // Format date nicely
    const dateObj = new Date(appointmentDate + 'T' + appointmentTime);
    const formattedDate = dateObj.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = dateObj.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Create reminder message
    const message = `🦷 *NovellDent - Recordatorio de Cita*

Hola ${patientName},

Le recordamos su cita dental:

📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${formattedTime}
🏥 *Servicio:* ${serviceName}
📍 *Ubicación:* ${locationName}
${doctorName ? `👨‍⚕️ *Doctor:* ${doctorName}` : ''}

*Recomendaciones:*
• Llegue 10 minutos antes
• Traiga su identificación
• Informe si toma medicamentos

Para confirmar o reagendar, responda a este mensaje o llame al +52 322 183 7666.

¡Le esperamos! 😊

_NovellDent - Tu sonrisa, nuestra prioridad_`;

    if (reminderType === 'whatsapp') {
      // Generate WhatsApp URL for manual sending or API integration
      const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
      
      console.log(`WhatsApp reminder prepared for ${patientName}:`, whatsappUrl);

      // If you have WhatsApp Business API configured, you would send here
      // For now, we return the URL for manual sending or frontend handling
      
      return new Response(JSON.stringify({ 
        success: true, 
        whatsappUrl,
        message: "Recordatorio preparado para WhatsApp",
        formattedPhone,
        reminderMessage: message
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      // SMS handling - would integrate with Twilio or similar
      // For now, return success with message content
      console.log(`SMS reminder prepared for ${patientName} at ${formattedPhone}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Recordatorio SMS preparado",
        formattedPhone,
        reminderMessage: message.replace(/\*/g, '').replace(/_/g, '') // Remove formatting for SMS
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  } catch (error: any) {
    console.error("Error preparing reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
