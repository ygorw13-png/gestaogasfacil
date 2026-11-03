// Isolated loopback gateway: /auth/v1 -> Auth, /rest/v1 -> PostgREST, /functions/v1/<name> -> candidate handler.
const handlers: Record<string, (r: Request) => Response | Promise<Response>> = {};
const realServe = Deno.serve;
for (const name of ["create-user", "manage-user"]) {
  // deno-lint-ignore no-explicit-any
  (Deno as any).serve = (h: any) => { handlers[name] = h; return { finished: Promise.resolve() }; };
  await import(`/dev-server/g0.1/candidate/supabase/functions/${name}/index.ts`);
}
(Deno as any).serve = realServe;
const upstream: Record<string, string> = { auth: "http://127.0.0.1:59999", rest: "http://127.0.0.1:53000" };
realServe({ hostname: "127.0.0.1", port: 58000 }, async (req) => {
  const u = new URL(req.url);
  const m = u.pathname.match(/^\/(auth|rest|functions)\/v1(\/.*)?$/);
  if (!m) return new Response("not found", { status: 404 });
  if (m[1] === "functions") {
    const h = handlers[(m[2] ?? "").slice(1)];
    return h ? h(req) : new Response("no fn", { status: 404 });
  }
  const headers = new Headers(req.headers); headers.delete("host");
  return fetch(upstream[m[1]] + (m[2] ?? "/") + u.search, { method: req.method, headers, body: req.body, redirect: "manual" });
});
