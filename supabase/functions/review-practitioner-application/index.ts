// Supabase Edge Function: review-practitioner-application
//
// The ONLY caller of public.review_practitioner_application (EXECUTE is granted
// to service_role alone). Flow:
//   1. Gateway verifies the JWT signature (verify_jwt = true in config.toml).
//   2. We resolve the caller with auth.getUser(jwt) — a server-side check
//      against GoTrue, so revoked/deleted users are rejected.
//   3. We confirm the caller holds 'admin' or 'super_admin' in public.user_roles.
//   4. We validate the body and invoke the RPC with the service-role client,
//      passing the verified caller id as p_reviewer_id. The RPC re-checks the
//      role in-DB (defense in depth).
//
// The service-role key is read from the function's environment (injected by
// Supabase) and never leaves this process. Browsers call this function with
// their normal session JWT via supabase.functions.invoke().

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// Comma-separated list, e.g. "https://homeocircle.in,https://admin.homeocircle.in"
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_STATUSES = new Set([
  "pending_review",
  "needs_information",
  "verified",
  "declined",
  "suspended",
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TEXT = 4000;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

// One client per isolate; no session persistence on the server.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(status: number, body: unknown, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function optionalText(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length > MAX_TEXT) throw new Error(`${field} exceeds ${MAX_TEXT} characters`);
  return trimmed.length ? trimmed : null;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" }, origin);
  }

  // 1–2. Authenticate the caller from their own JWT.
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json(401, { error: "Missing bearer token" }, origin);

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user) return json(401, { error: "Invalid or expired session" }, origin);
  if (user.is_anonymous) return json(403, { error: "Forbidden" }, origin);

  // 3. Authorize: caller must be admin or super_admin.
  const { data: roles, error: rolesError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"]);
  if (rolesError) {
    console.error("role lookup failed", rolesError);
    return json(500, { error: "Authorization check failed" }, origin);
  }
  if (!roles || roles.length === 0) return json(403, { error: "Forbidden" }, origin);

  // 4. Validate input.
  let body: Record<string, unknown>;
  try {
    body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) throw new Error();
  } catch {
    return json(400, { error: "Body must be a JSON object" }, origin);
  }

  const applicationId = body.application_id;
  const newStatus = body.new_status;
  if (typeof applicationId !== "string" || !UUID_RE.test(applicationId)) {
    return json(400, { error: "application_id must be a UUID" }, origin);
  }
  if (typeof newStatus !== "string" || !ALLOWED_STATUSES.has(newStatus)) {
    return json(400, { error: "new_status is invalid" }, origin);
  }

  let decisionReason: string | null;
  let verificationSource: string | null;
  let internalNotes: string | null;
  try {
    decisionReason = optionalText(body.decision_reason, "decision_reason");
    verificationSource = optionalText(body.verification_source, "verification_source");
    internalNotes = optionalText(body.internal_notes, "internal_notes");
  } catch (e) {
    return json(400, { error: (e as Error).message }, origin);
  }

  const { data, error } = await admin.rpc("review_practitioner_application", {
    p_application_id: applicationId,
    p_new_status: newStatus,
    p_reviewer_id: user.id,
    p_decision_reason: decisionReason,
    p_verification_source: verificationSource,
    p_internal_notes: internalNotes,
  });

  if (error) {
    // Log details server-side; return only a coarse category to the browser.
    console.error("review_practitioner_application failed", { code: error.code, message: error.message });
    if (error.code === "42501") return json(403, { error: "Forbidden" }, origin);
    if (error.code === "P0002") return json(404, { error: "Application not found" }, origin);
    if (error.code === "22023" || error.code === "22004") return json(400, { error: "Invalid request" }, origin);
    return json(500, { error: "Review failed" }, origin);
  }

  return json(200, data, origin);
});
