#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
/usr/bin/python3 - <<'PY'
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import webbrowser

server = None
for port in range(8766, 8800):
    try:
        server = ThreadingHTTPServer(("127.0.0.1", port), SimpleHTTPRequestHandler)
        break
    except OSError:
        continue
if server is None:
    raise SystemExit("No hay un puerto local libre entre 8766 y 8799.")

url = f"http://127.0.0.1:{server.server_port}/"
print(f"ULTIMATE CLOCK: {url}", flush=True)
print("Dejá esta ventana abierta mientras usás la app. Para detener: Control+C.", flush=True)
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
PY
