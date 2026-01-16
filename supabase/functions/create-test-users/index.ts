import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const testUsers = [
      { email: "admin@camacho.com", role: "admin", name: "Administrador Principal" },
      { email: "vendedor@camacho.com", role: "vendor", name: "Carlos Martínez", location: "Matriz Central" },
      { email: "vendedor2@camacho.com", role: "vendor", name: "María García", location: "Sucursal Norte" },
      { email: "distribuidor@camacho.com", role: "distributor", name: "Distribuidora López", company: "Dist. López S.A." },
      { email: "cliente@camacho.com", role: "customer", name: "Juan Pérez" },
    ];

    const results = [];

    for (const testUser of testUsers) {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("email", testUser.email)
        .maybeSingle();

      if (existingUser) {
        results.push({ email: testUser.email, status: "exists", id: existingUser.user_id });
        continue;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: "12345678",
        email_confirm: true,
      });

      if (authError) {
        results.push({ email: testUser.email, status: "error", error: authError.message });
        continue;
      }

      const userId = authData.user.id;

      // Create profile
      await supabase.from("profiles").insert({
        user_id: userId,
        email: testUser.email,
        full_name: testUser.name,
      });

      // Assign role
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: testUser.role,
      });

      // Create vendor record if vendor
      if (testUser.role === "vendor" && testUser.location) {
        // Get or create location
        let locationId: string;
        const { data: loc } = await supabase
          .from("locations")
          .select("id")
          .eq("name", testUser.location)
          .maybeSingle();

        if (loc) {
          locationId = loc.id;
        } else {
          const { data: newLoc } = await supabase
            .from("locations")
            .insert({
              name: testUser.location,
              address: testUser.location === "Matriz Central" 
                ? "Av. Principal 123, Centro, CDMX" 
                : "Calle Norte 456, Col. Industrial",
              phone: testUser.location === "Matriz Central" ? "555-1234" : "555-5678",
              is_active: true,
            })
            .select("id")
            .single();
          locationId = newLoc?.id;
        }

        await supabase.from("vendors").insert({
          user_id: userId,
          location_id: locationId,
          employee_number: `VND-${Date.now()}`,
          commission_rate: 5,
          is_active: true,
        });
      }

      // Create distributor record if distributor
      if (testUser.role === "distributor" && testUser.company) {
        await supabase.from("distributors").insert({
          user_id: userId,
          company_name: testUser.company,
          contact_name: testUser.name,
          email: testUser.email,
          phone: "555-9999",
          discount_percentage: 15,
          credit_limit: 50000,
          status: "active",
        });
      }

      results.push({ email: testUser.email, status: "created", id: userId });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
