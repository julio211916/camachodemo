import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const locations = [
  { id: "tepic", name: "Matriz Tepic", address: "Tepic, Nayarit", phone: "+52 311 133 8000" },
  { id: "marina", name: "Marina Nuevo Nayarit", address: "Nuevo Vallarta Plaza Business Center, Bahía de Banderas, Nayarit", phone: "+52 322 183 7666" },
  { id: "centro-empresarial", name: "Centro Empresarial Nuevo Nayarit", address: "Núcleo Médico Joya, Bahía de Banderas, Nayarit", phone: "+52 322 183 7666" },
  { id: "puerto-magico", name: "Puerto Mágico Puerto Vallarta", address: "Plaza Puerto Mágico, Puerto Vallarta, Jalisco", phone: "+52 322 183 7666" },
];

const services = [
  { id: "general", name: "Odontología General" },
  { id: "ortodoncia", name: "Ortodoncia" },
  { id: "implantes", name: "Implantes Dentales" },
  { id: "estetica", name: "Estética Dental" },
  { id: "blanqueamiento", name: "Blanqueamiento" },
  { id: "endodoncia", name: "Endodoncia" },
  { id: "periodoncia", name: "Periodoncia" },
  { id: "infantil", name: "Odontopediatría" },
];

const allTimeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
];

const SYSTEM_PROMPT = `Eres un asistente virtual amigable de NovellDent, una clínica dental de alta calidad en México. Tu nombre es "Denti".

INFORMACIÓN DE LA CLÍNICA:
- **Sucursales:**
  1. Matriz Tepic - Tepic, Nayarit - Tel: +52 311 133 8000
  2. Marina Nuevo Nayarit - Nuevo Vallarta Plaza Business Center, Bahía de Banderas, Nayarit - Tel: +52 322 183 7666
  3. Centro Empresarial Nuevo Nayarit - Núcleo Médico Joya, Bahía de Banderas, Nayarit - Tel: +52 322 183 7666
  4. Puerto Mágico Puerto Vallarta - Plaza Puerto Mágico, Puerto Vallarta, Jalisco - Tel: +52 322 183 7666

- **Servicios:**
  - Odontología General
  - Ortodoncia (brackets, alineadores)
  - Implantes Dentales
  - Estética Dental (carillas, diseño de sonrisa)
  - Blanqueamiento Dental
  - Endodoncia (tratamientos de conducto)
  - Periodoncia (salud de encías)
  - Odontopediatría (niños)

- **Horarios:** Lunes a Sábado de 9:00 AM a 6:00 PM

CAPACIDAD DE AGENDAR CITAS:
Puedes ayudar a los pacientes a agendar citas directamente. Cuando un usuario quiera agendar una cita:
1. Pregunta por la sucursal preferida
2. Pregunta por el servicio que necesita
3. Pregunta por la fecha deseada (formato: YYYY-MM-DD)
4. Una vez tengas estos datos, usa la herramienta book_appointment para verificar disponibilidad y agendar
5. Necesitarás también: nombre completo, teléfono y email del paciente

INSTRUCCIONES:
1. Sé amable, profesional y empático
2. Responde siempre en español
3. Proporciona información útil sobre servicios dentales
4. Si no sabes algo específico, sugiere contactar por teléfono o WhatsApp
5. Mantén respuestas concisas pero informativas (máximo 3-4 oraciones)
6. Si hay dudas sobre precios, sugiere agendar una valoración gratuita
7. Usa emojis ocasionalmente para ser más amigable 😊🦷
8. Cuando el usuario quiera agendar, guíalo paso a paso y usa la herramienta cuando tengas todos los datos`;

const tools = [
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Verifica los horarios disponibles para una sucursal y fecha específica",
      parameters: {
        type: "object",
        properties: {
          location_id: {
            type: "string",
            enum: ["tepic", "marina", "centro-empresarial", "puerto-magico"],
            description: "ID de la sucursal"
          },
          date: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD"
          }
        },
        required: ["location_id", "date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Agenda una cita dental con todos los datos del paciente",
      parameters: {
        type: "object",
        properties: {
          location_id: {
            type: "string",
            enum: ["tepic", "marina", "centro-empresarial", "puerto-magico"],
            description: "ID de la sucursal"
          },
          service_id: {
            type: "string",
            enum: ["general", "ortodoncia", "implantes", "estetica", "blanqueamiento", "endodoncia", "periodoncia", "infantil"],
            description: "ID del servicio"
          },
          date: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD"
          },
          time: {
            type: "string",
            description: "Hora en formato HH:MM (ej: 09:00, 14:30)"
          },
          patient_name: {
            type: "string",
            description: "Nombre completo del paciente"
          },
          patient_phone: {
            type: "string",
            description: "Teléfono del paciente"
          },
          patient_email: {
            type: "string",
            description: "Email del paciente"
          }
        },
        required: ["location_id", "service_id", "date", "time", "patient_name", "patient_phone", "patient_email"]
      }
    }
  }
];

