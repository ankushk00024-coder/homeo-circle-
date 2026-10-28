/**
 * review-application Edge Function
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the ONLY path through which an admin can call review_practitioner_application.
 * The function is server-side; the SERVICE_ROLE_KEY never leaves this environment.
 *
 * Security model:
 *  1. Browser admin client sends the admin's own JWT (Authorization: Bearer <token>).
 *  2. This function verifies the JWT via getUser() and checks the caller's role
 *     is admin or super_admin in public.user_roles.
 *  3. Only after that check passes does it create a supabaseAdmin client
 *     (service_role key) to invoke the RPC. The browser never sees the service key.
 *
 * Deploy: supabase functions deploy review-application
 * Env vars (set via `supabase secrets set`):
 *   SUPABASE_URL              — project URL
 *   SUPABASE_ANON_KEY         — anon key (validates caller JWT, safe to use here)
 *   SUPABASE_SERVICE_ROLE_KEY — server-side only; NEVER exposed to the browser
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_STATUSES = ["pending_review", "needs_information", "verified", "declined", "suspended"] as const;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // 1. Extract caller JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing or invalid Authorization header" }, 401);
    }
    const callerToken = authHeader.slice(7);

    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const anonKey         = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 2. Verify caller identity (uses anon key — the caller's JWT is validated server-side)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized: invalid token" }, 401);
    }

    // 3. Check admin role via service_role client (bypasses RLS on user_roles check)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"]);

    if (rolesError) {
      console.error("Role check error:", rolesError);
      return jsonResponse({ error: "Internal error checking permissions" }, 500);
    }
    if (!roles || roles.length === 0) {
      return jsonResponse({ error: "Forbidden: admin or super_admin role required" }, 403);
    }

    // 4. Parse and validate request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { application_id, new_status, decision_reason, verification_source, internal_notes } = body;

    if (!application_id || typeof application_id !== "string" || !UUID_REGEX.test(application_id)) {
      return jsonResponse({ error: "application_id must be a valid UUID" }, 400);
    }
    if (!new_status || !ALLOWED_STATUSES.includes(new_status as typeof ALLOWED_STATUSES[number])) {
      return jsonResponse({ error: `new_status must be one of: ${ALLOWED_STATUSES.join(", ")}` }, 400);
    }

    // 5. Invoke DB RPC via service_role (DB function also enforces is_admin() internally)
    const { data, error: rpcError } = await supabaseAdmin.rpc("review_practitioner_application", {
      p_application_id:      application_id,
      p_new_status:          new_status,
      p_decision_reason:     (decision_reason     as string | null) ?? null,
      p_verification_source: (verification_source as string | null) ?? null,
      p_internal_notes:      (internal_notes      as string | null) ?? null,
      p_reviewer_id:         user.id,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      const isUserError = rpcError.message?.includes("Application not found")
        || rpcError.message?.includes("Invalid status transition");
      return jsonResponse(
        { error: isUserError ? rpcError.message : "Failed to process review" },
        isUserError ? 400 : 500,
      );
    }

    return jsonResponse(data, 200);
  } catch (err) {
    console.error("Unhandled error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
