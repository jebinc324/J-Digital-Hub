#!/usr/bin/env python3
"""J Apps Media Studio — localhost-only uploader, Python standard library.

Run: python3 serve.py
Open: http://127.0.0.1:<random-port>/
Only this computer can connect. GitHub access token lives in browser memory.
No GitHub secrets are stored in files, cookies, or logs.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import mimetypes
import re
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
GITHUB_API = "https://api.github.com/repos/jebinc324/J-Digital-Hub/"
CATALOG_URL = "https://raw.githubusercontent.com/jebinc324/J-Digital-Hub/main/public/apps/catalog.json"
MAX_BODY = 8 * 1024 * 1024
API_PATHS = {
    ("GET", "git/ref/heads/main"),
    ("POST", "git/blobs"), ("POST", "git/trees"), ("POST", "git/commits"),
    ("PATCH", "git/refs/heads/main"),
}
SHA_PATH = re.compile(r"git/commits/[0-9a-f]{40}\Z")
CATALOG_PATH = "contents/public/apps/catalog.json"
MEDIA_PATH = re.compile(r"contents/public/assets/apps/media/[a-z0-9]+(?:-[a-z0-9]+)*\.json\Z")
SECURITY_HEADERS = (
    ("Cache-Control", "no-store, max-age=0"),
    ("X-Content-Type-Options", "nosniff"),
    ("Referrer-Policy", "no-referrer"),
    ("X-Frame-Options", "DENY"),
    ("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"),
)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Do not log requests that may contain auth data or query parameters.
        pass

    def _response(self, code, body=b"", kind="text/plain; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(body)))
        for key, value in SECURITY_HEADERS:
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def _host_ok(self):
        return self.headers.get("Host", "") == f"{HOST}:{self.server.server_port}"

    def _page(self, filename, kind):
        data = (ROOT / filename).read_bytes()
        self._response(200, data, kind)

    def _remote_catalog(self):
        request = Request(CATALOG_URL, headers={"User-Agent": "JAppsMediaStudio/1.0",
                                                "Accept": "application/json"})
        try:
            with urlopen(request, timeout=20) as response:
                data = response.read(3 * 1024 * 1024)
                self._response(200, data, "application/json; charset=utf-8")
        except (HTTPError, URLError, TimeoutError):
            self._response(502, b'{"message":"Could not load GitHub catalogue. Check internet."}', "application/json")

    @staticmethod
    def _valid_route(method, path, query):
        # Intentionally only a small allowlist of GitHub git + catalog endpoints.
        if (method, path) in API_PATHS or (method == "GET" and SHA_PATH.fullmatch(path)):
            return not query
        if method == "GET" and (path == CATALOG_PATH or MEDIA_PATH.fullmatch(path)):
            params = parse_qs(query, keep_blank_values=False)
            return set(params) == {"ref"} and len(params["ref"]) == 1 and bool(
                re.fullmatch("[0-9a-f]{40}", params["ref"][0])
            )
        return False

    def _github(self):
        if self.headers.get("X-Local-Request") != "1":
            self._response(403, b'{"message":"Local editor authorization required."}', "application/json")
            return
        if self.command != "GET" and self.headers.get("Origin") != f"http://{HOST}:{self.server.server_port}":
            self._response(403, b'{"message":"Request must originate from this local editor."}', "application/json")
            return
        auth = self.headers.get("Authorization", "")
        if not re.fullmatch(r"Bearer (?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9_]+)", auth):
            self._response(401, b'{"message":"A valid GitHub token is required."}', "application/json")
            return
        url = urlsplit(self.path)
        endpoint = url.path[len("/github/"):]
        if not self._valid_route(self.command, endpoint, url.query):
            self._response(403, b'{"message":"This GitHub API operation is not allowed."}', "application/json")
            return
        length = self.headers.get("Content-Length", "0")
        if not length.isdigit() or int(length) > MAX_BODY:
            self._response(413, b'{"message":"Upload request too large."}', "application/json")
            return
        body = self.rfile.read(int(length)) if self.command != "GET" else None
        api_url = GITHUB_API + endpoint + (("?" + url.query) if url.query else "")
        headers = {
            "Authorization": auth,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "JAppsMediaStudio/1.0",
        }
        if body is not None:
            headers["Content-Type"] = "application/json"
        request = Request(api_url, data=body, headers=headers, method=self.command)
        try:
            with urlopen(request, timeout=70) as response:
                self._response(response.status, response.read(MAX_BODY),
                               "application/json; charset=utf-8")
        except HTTPError as exc:
            self._response(exc.code, exc.read(2000), "application/json; charset=utf-8")
        except (URLError, TimeoutError):
            self._response(502, b'{"message":"Unable to connect to GitHub API."}', "application/json")

    def do_GET(self):
        if not self._host_ok():
            self._response(403)
            return
        page = urlsplit(self.path).path
        pages = {
            "/": ("index.html", "text/html; charset=utf-8"),
            "/apps/publisher/": ("index.html", "text/html; charset=utf-8"),
            "/apps/publisher/index.html": ("index.html", "text/html; charset=utf-8"),
            "/apps/publisher/publisher.js": ("publisher.js", "text/javascript; charset=utf-8"),
            "/apps/publisher/publisher.css": ("publisher.css", "text/css; charset=utf-8"),
        }
        if page in pages:
            self._page(*pages[page])
        elif page == "/apps/catalog.json":
            self._remote_catalog()
        elif page.startswith("/github/"):
            self._github()
        else:
            self._response(404, b"Not found")

    def do_POST(self):
        if not self._host_ok():
            self._response(403)
            return
        if urlsplit(self.path).path.startswith("/github/"):
            self._github()
        else:
            self._response(404)

    def do_PATCH(self):
        if not self._host_ok():
            self._response(403)
            return
        if urlsplit(self.path).path.startswith("/github/"):
            self._github()
        else:
            self._response(404)


def main():
    with ThreadingHTTPServer((HOST, 0), Handler) as server:
        url = f"http://{HOST}:{server.server_port}/"
        print("\n J Apps Media Studio — PRIVATE LOCAL MODE")
        print(" Controller:", url)
        print(" No public website visitors can reach this controller.")
        print(" GitHub token is required for uploads. Press Ctrl+C to quit.\n")
        threading.Timer(0.7, lambda: webbrowser.open(url)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nLocal Media Studio stopped.")


if __name__ == "__main__":
    main()
