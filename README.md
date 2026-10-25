# 白纸 · 一个安静的 GitHub Pages 博客

一套以「白纸、留白、文字」为主的静态博客。首页分成**工作**和**生活**两块，文章是普通的 Markdown 文件，推送后由 GitHub Actions 自动部署到 GitHub Pages。

基于 Astro 7 独立实现，不是某个主题的魔改。视觉风格参考了 [Lemon Sour](https://amentiraz.github.io/)。

![首页预览](docs/preview.png)

> 在线地址：https://kayngodot.github.io
>
> 想基于它做自己的博客？Fork 后把仓库名改成 `<你的用户名>.github.io`，再按下面的步骤操作。

## 特性

- 首页双栏：工作 / 生活，各自显示最新文章
- 文章页：霞鹜文楷、右侧目录、KaTeX 公式、代码高亮与一键复制、上一篇 / 下一篇
- 归档、标签、全文搜索、RSS、站点地图、404、关于页
- 移动端适配：窄屏自动折叠导航与目录
- 写作只碰 Markdown；`npm run new` 建文章，`npm run ship` 一键发布
- 字体自托管，不依赖第三方 CDN
- 构建、站内链接检查、部署全部自动化

## 环境要求

- Node.js **22.22 或更高**（仓库带 `.nvmrc`，推荐 Node 24）
- npm

## 快速开始

### 1. 获取代码并安装依赖

```bash
git clone https://github.com/kayngodot/kayngodot.github.io.git
cd kayngodot.github.io
npm install
npm run dev
```

打开 `http://localhost:4321` 即可预览。

### 2. 改成你自己的站点

打开根目录的 [`blog.config.mjs`](./blog.config.mjs)，至少改这几项：

```js
title: "白纸",                        // 站点名
tagline: "把读过的、写过的……",          // 首页副标题
author: "kayngodot",
email: "",                             // 留空则关于页不显示邮箱
url: "https://kayngodot.github.io",   // 必须和实际地址一致
```

`url` 会用于 canonical、站点地图和 RSS。没有改的话，部署后这些地址仍然指向 `YOURNAME`。

### 3. 部署到 GitHub Pages

本仓库已经对应 `https://kayngodot.github.io`，并开启了 Pages。日常只需要把改动推送到 `main`。

如果你想从 Fork 或模板新建自己的站点，新建一个 **Public** 仓库，仓库名必须是 `<你的用户名>.github.io`。建好后先进入 **Settings → Pages → Build and deployment**，把 **Source** 选成 **GitHub Actions**，然后再推送代码。

如果代码还没有推到远端：

```bash
git init
git add .
git commit -m "init blog"
git branch -M main
git remote add origin https://github.com/你的用户名/你的用户名.github.io.git
git push -u origin main
```

每次推送到 `main`，[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) 都会自动构建、检查站内链接并部署。等 Actions 里的绿勾出现，访问：

```
https://你的用户名.github.io
```

如果第一次推送时忘了开 Pages，Actions 会失败。去 Settings → Pages 选好 GitHub Actions 之后，在 Actions 页面点 **Re-run jobs** 即可。

## 写作

### 新建文章

```bash
npm run new -- "文章标题" --section life --tags 随笔,生活
```

- `--section work` 放在「工作」
- `--section life` 放在「生活」
- 不写 `--section` 默认放在第一个板块
- `--tags` 用逗号分隔，可以省略
- `--draft` 先存为草稿，只在本地预览，正式构建不会发布

命令会创建：

```
src/content/posts/life/文章标题.md
src/content/posts/life/文章标题/     ← 放配图用
```

### 本地预览

```bash
npm run dev
```

打开 `http://localhost:4321`。改文章或改样式都会自动刷新。开发模式会显示 `draft: true` 的草稿，并带一个「草稿」标记；正式构建会自动排除它们。

### 发布

```bash
npm run ship
```

它会依次做五件事：构建 → 检查站内链接 → 暂存全部改动 → 提交 → 推送。推送后 GitHub Actions 自动上线，通常 1–2 分钟。

也可以自己用 Git：

```bash
git add .
git commit -m "更新文章"
git push
```

如果只想检查链接，构建后运行：

```bash
npm run check:links
```

## 文章格式

最小只需要标题和日期：

```yaml
---
title: 第一篇文章
date: 2026-01-01
tags:
  - 随笔
---
```

全部可用字段：

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题 |
| `date` | 是 | 日期，如 `2026-10-18` 或 `2026-10-18 20:30:00` |
| `tags` | 否 | 标签数组，也可以写 `tags: [随笔, 生活]` |
| `description` | 否 | 列表页摘要；不写会自动截取正文开头 |
| `updated` | 否 | 更新日期，文章页会显示「更新于」 |
| `draft` | 否 | 设为 `true` 后只在本地预览，正式构建不会发布 |

标签可以包含 `/`、空格等字符，网址里会自动转成 `-`。例如 `C/C++` 的标签页是 `/tags/C-C++/`，页面上仍然显示 `C/C++`。

正文就是普通 Markdown，额外支持：

- 数学公式：行内 `$E=mc^2$`，块级 `$$ ... $$`
- 代码块：三反引号 + 语言名，自动高亮并带复制按钮
- 表格、任务列表、脚注（`[^1]`）
- 在正文任意位置写 `<!--more-->`，摘要只取它前面的内容

手动写 front matter 时，如果标题里有英文冒号加空格、`#`、引号等 YAML 特殊字符，记得用双引号包起来，例如 `title: "C# 入门"`。用 `npm run new` 创建的文章会自动处理。

### 图片

把图片放进文章的同名文件夹，然后引用：

```md
![图片描述](<文章标题/图片.png>)
```

方括号里是给读屏软件和图片加载失败时用的描述，建议写一句。尖括号是为了兼容文件名里的空格。**注意大小写**：本地 Windows 不区分大小写，但 GitHub Actions 的 Linux 区分，`Photo.PNG` 和 `photo.png` 会被当成两个文件。

## 配置

站点的大部分个性化都在 [`blog.config.mjs`](./blog.config.mjs)：

- **站名、副标题、作者、邮箱、导航文案**：文件顶部。`email` 留空时，关于页不会显示邮箱
- **两个板块的名字和点缀色**：`boards` 数组，`accent` 支持任意十六进制颜色
- **首页每个板块显示几篇**：`homeLatest`
- **页脚文案**：`footerNote`
- **日期时区**：`timezone`，默认 `Asia/Shanghai`
- **部署地址和子路径**：`url` 与 `base`

想改板块名字？改 `title` 即可，文件夹名（`work` / `life`）不用动。

更细的视觉调整在 [`src/styles/global.css`](./src/styles/global.css) 顶部的 `:root` 变量里，包括字体、字号、间距和颜色。关于页文案在 [`src/pages/about/index.astro`](./src/pages/about/index.astro)。

## 目录结构

```
.
├─ blog.config.mjs            ← 站点配置，先改这里
├─ astro.config.mjs           ← Astro 配置（一般不用动）
├─ package.json
├─ .github/workflows/deploy.yml
├─ docs/preview.png
├─ public/
│  ├─ favicon.svg
│  └─ apple-touch-icon.png
├─ scripts/
│  ├─ new-post.mjs            ← npm run new
│  ├─ check-links.mjs         ← npm run check:links
│  └─ ship.mjs                ← npm run ship
└─ src/
   ├─ content.config.ts       ← 文章字段校验
   ├─ content/posts/
   │  ├─ work/                ← 「工作」板块的文章
   │  └─ life/                ← 「生活」板块的文章
   ├─ pages/                  ← 首页、板块、归档、标签、搜索等页面
   ├─ components/             ← 页头、页脚、文章卡片、目录
   ├─ layouts/                ← 基础布局、文章布局
   ├─ lib/posts.ts            ← 排序、摘要、阅读时长、标签统计
   └─ styles/
      ├─ global.css           ← 全部样式
      └─ fonts-mono.css       ← 只在文章页加载的等宽字体
```

`dist/` 和 `node_modules/` 是生成目录，已经在 `.gitignore` 里。

## 部署说明

### 部署到子路径

如果仓库不叫 `<用户名>.github.io`，而是普通项目仓库（例如 `blog`），站点会部署在 `https://用户名.github.io/blog/`。这时需要改两处：

```js
// blog.config.mjs
url: "https://用户名.github.io",
base: "/blog/",
```

### 绑定自定义域名

1. 在 `public/` 下新建 `CNAME` 文件，内容只写域名，例如 `blog.example.com`
2. 在域名服务商添加 CNAME 记录，指向 `你的用户名.github.io`
3. 仓库 **Settings → Pages → Custom domain** 填入域名并保存
4. 把 `blog.config.mjs` 的 `url` 改成 `https://blog.example.com`，`base` 保持 `/`

## 检查与维护

- `npm run build`：生成 `dist/`
- `npm run check:links`：扫描页面里的站内链接和 CSS 资源，发现失效引用会直接报错
- `npm run ship`：发布前自动完成构建和链接检查
- GitHub Actions：构建后也会执行链接检查，不通过就不会部署

搜索索引在每次构建时重新生成，并带有构建版本号，部署后不会读到旧缓存。

### 关于字体

`dist` 大约 29 MB，因为打包了完整的中文字体分片。访客实际只会下载当前页面用到的几个分片（通常几百 KB）。代码字体已经单独放在 `src/styles/fonts-mono.css`，只在文章页加载；如果完全不在意代码字体，删掉这个文件和 `PostLayout.astro` 里的对应 `import`，能省下约 15 MB。

## 常见问题

**推送后访问 404**

检查 Settings → Pages 的 Source 是否选了 GitHub Actions；再确认仓库是 Public、分支是 `main`。

**Actions 里 `npm ci` 失败**

`package-lock.json` 必须一起提交。不要把它加进 `.gitignore`。

**本地能跑，线上样式或图片丢失**

多半是文件名大小写不一致。Linux 构建是区分大小写的。

**搜索搜不到新文章**

搜索索引在每次构建时重新生成，并带有构建版本号；确认部署成功后再刷新页面即可。

**想改文章网址**

文章 URL 由文件名决定，改名等于改网址。旧链接会失效，尽量不要改已发布的文件名。

## 开始写第一篇

`src/content/posts/work` 和 `life` 已经保留为空目录。现在首页会显示「还没有文章」，这是正常的。直接运行：

```bash
npm run new -- "第一篇文章" --section life
```

写完用 `npm run dev` 预览，`npm run ship` 发布。完整的 front matter 和图片用法见上面的「文章格式」。

---

视觉灵感：[Lemon Sour](https://amentiraz.github.io/)  
构建工具：[Astro](https://astro.build/) · 字体：[霞鹜文楷](https://github.com/lxgw/LxgwWenKai)
