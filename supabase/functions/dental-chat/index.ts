import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

INSTRUCCIONES:
1. Sé amable, profesional y empático
2. Responde siempre en español
3. Si preguntan por citas, indica que pueden usar el sistema de reservas en la página (sección "Reservar")
4. Proporciona información útil sobre servicios dentales
5. Si no sabes algo específico, sugiere contactar por teléfono o WhatsApp
6. Mantén respuestas concisas pero informativas (máximo 3-4 oraciones)
7. Si hay dudas sobre precios, sugiere agendar una valoración gratuita
8. Usa emojis ocasionalmente para ser más amigable 😊🦷`;

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
        stream: true,
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error al procesar tu mensaje." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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
