// Isolated loopback gateway: /auth/v1 -> Auth, /rest/v1 -> PostgREST, /functions/v1/<name> -> candidate handler.
const handlers: Record<string, (r: Request) => Response | Promise<Response>> = {};
const realServe = Deno.serve;
for (const name of ["create-user", "manage-user", "get_user_profile", "create_profile"]) {
  // deno-lint-ignore no-explicit-any
  (Deno as any).serve = (h: any) => { handlers[name] = h; return { finished: Promise.resolve() }; };
  await import(`/dev-server/g0.1/candidate/supabase/functions/${name}/index.ts`);
}
(Deno as any).serve = realServe;
const upstream: Record<string, string> = { auth: "http://127.0.0.1:59999", rest: "http://127.0.0.1:53000" };
// Local stand-in for the managed gateway: permissive loopback CORS so the isolated browser app can call it.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, prefer, accept-profile, content-profile, x-supabase-api-version, range", "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS", "Access-Control-Expose-Headers": "content-range, x-supabase-api-version" };
realServe({ hostname: "127.0.0.1", port: 58000 }, async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const res = await route(req);
  const h = new Headers(res.headers); for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
});
async function route(req: Request): Promise<Response> {
  const u = new URL(req.url);
  const m = u.pathname.match(/^\/(auth|rest|functions)\/v1(\/.*)?$/);
  if (!m) return new Response("not found", { status: 404 });
  if (m[1] === "functions") {
    const h = handlers[(m[2] ?? "").slice(1)];
    return h ? h(req) : new Response("no fn", { status: 404 });
  }
  const headers = new Headers(req.headers); headers.delete("host");
  return fetch(upstream[m[1]] + (m[2] ?? "/") + u.search, { method: req.method, headers, body: req.body, redirect: "manual" });
}
