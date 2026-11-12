#!/usr/bin/env bash
# Recria, depois de um reinício do sandbox, o laboratório DESCARTÁVEL: PostgREST 12.2.3 em /root/pgrst-bin,
# /root/iso/{secret,pgrst.conf} e o cluster PostgreSQL local (127.0.0.1:55450). Nunca toca no Cloud.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
mkdir -p /root/pgrst-bin/bin /root/iso
if [ ! -x /root/pgrst-bin/bin/postgrest ]; then
  curl -sSL -o /tmp/pgrst.tar.xz https://github.com/PostgREST/postgrest/releases/download/v12.2.3/postgrest-v12.2.3-linux-static-x64.tar.xz
  python3 -c "import lzma,tarfile; tarfile.open(fileobj=lzma.open('/tmp/pgrst.tar.xz')).extractall('/root/pgrst-bin/bin')"
fi
[ -s /root/iso/secret ] || openssl rand -hex 32 > /root/iso/secret
cp "$ROOT/g1/tests/browser/pgrst.conf.example" /root/iso/pgrst.conf
export LANG=C.UTF-8 LC_ALL=C.UTF-8 G1DB=${G1DB:-/tmp/g1db}
bash "$ROOT/g1/tests/sql/setup_cluster.sh"
echo "laboratório base pronto"