async function checkAvailability(supabase: any, locationId: string, date: string): Promise<string[]> {
  const { data: appointments } = await supabase
    .from("appointments")
    .select("appointment_time")
    .eq("location_id", locationId)
    .eq("appointment_date", date)
    .neq("status", "cancelled");

  const bookedTimes = appointments?.map((a: any) => a.appointment_time) || [];
  return allTimeSlots.filter(time => !bookedTimes.includes(time));
}

async function bookAppointment(supabase: any, params: any): Promise<{ success: boolean; message: string; appointmentId?: string }> {
  const location = locations.find(l => l.id === params.location_id);
  const service = services.find(s => s.id === params.service_id);

  if (!location || !service) {
    return { success: false, message: "Sucursal o servicio no válido" };
  }

  // Check if time is available
  const available = await checkAvailability(supabase, params.location_id, params.date);
  if (!available.includes(params.time)) {
    return { 
      success: false, 
      message: `El horario ${params.time} ya no está disponible. Horarios disponibles: ${available.slice(0, 5).join(", ")}${available.length > 5 ? "..." : ""}` 
    };
  }

  // Validate date is not in the past
  const appointmentDate = new Date(params.date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    return { success: false, message: "No puedes agendar citas en fechas pasadas" };
  }

  // Check if it's Sunday
  if (appointmentDate.getDay() === 0) {
    return { success: false, message: "No atendemos los domingos. Por favor elige otro día." };
  }

  // Create appointment
  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert([{
      location_id: params.location_id,
      location_name: location.name,
      service_id: params.service_id,
      service_name: service.name,
      appointment_date: params.date,
      appointment_time: params.time,
      patient_name: params.patient_name,
      patient_phone: params.patient_phone,
      patient_email: params.patient_email,
      status: "pending"
    }])
    .select()
    .single();

  if (error) {
    console.error("Error booking appointment:", error);
    return { success: false, message: "Error al agendar la cita. Por favor intenta de nuevo." };
  }

  // Send confirmation email
  try {
    const formattedDate = appointmentDate.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-appointment-confirmation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({
        patientName: params.patient_name,
        patientEmail: params.patient_email,
        locationName: location.name,
        serviceName: service.name,
        appointmentDate: formattedDate,
        appointmentTime: params.time,
        appointmentId: appointment.id
      })
    });
  } catch (emailError) {
    console.error("Error sending email:", emailError);
  }

  return { 
    success: true, 
    message: `¡Cita agendada exitosamente! 🎉\n\n📍 Sucursal: ${location.name}\n🦷 Servicio: ${service.name}\n📅 Fecha: ${params.date}\n🕐 Hora: ${params.time}\n\nTe hemos enviado un correo de confirmación a ${params.patient_email}`,
    appointmentId: appointment.id
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First API call with tools
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Por favor espera un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Servicio temporalmente no disponible." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Check if there are tool calls
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        
        let result: any;
        
        if (functionName === "check_availability") {
          const available = await checkAvailability(supabase, args.location_id, args.date);
          const location = locations.find(l => l.id === args.location_id);
          result = {
            available_times: available,
            location_name: location?.name || args.location_id,
            date: args.date,
            message: available.length > 0 
              ? `Horarios disponibles para ${args.date}: ${available.join(", ")}`
              : "No hay horarios disponibles para esta fecha"
          };
        } else if (functionName === "book_appointment") {
          result = await bookAppointment(supabase, args);
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: JSON.stringify(result)
        });
      }

      // Second API call with tool results
      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
            assistantMessage,
            ...toolResults
          ],
          stream: true,
        }),
      });

      if (!followUpResponse.ok) {
        throw new Error("AI gateway error on follow-up");
      }

      return new Response(followUpResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls, stream the response directly
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
