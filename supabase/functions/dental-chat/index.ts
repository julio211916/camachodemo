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

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const MAX_CHAT_REQUESTS_PER_WINDOW = 30; // Max chat requests per IP per hour
const MAX_BOOKINGS_PER_CONTACT_PER_HOUR = 3; // Max bookings per email/phone per hour

// In-memory rate limiting (for edge function instances)
const rateLimitCache = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(key: string, maxRequests: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = rateLimitCache.get(key);
  
  if (!existing || now - existing.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitCache.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  existing.count++;
  rateLimitCache.set(key, existing);
  return { allowed: true, remaining: maxRequests - existing.count };
}

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

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

// Anomaly detection: Check for suspicious booking patterns
async function checkAnomalies(
  supabase: any, 
  email: string, 
  phone: string
): Promise<{ allowed: boolean; message?: string }> {
  const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  // Check recent bookings from the same email or phone
  const { data: recentBookings, error } = await supabase
    .from("appointments")
    .select("id, created_at")
    .or(`patient_email.eq.${email},patient_phone.eq.${phone}`)
    .gte("created_at", oneHourAgo);
  
  if (error) {
    console.error("Error checking anomalies:", error);
    // Allow booking but log the error
    return { allowed: true };
  }
  
  if (recentBookings && recentBookings.length >= MAX_BOOKINGS_PER_CONTACT_PER_HOUR) {
    console.warn("Anomaly detected - too many bookings:", { email, phone, count: recentBookings.length });
    return { 
      allowed: false, 
      message: "Has alcanzado el límite de citas por hora. Por favor intenta más tarde o contáctanos por teléfono." 
    };
  }
  
  return { allowed: true };
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone format (Mexican phone numbers)
function isValidPhone(phone: string): boolean {
  // Remove common characters and check length
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15 && /^\d+$/.test(cleaned);
}

async function bookAppointment(
  supabase: any, 
  params: any,
  clientIP: string
): Promise<{ success: boolean; message: string; appointmentId?: string }> {
  const location = locations.find(l => l.id === params.location_id);
  const service = services.find(s => s.id === params.service_id);

  if (!location || !service) {
    return { success: false, message: "Sucursal o servicio no válido" };
  }

  // Validate email format
  if (!isValidEmail(params.patient_email)) {
    return { success: false, message: "Por favor proporciona un correo electrónico válido" };
  }

  // Validate phone format
  if (!isValidPhone(params.patient_phone)) {
    return { success: false, message: "Por favor proporciona un número de teléfono válido" };
  }

  // Validate patient name (must have at least 2 characters)
  if (!params.patient_name || params.patient_name.trim().length < 2) {
    return { success: false, message: "Por favor proporciona un nombre válido" };
  }

  // Rate limit check per booking action
  const bookingRateLimit = checkRateLimit(`booking:${clientIP}`, 5);
  if (!bookingRateLimit.allowed) {
    console.warn("Booking rate limit exceeded for IP:", clientIP);
    return { 
      success: false, 
      message: "Demasiadas solicitudes de citas. Por favor espera unos minutos." 
    };
  }

  // Anomaly detection
  const anomalyCheck = await checkAnomalies(supabase, params.patient_email, params.patient_phone);
  if (!anomalyCheck.allowed) {
    return { success: false, message: anomalyCheck.message! };
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
      patient_name: params.patient_name.trim(),
      patient_phone: params.patient_phone.trim(),
      patient_email: params.patient_email.toLowerCase().trim(),
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

  const clientIP = getClientIP(req);

  try {
    // Rate limit check for chat requests
    const chatRateLimit = checkRateLimit(`chat:${clientIP}`, MAX_CHAT_REQUESTS_PER_WINDOW);
    if (!chatRateLimit.allowed) {
      console.warn("Chat rate limit exceeded for IP:", clientIP);
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes. Por favor espera unos minutos." }), 
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { messages } = await req.json();
    
    // Basic input validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Mensajes inválidos" }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Limit message count to prevent abuse
    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Demasiados mensajes en la conversación" }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
          result = await bookAppointment(supabase, args, clientIP);
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
