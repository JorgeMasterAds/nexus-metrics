import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is super admin
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Não autenticado");

    const { data: isSA } = await callerClient.rpc("is_super_admin", { _user_id: caller.id });
    if (!isSA) throw new Error("Acesso negado");

    const { action, email } = await req.json();
    if (!email || !action) throw new Error("Parâmetros inválidos");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (action === "reset_password") {
      // Use the admin client to generate a password reset link
      const { error } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${req.headers.get("origin") || supabaseUrl}/reset-password`,
        },
      });
      if (error) throw error;

      // Also send the reset email via the normal flow
      const { error: resetErr } = await adminClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.headers.get("origin") || supabaseUrl}/reset-password`,
      });
      if (resetErr) throw resetErr;

      return new Response(JSON.stringify({ success: true, message: "Email de redefinição de senha enviado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "resend_confirmation") {
      const { error } = await adminClient.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Email de confirmação reenviado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação inválida");
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
