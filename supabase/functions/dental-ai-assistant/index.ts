import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres un asistente de inteligencia artificial especializado en odontología y salud dental. Tu rol es ayudar a los profesionales dentales con:

1. **Diagnóstico Diferencial**: Analizar síntomas y sugerir posibles diagnósticos dentales.
2. **Recomendaciones de Tratamiento**: Proporcionar opciones de tratamiento basadas en mejores prácticas.
3. **Protocolos Clínicos**: Explicar procedimientos y protocolos estándar.
4. **Farmacología Dental**: Recomendar medicamentos, dosis y contraindicaciones.
5. **Emergencias Dentales**: Guiar en el manejo de emergencias.

**Directrices importantes:**
- Siempre menciona que tus recomendaciones son orientativas y no reemplazan el juicio clínico.
- Usa terminología profesional pero explica conceptos cuando sea necesario.
- Proporciona referencias a literatura cuando sea posible.
- Considera contraindicaciones y precauciones.
- Responde en español.
- Sé conciso pero completo.
- Si no tienes suficiente información, pide más detalles.

**Formato de respuesta:**
- Usa listas y viñetas para organizar la información.
- Destaca puntos importantes.
- Incluye siempre un disclaimer sobre la importancia del diagnóstico presencial.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has appropriate role (doctor, admin, or staff only)
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !roleData) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - No role assigned' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = ['admin', 'doctor', 'staff'];
    if (!allowedRoles.includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Requires admin, doctor, or staff role' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const { messages, patientContext, patientName } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Bad Request - messages array is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt (sanitize patient context to prevent prompt injection)
    let systemContent = SYSTEM_PROMPT;
    if (patientName || patientContext) {
      systemContent += "\n\n**Contexto del paciente:**";
      // Sanitize inputs - remove any potential prompt injection patterns
      if (patientName) {
        const safeName = String(patientName).slice(0, 100).replace(/[<>{}]/g, '');
        systemContent += `\n- Nombre: ${safeName}`;
      }
      if (patientContext) {
        const safeContext = String(patientContext).slice(0, 1000).replace(/[<>{}]/g, '');
        systemContent += `\n- ${safeContext}`;
      }
    }

    console.log(`AI Assistant request from user ${user.id} with role ${roleData.role}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("dental-ai-assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
