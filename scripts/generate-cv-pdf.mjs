import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { copyFile, mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const JOBS = [
  { source: "cv.html", output: "Jesus-Lozada-CV-EN.pdf" },
  { source: "es/cv.html", output: "Jesus-Lozada-CV-ES.pdf" },
];

const EDGE_CANDIDATES = [
  process.env.EDGE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/microsoft-edge",
  "/usr/bin/microsoft-edge-stable",
  "/usr/bin/google-chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function startServer() {
  return new Promise((resolveServer, reject) => {
    const server = createServer(async (request, response) => {
      try {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");
        const requestPath = decodeURIComponent(url.pathname);
        const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
        const filePath = normalize(join(DIST, relative));

        if (!filePath.startsWith(DIST + sep)) {
          response.writeHead(403).end("Forbidden");
          return;
        }

        const stats = await stat(filePath).catch(() => null);
        if (!stats?.isFile()) {
          response.writeHead(404).end("Not found");
          return;
        }

        response.writeHead(200, {
          "Content-Type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
          "Cache-Control": "no-store",
        });
        createReadStream(filePath).pipe(response);
      } catch (error) {
        response.writeHead(500).end(String(error));
      }
    });

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolveServer({ server, port: address.port });
    });
  });
}

async function findEdge() {
  for (const candidate of EDGE_CANDIDATES) {
    if (await pathExists(candidate)) return candidate;
  }
  return null;
}

function runEdge(edge, url, pdfPath, profileDir) {
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-pdf-header-footer",
    "--hide-scrollbars",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=8000",
    `--user-data-dir=${profileDir}`,
    `--print-to-pdf=${pdfPath}`,
    url,
  ];

  return new Promise((resolveRun, reject) => {
    const child = spawn(edge, args, { stdio: "ignore", windowsHide: true });
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("La generación del PDF excedió 60 segundos."));
    }, 60_000);

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.on("exit", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolveRun();
      } else {
        reject(new Error(`Edge terminó con código ${code}.`));
      }
    });
  });
}

async function main() {
  const missingSources = [];
  for (const job of JOBS) {
    if (!(await pathExists(join(DIST, job.source)))) missingSources.push(job);
  }
  if (missingSources.length) {
    console.error(`Faltan páginas compiladas: ${missingSources.map((job) => job.source).join(", ")}. Ejecuta \`npm run build\` antes de generar los PDFs.`);
    process.exitCode = 1;
    return;
  }

  const edge = await findEdge();
  if (!edge) {
    console.error("No se encontró Microsoft Edge/Chrome. Genera los PDFs imprimiendo cv.html y es/cv.html desde el navegador.");
    process.exitCode = 1;
    return;
  }

  const profileDir = await mkdtemp(join(tmpdir(), "jl-cv-"));
  const { server, port } = await startServer();
  const generated = [];

  try {
    console.log(`Usando: ${edge}`);
    for (const job of JOBS) {
      const pdfPath = join(profileDir, job.output);
      console.log(`Renderizando http://127.0.0.1:${port}/${job.source} …`);
      await runEdge(edge, `http://127.0.0.1:${port}/${job.source}`, pdfPath, profileDir);

      const buffer = await readFile(pdfPath);
      if (buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
        throw new Error(`El navegador no generó un PDF válido para ${job.source}.`);
      }

      const publicAsset = join(ROOT, "public", "assets", job.output);
      const distAsset = join(DIST, "assets", job.output);
      await mkdir(join(ROOT, "public", "assets"), { recursive: true });
      await mkdir(join(DIST, "assets"), { recursive: true });
      await copyFile(pdfPath, publicAsset);
      await copyFile(pdfPath, distAsset);
      generated.push({ publicAsset, distAsset, size: buffer.length });
    }

    for (const item of generated) {
      console.log(`PDF generado (${Math.round(item.size / 1024)} KB):`);
      console.log(`  ${item.publicAsset}`);
      console.log(`  ${item.distAsset}`);
    }
  } finally {
    server.close();
    await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
