import asyncio, json, re
from pathlib import Path
from playwright.async_api import async_playwright

D = Path(__file__).parent; S = D / "shots"; S.mkdir(exist_ok=True)
PW = (D / "pw.txt").read_text().strip(); R = (D / "run.txt").read_text().strip()
BASE = "http://127.0.0.1:8091"
em = lambda n: f"{n}-{R}@example.invalid"
results = []
def rec(name, ok, detail=""):
    results.append({"test": name, "ok": bool(ok), "detail": detail}); print(("PASS" if ok else "FAIL"), name, detail)

async def login(page, who):
    await page.goto(BASE + "/login", wait_until="networkidle")
    await page.locator('input[type="email"]').fill(em(who))
    await page.locator('input[type="password"]').fill(PW)
    await page.locator('button[type="submit"]').first.click()

async def settle(page, ms=4000):
    await page.wait_for_timeout(ms)

async def logout(page):
    btn = page.get_by_role("button", name=re.compile("Sair", re.I)).first
    if await btn.count(): await btn.click()
    else:
        await page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
        await page.goto(BASE + "/login")
    await settle(page, 2500)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width": 1280, "height": 1800})
        async def guard(route):
            u = route.request.url
            if u.startswith("http") and not u.startswith(("http://127.0.0.1", "http://localhost")):
                ext.append(u); await route.abort("blockedbyclient")
            else: await route.continue_()
        ext = []
        await ctx.route("**/*", guard)
        page = await ctx.new_page()
        reqs = []
        page.on("request", lambda r: reqs.append(r.url) if "/functions/v1/" in r.url else None)

        # 1 admin login + routing
        await login(page, "badmin"); await settle(page)
        await page.screenshot(path=str(S / "1_admin.png"))
        rec("B01 admin login -> /painel or admin area", "/login" not in page.url and "/entregador" not in page.url, page.url)
        await page.goto(BASE + "/entregador/entregas"); await settle(page, 2500)
        rec("B02 admin may open courier screens (by design: only entregador is restricted)", "/entregador/entregas" in page.url, page.url)
        await page.goto(BASE + "/clients", wait_until="networkidle"); await settle(page, 3000)
        txt = await page.content()
        rec("B03 admin A sees own company client", "CLIENTE-SECRETO-ORG-A" in txt)
        await page.screenshot(path=str(S / "2_admin_clients.png"))

        # 2 logout, then switch to other company admin
        await logout(page)
        rec("B04 logout returns to login", "/login" in page.url or page.url.rstrip('/') == BASE, page.url)
        await page.goto(BASE + "/clients"); await settle(page, 2500)
        rec("B05 protected route after logout -> login", "/login" in page.url, page.url)
        await login(page, "bother"); await settle(page)
        await page.goto(BASE + "/clients", wait_until="networkidle"); await settle(page, 3000)
        txt = await page.content()
        rec("B06 account switch: previous company data absent", "CLIENTE-SECRETO-ORG-A" not in txt and "CLIENTE-ORG-B" in txt)
        await page.screenshot(path=str(S / "3_other_clients.png"))
        await logout(page)

        # 3 courier login + routing + role guard
        await login(page, "bcourier"); await settle(page)
        await page.screenshot(path=str(S / "4_courier.png"))
        rec("B07 courier login -> /entregador/entregas", "/entregador/entregas" in page.url, page.url)
        await page.goto(BASE + "/clients"); await settle(page, 3000)
        rec("B08 courier blocked from admin route", "/clients" not in page.url, page.url)
        await page.screenshot(path=str(S / "5_courier_admin_route.png"))
        await logout(page)

        # 4 network failure on profile verification, then retry
        state = {"fail": True}
        async def flaky(route):
            if state["fail"]: await route.abort("failed")
            else: await route.continue_()
        await page.route("**/functions/v1/get_user_profile", flaky)
        await page.route("**/rest/v1/rpc/g0_recover_own_profile", flaky)
        await login(page, "bcourier"); await settle(page)
        await page.screenshot(path=str(S / "6_network_fail.png"))
        body = await page.inner_text("body")
        rec("B09 network failure: no access granted, error/retry shown", "/entregador/entregas" not in page.url and "verificar seu acesso" in body, f"{page.url} | {body[:160]!r}")
        state["fail"] = False
        await page.goto(BASE + "/entregador/entregas"); await settle(page, 3000)
        if "/login" in page.url and await page.locator('input[type="email"]').count(): await login(page, "bcourier")
        await settle(page)
        await page.screenshot(path=str(S / "7_retry.png"))
        rec("B10 retry after network recovery reaches courier home", "/entregador/entregas" in page.url, page.url)
        await page.unroute("**/functions/v1/get_user_profile"); await page.unroute("**/rest/v1/rpc/g0_recover_own_profile")
        await logout(page)

        # 5 inactive profile
        await login(page, "binactive"); await settle(page)
        body = await page.inner_text("body")
        await page.screenshot(path=str(S / "8_inactive.png"))
        rec("B11 inactive profile blocked", "/entregador/entregas" not in page.url and "incorretos" not in body, f"{page.url} | {body[:200]!r}")
        await page.goto(BASE + "/entregador/entregas"); await settle(page, 3000)
        body = await page.inner_text("body")
        rec("B12 inactive profile cannot open courier route", "/entregador/entregas" not in page.url or "Tentar novamente" in body, f"{page.url} | {body[:160]!r}")
        await logout(page)

        # 6 missing profile
        await login(page, "bmissing"); await settle(page)
        body = await page.inner_text("body")
        await page.screenshot(path=str(S / "9_missing.png"))
        rec("B13 missing profile blocked", ("/painel" not in page.url and "/entregador" not in page.url) and "incorretos" not in body, f"{page.url} | {body[:200]!r}")
        await logout(page)

        rec("B14 no app request left loopback (cdn script excluded)", all("gpteng.co" in u for u in ext), str(ext[:3]))
        print("FUNCTION CALLS:", sorted(set(re.sub(r"\?.*", "", u) for u in reqs)))
        (D / "results.json").write_text(json.dumps(results, indent=1, ensure_ascii=False))
        await b.close()

asyncio.run(main())
