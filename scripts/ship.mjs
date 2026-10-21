import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const message = args.join(" ").trim() || "post: update";
const astroBin = path.join(root, "node_modules", "astro", "bin", "astro.mjs");
const linkChecker = path.join(root, "scripts", "check-links.mjs");

const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf8",
  });

  if (result.status !== 0 && !options.allowFailure) {
    process.exit(result.status ?? 1);
  }

  return result;
};

if (!fs.existsSync(path.join(root, ".git"))) {
  console.error(`
这个目录还没有关联 Git 仓库，先完成一次初始化：

  git init
  git add .
  git commit -m "init blog"
  git branch -M main
  git remote add origin git@github.com:你的用户名/你的用户名.github.io.git
  git push -u origin main

之后就可以用 npm run ship 一键发布了。
`);
  process.exit(1);
}

if (!fs.existsSync(astroBin)) {
  console.error("还没有安装依赖。先运行一次：npm install");
  process.exit(1);
}

console.log("\n[1/5] 构建检查…\n");
run(process.execPath, [astroBin, "build"]);

console.log("\n[2/5] 检查站内链接…\n");
run(process.execPath, [linkChecker]);

console.log("\n[3/5] 暂存改动…\n");
run("git", ["add", "-A"]);

const staged = run("git", ["diff", "--cached", "--quiet"], { allowFailure: true });
if (staged.status === 0) {
  console.log("没有需要发布的改动。");
  process.exit(0);
}

console.log("\n[4/5] 提交…\n");
run("git", ["commit", "-m", message]);

console.log("\n[5/5] 推送…\n");
const hasUpstream = run("git", ["rev-parse", "--abbrev-ref", "@{u}"], {
  capture: true,
  allowFailure: true,
});

if (hasUpstream.status !== 0 || !hasUpstream.stdout.trim()) {
  run("git", ["push", "-u", "origin", "HEAD"]);
} else {
  run("git", ["push"]);
}

console.log(`
已推送。GitHub Actions 会自动构建并部署，通常 1–2 分钟后上线。
`);
