#!/usr/bin/env bash
# Constrói a CÓPIA ISOLADA do app (/tmp/iso-fe -> /tmp/iso-dist) apontando só para o gateway local 127.0.0.1:58000,
# com VITE_G1_ACOES=on. O código ativo do projeto não é alterado: os dois ajustes de laboratório (CSP para o
# gateway local e sem redirecionar para https) são aplicados apenas na cópia. A chave pública local é assinada
# com /root/iso/secret (gerado localmente; nunca o do Cloud). Falha se sobrar endereço do backend real no pacote.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
[ -s /root/iso/secret ] || { mkdir -p /root/iso; openssl rand -hex 32 > /root/iso/secret; }
rm -rf /tmp/iso-fe /tmp/iso-dist; mkdir -p /tmp/iso-fe
(cd "$ROOT" && tar --exclude=./node_modules --exclude=./.git --exclude=./g0.1 --exclude=./g1 --exclude=./dist --exclude=./docs --exclude=./.env -cf - .) | tar -xf - -C /tmp/iso-fe
ln -s "$ROOT/node_modules" /tmp/iso-fe/node_modules
ANON=$(deno eval 'import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts"; const s=Deno.readTextFileSync("/root/iso/secret").trim(); const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(s),{name:"HMAC",hash:"SHA-256"},false,["sign"]); console.log(await create({alg:"HS256",typ:"JWT"},{role:"anon",iss:"local-lab",exp:4102444800},k));' 2>/dev/null)
printf 'VITE_SUPABASE_URL=http://127.0.0.1:58000\nVITE_SUPABASE_PUBLISHABLE_KEY=%s\nVITE_SUPABASE_PROJECT_ID=laboratorio-local\nVITE_G1_ACOES=on\n' "$ANON" > /tmp/iso-fe/.env
cd /tmp/iso-fe
sed -i "s#connect-src 'self' https://\*.supabase.co#connect-src 'self' http://127.0.0.1:58000#" src/components/security/SecurityHeaders.tsx
grep -q "127.0.0.1:58000" src/components/security/SecurityHeaders.tsx
python3 - <<'PY'
p='src/utils/securityUtils.ts'; s=open(p).read(); a="export const enforceHttps = (): void => {\n"
assert a in s; open(p,'w').write(s.replace(a, a + "  return; // CÓPIA ISOLADA: laboratório em http://localhost\n", 1))
PY
# Variáveis do ambiente têm prioridade sobre o .env no Vite: retira as do projeto real antes de construir.
env -u VITE_SUPABASE_URL -u VITE_SUPABASE_PUBLISHABLE_KEY -u VITE_SUPABASE_PROJECT_ID -u VITE_SUPABASE_ANON_KEY -u VITE_G1_ACOES \
  ./node_modules/.bin/vite build --outDir /tmp/iso-dist >/tmp/iso-build.log 2>&1 || { tail -20 /tmp/iso-build.log; exit 1; }
if grep -Eq "https://[a-z0-9]{20}\.supabase\.co" /tmp/iso-dist/assets/*.js; then echo "ERRO: pacote isolado contém endereço do backend real" >&2; exit 1; fi
grep -lq "127.0.0.1:58000" /tmp/iso-dist/assets/*.js
echo "cópia isolada pronta em /tmp/iso-dist"
