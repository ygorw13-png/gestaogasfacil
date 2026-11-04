import asyncio, json, base64, time, re
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs
HOST = "dufsbwslvnucptjwvtvd.supabase.co"
KEY = "sb-dufsbwslvnucptjwvtvd-auth-token"
UID = "00000000-0000-4000-8000-0000000000a1"
ORG = "00000000-0000-4000-8000-0000000000b1"
def b64(o): return base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip("=")
EXP = int(time.time()) + 7200
JWT = b64({"alg":"HS256","typ":"JWT"})+"."+b64({"sub":UID,"role":"authenticated","exp":EXP,"aud":"authenticated","email":"admin@ficticio.test"})+".sig"
USER = {"id":UID,"aud":"authenticated","role":"authenticated","email":"admin@ficticio.test","app_metadata":{},"user_metadata":{"name":"Admin Fictício"},"created_at":"2026-01-01T00:00:00Z"}
SESSION = {"access_token":JWT,"refresh_token":"r-ficticio","token_type":"bearer","expires_in":7200,"expires_at":EXP,"user":USER}

class Backend:
    def __init__(self, tables=None):
        self.tables = {"profiles":[{"id":UID,"name":"Admin Fictício","role":"admin","organization_id":ORG,"ativo":True}]}
        self.tables.update(tables or {})
        self.fail_get = set()      # tabelas cuja leitura falha
        self.post_handlers = {}    # tabela -> função(body)->(status, json)
        self.writes = []           # toda escrita observada
        self.unknown = set()
    async def handle(self, route):
        req = route.request; u = urlparse(req.url); path = u.path
        if path.startswith("/auth/v1/user"):
            return await route.fulfill(status=200, json=USER)
        if path.startswith("/auth/v1/"):
            return await route.fulfill(status=200, json=SESSION)
        if path.startswith("/functions/v1/get_user_profile"):
            return await route.fulfill(status=200, json={"organizations":{"id":ORG,"name":"Empresa Fictícia","role":"admin","name_user":"Admin Fictício"},"profile":self.tables["profiles"][0]})
        if path.startswith("/rest/v1/"):
            t = path.split("/rest/v1/")[1].split("?")[0]
            if req.method in ("GET","HEAD"):
                if t in self.fail_get:
                    return await route.fulfill(status=500, json={"message":"falha simulada","code":"XX000"})
                if t not in self.tables: self.unknown.add(t)
                rows = self.tables.get(t, [])
                for k, vals in parse_qs(u.query).items():
                    for v in vals:
                        if v.startswith("eq.") and k not in ("select","order"):
                            rows = [r for r in rows if str(r.get(k)) == v[3:]]
                if "vnd.pgrst.object" in (req.headers.get("accept") or ""):
                    if not rows: return await route.fulfill(status=406, json={"message":"no rows","code":"PGRST116"})
                    return await route.fulfill(status=200, json=rows[0])
                return await route.fulfill(status=200, json=rows, headers={"content-range":f"0-{len(rows)}/{len(rows)}"})
            body = None
            try: body = req.post_data_json
            except Exception: body = req.post_data
            self.writes.append({"method":req.method,"table":t,"body":body})
            h = self.post_handlers.get(t)
            if h:
                st, js = h(body)
                return await route.fulfill(status=st, json=js)
            return await route.fulfill(status=500, json={"message":"escrita bloqueada no teste"})
        self.writes.append({"method":req.method,"url":req.url})
        return await route.abort()

async def open_app(pw, backend, viewport=(1280,1800)):
    browser = await pw.chromium.launch(headless=True)
    ctx = await browser.new_context(viewport={"width":viewport[0],"height":viewport[1]})
    await ctx.route(re.compile(r"https://"+re.escape(HOST)+r"/.*"), backend.handle)
    page = await ctx.new_page()
    page.on("console", lambda m: m.type=="error" and print("  console:", m.text[:160]))
    await page.goto("http://localhost:8080/login", wait_until="domcontentloaded")
    await page.evaluate("([k,v]) => localStorage.setItem(k, v)", [KEY, json.dumps(SESSION)])
    return browser, page
