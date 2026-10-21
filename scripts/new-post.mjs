import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE } from "../blog.config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const boards = SITE.boards.map((board) => board.key);

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
用法：
  npm run new -- "文章标题" --section work
  npm run new -- "文章标题" --section life --tags 随笔,生活

参数：
  --section, -s   放到哪个板块（${boards.join(" / ")}），默认 ${boards[0]}
  --tags, -t      标签，用逗号分隔
  --draft         先存为草稿（不会发布）
  --help, -h      显示帮助
`);
  process.exit(0);
}

let title = "";
let section = boards[0];
let tags = [];
let draft = false;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === "--section" || arg === "-s") {
    section = args[i + 1] || section;
    i += 1;
  } else if (arg === "--tags" || arg === "-t") {
    tags = (args[i + 1] || "")
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    i += 1;
  } else if (arg === "--draft") {
    draft = true;
  } else if (!arg.startsWith("-") && !title) {
    title = arg;
  }
}

title = title.trim();

if (!title) {
  console.error("缺少文章标题。例如：npm run new -- \"我的第一篇文章\" --section life");
  process.exit(1);
}

if (!boards.includes(section)) {
  console.error(`板块「${section}」不存在。可选：${boards.join(" / ")}`);
  process.exit(1);
}

const safeTitle = title
  .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
  .replace(/\s+/g, " ")
  .trim()
  .replace(/\.+$/, "");

if (!safeTitle) {
  console.error("标题去掉文件名非法字符后为空，请换一个标题。");
  process.exit(1);
}

const now = new Date();
const pad = (value) => String(value).padStart(2, "0");
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const postDir = path.join(root, "src", "content", "posts", section);
const postPath = path.join(postDir, `${safeTitle}.md`);
const assetDir = path.join(postDir, safeTitle);

if (fs.existsSync(postPath)) {
  console.error(`文章已存在：${path.relative(root, postPath)}`);
  process.exit(1);
}

const tagLines = tags.length
  ? `tags:\n${tags.map((tag) => `  - ${JSON.stringify(tag)}`).join("\n")}`
  : "tags: []";

const frontMatter = `---
title: ${JSON.stringify(title)}
date: ${date}
${tagLines}
${draft ? "draft: true\n" : ""}---
`;

fs.mkdirSync(postDir, { recursive: true });
fs.writeFileSync(postPath, frontMatter, "utf8");

// 为配图预留同名文件夹，没有图片时可以忽略
if (!fs.existsSync(assetDir)) {
  fs.mkdirSync(assetDir, { recursive: true });
  fs.writeFileSync(path.join(assetDir, ".gitkeep"), "", "utf8");
}

console.log(`
已创建文章：
  ${path.relative(root, postPath)}

配图可以放到：
  ${path.relative(root, assetDir)}/

在 Markdown 里这样引用（文件名替换成你的图片）：
  ![](<${safeTitle}/example.png>)

下一步：
  npm run dev     本地预览
  npm run ship    写完一键发布
`);
