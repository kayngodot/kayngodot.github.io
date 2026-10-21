import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE } from "../blog.config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const base = SITE.base && SITE.base !== "/" ? SITE.base.replace(/\/$/, "") : "";

if (!fs.existsSync(dist)) {
  console.error("dist 不存在。先运行 npm run build。");
  process.exit(1);
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const files = walk(dist);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const cssFiles = files.filter((file) => file.endsWith(".css"));

function internalPath(url) {
  if (
    !url ||
    url.startsWith("#") ||
    url.startsWith("//") ||
    /^(?:[a-z]+:)/i.test(url)
  ) {
    return null;
  }

  let clean = url.split("#")[0].split("?")[0];
  if (!clean) return null;

  if (clean.startsWith("/")) {
    if (base && (clean === base || clean.startsWith(`${base}/`))) {
      clean = clean.slice(base.length) || "/";
    } else if (base) {
      return { url, unresolved: true };
    }
  }

  try {
    clean = decodeURIComponent(clean);
  } catch {
    return { url, unresolved: true };
  }

  return { url, clean };
}

function targetOf(clean, fromFile) {
  const relative = clean.startsWith("/")
    ? path.join(dist, clean)
    : path.resolve(path.dirname(fromFile), clean);

  let target = relative;
  if (clean.endsWith("/")) target = path.join(relative, "index.html");
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, "index.html");
  }
  return target;
}

const links = new Map();
for (const file of htmlFiles) {
  const html = fs
    .readFileSync(file, "utf8")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "");
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1].replaceAll("&amp;", "&");
    if (url.includes("${")) continue;
    const parsed = internalPath(url);
    if (parsed) links.set(parsed.url, parsed);
  }
}

const missingLinks = [];
for (const { url, clean, unresolved } of links.values()) {
  if (unresolved || !clean) {
    missingLinks.push({ url, reason: "无法解析为站内路径" });
    continue;
  }
  const target = targetOf(clean, path.join(dist, "index.html"));
  if (!fs.existsSync(target)) {
    missingLinks.push({ url, reason: path.relative(dist, target) });
  }
}

const assets = new Map();
for (const file of cssFiles) {
  const css = fs.readFileSync(file, "utf8");
  for (const match of css.matchAll(/url\(([^)]+)\)/g)) {
    const url = match[1].trim().replace(/^['"]|['"]$/g, "");
    const parsed = internalPath(url);
    if (parsed) assets.set(`${file}:${parsed.url}`, { ...parsed, file });
  }
}

const missingAssets = [];
for (const { url, clean, unresolved, file } of assets.values()) {
  if (unresolved || !clean) {
    missingAssets.push({ url, reason: "无法解析为站内资源" });
    continue;
  }
  const target = targetOf(clean, file);
  if (!fs.existsSync(target)) {
    missingAssets.push({ url, reason: path.relative(dist, target) });
  }
}

const total = links.size + assets.size;
const missing = [...missingLinks, ...missingAssets];

if (missing.length) {
  console.error(`\n发现 ${missing.length} 个失效的站内引用：\n`);
  for (const item of missing.slice(0, 30)) {
    console.error(`  ${item.url}\n    -> ${item.reason}`);
  }
  if (missing.length > 30) console.error(`  …还有 ${missing.length - 30} 个`);
  process.exit(1);
}

console.log(
  `站内引用检查通过：${htmlFiles.length} 个页面、${links.size} 个链接、${assets.size} 个资源，共 ${total} 项。`,
);
