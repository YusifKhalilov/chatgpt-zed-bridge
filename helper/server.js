import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const PORT = Number(process.env.CHATGPT_ZED_PORT || 8765);
const TOKEN = process.env.CHATGPT_ZED_TOKEN || "chatgpt-zed-bridge-local-v1";
const DIR = join(homedir(), "Library/Caches/chatgpt-zed-bridge");
const EXT = { javascript: "js", typescript: "ts", tsx: "tsx", jsx: "jsx", python: "py", bash: "sh", shell: "sh", json: "json", html: "html", css: "css", sql: "sql", markdown: "md" };

const send = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

const bodyOf = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 5_000_000) throw new Error("Body too large");
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const filename = (lang) => {
  const safe = String(lang || "txt").toLowerCase().replace(/[^a-z0-9+#-]/g, "");
  const ext = EXT[safe] || safe.replace("+", "p") || "txt";
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return join(DIR, `chatgpt-code-${stamp}.${ext}`);
};

const open = async (payload) => {
  if (!payload.text?.trim()) throw new Error("No code text received");
  await mkdir(DIR, { recursive: true });
  const file = filename(payload.lang);
  await writeFile(file, payload.text, "utf8");
  spawn("/usr/local/bin/zed", ["-e", file], { detached: true, stdio: "ignore" }).unref();
  return file;
};

createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true });
    if (req.method !== "POST" || req.url !== "/open") return send(res, 404, { ok: false });
    if (req.headers["x-chatgpt-zed-token"] !== TOKEN) return send(res, 403, { ok: false, error: "Bad token" });
    send(res, 200, { ok: true, file: await open(await bodyOf(req)) });
  } catch (error) {
    send(res, 500, { ok: false, error: error.message });
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`chatgpt-zed-bridge helper listening on http://127.0.0.1:${PORT}`);
});
