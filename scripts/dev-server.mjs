import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const requestedRoot = process.argv[2] || ".";
const root = resolve(process.cwd(), requestedRoot);
const preferredPort = Number(process.env.PORT || 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ts": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = decoded === "/" ? "/index.html" : decoded;
  const target = normalize(join(root, clean));
  if (!target.startsWith(root)) return null;
  return target;
}

function createAppServer() {
  return createServer(async (req, res) => {
    const target = safePath(req.url || "/");
    if (!target) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    try {
      const info = await stat(target);
      const file = info.isDirectory() ? join(target, "index.html") : target;
      const data = await readFile(file);
      res.writeHead(200, { "Content-Type": mimeTypes[extname(file)] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  });
}

function listen(port, attempts = 0) {
  const server = createAppServer();
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempts < 20) {
      listen(port + 1, attempts + 1);
      return;
    }
    console.error(error);
    process.exit(1);
  });
  server.listen(port, "0.0.0.0", () => {
    console.log("佳期如梦正在运行：http://localhost:" + port);
  });
}

listen(preferredPort);
