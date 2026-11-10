// Gateway isolado só de loopback: /rest/v1 -> PostgREST; /auth/v1 = stub local (senha fixa de teste, JWT assinado localmente).
import { create, getNumericDate, verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
const secret = Deno.readTextFileSync("/root/iso/secret").trim();
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS", "Access-Control-Expose-Headers": "content-range, x-supabase-api-version" };
const sql = async (q: string) => { const p = new Deno.Command("psql", { args: ["postgresql://postgres@127.0.0.1:55450/postgres?sslmode=disable", "-XAtc", q], env: {} }).outputSync(); return new TextDecoder().decode(p.stdout).trim(); };
const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
async function session(id: string, email: string) {
  const exp = getNumericDate(3600);
  const access_token = await create({ alg: "HS256", typ: "JWT" }, { sub: id, email, role: "authenticated", aud: "authenticated", exp }, key);
  const user = { id, email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  return { access_token, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: `r-${id}`, user };
}
async function auth(req: Request, path: string, u: URL) {
  if (path === "/token") {
    const b = await req.json().catch(() => ({}));
    if (u.searchParams.get("grant_type") === "refresh_token") {
      const id = String(b.refresh_token || "").slice(2); const e = await sql(`select email from auth.users where id='${id.replace(/'/g, "")}'`);
      return e ? j(await session(id, e)) : j({ error: "invalid_grant" }, 400);
    }
    const email = String(b.email || "").replace(/'/g, "");
    const id = await sql(`select id from auth.users where email='${email}'`);
    if (!id || b.password !== "senha-ficticia-123") return j({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return j(await session(id, email));
  }
  if (path === "/user") {
    try { const p = await verify((req.headers.get("authorization") || "").slice(7), key) as any; return j({ id: p.sub, email: p.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} }); }
    catch { return j({ msg: "invalid JWT" }, 401); }
  }
  if (path === "/logout") return new Response(null, { status: 204 });
  return j({ msg: "not supported in isolated stub" }, 404);
}
// Perfil: só o próprio, como a G0.1; nunca cria perfil/empresa.
async function perfil(req: Request) {
  let sub = "";
  try { sub = ((await verify((req.headers.get("authorization") || "").slice(7), key)) as any).sub; } catch { return j({ error: "Unauthorized" }, 401); }
  const b = await req.json().catch(() => ({}));
  if (b.user_id && b.user_id !== sub) return j({ error: "Forbidden" }, 403);
  const r = await sql(`select row_to_json(x) from (select p.*, row_to_json(o) as organizations from public.profiles p left join public.organizations o on o.id=p.organization_id where p.id='${sub}') x`);
  return r ? new Response(r, { headers: { "content-type": "application/json" } }) : j({ error: "User not found" }, 404);
}
Deno.serve({ hostname: "127.0.0.1", port: 58000 }, async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const u = new URL(req.url); const m = u.pathname.match(/^\/(auth|rest|functions)\/v1(\/.*)?$/);
  let res: Response;
  if (!m) res = new Response("not found", { status: 404 });
  else if (m[1] === "auth") res = await auth(req, m[2] ?? "/", u);
  else if (m[1] === "functions" && m[2] === "/get_user_profile") res = await perfil(req);
  else if (m[1] === "functions") res = j({ error: "função não disponível no ambiente isolado" }, 404);
  else { const h = new Headers(req.headers); h.delete("host"); res = await fetch("http://127.0.0.1:53000" + (m[2] ?? "/") + u.search, { method: req.method, headers: h, body: req.body }); }
  const h = new Headers(res.headers); for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
});
