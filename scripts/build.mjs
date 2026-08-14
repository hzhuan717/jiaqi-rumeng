import { mkdir, readFile, rm, writeFile, cp, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)).replace(/\\scripts$/, "").replace(/\/scripts$/, "");
const dist = join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, "src"), join(dist, "src"), { recursive: true });

const assetsDir = join(root, "assets");
if (await stat(assetsDir).then(() => true).catch(() => false)) {
  await cp(assetsDir, join(dist, "assets"), { recursive: true });
}

const sourceData = await readFile(join(root, "src", "data", "loveData.ts"), "utf8");
await writeFile(join(root, "src", "data", "loveData.js"), sourceData, "utf8");
await writeFile(join(dist, "src", "data", "loveData.js"), sourceData, "utf8");

const indexHtml = await readFile(join(root, "index.html"), "utf8");
await writeFile(join(dist, "index.html"), indexHtml, "utf8");
console.log("构建完成：dist");
