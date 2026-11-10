# Servidor estático só de loopback para a cópia isolada do app (SPA: rotas caem no index.html).
import http.server, os, sys
D = sys.argv[1] if len(sys.argv) > 1 else "/tmp/iso-dist"

class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k):
        super().__init__(*a, directory=D, **k)

    def send_head(s):
        if not os.path.isfile(D + s.path.split("?")[0]):
            s.path = "/index.html"
        return super().send_head()

http.server.ThreadingHTTPServer(("127.0.0.1", 8091), H).serve_forever()
