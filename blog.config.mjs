/**
 * 站点唯一需要改的配置文件。
 * 改完保存，推送即可。
 */
export const SITE = {
  // 站点标题：出现在首页大标题、浏览器标签页
  title: "白纸",
  // 首页标题下面的一行小字
  tagline: "把读过的、写过的、走过的，都留在这里",
  // 搜索引擎和分享卡片上的简介
  description: "记录代码、研究、阅读、音乐与生活。",
  author: "你的名字",
  email: "you@example.com",

  // 部署地址。换成你自己的 GitHub Pages 地址，例如：
  // https://yourname.github.io
  // 如果部署在子路径（项目仓库），把 base 改成 "/仓库名/"
  url: "https://YOURNAME.github.io",
  base: "/",

  language: "zh-CN",
  // 文章日期按这个时区显示，避免跨时区差一天
  timezone: "Asia/Shanghai",

  // 首页每个板块显示几篇最新文章
  homeLatest: 5,

  footerNote: "工作与生活。",
  searchPlaceholder: "搜索标题、标签或正文",

  // 关于页的自我介绍
  profileTitle: "公开信息",
  profileIntro:
    "主要记录阅读、代码、音乐和生活。这里是我的自留地，也欢迎通过邮箱联系我。",

  /**
   * 两个板块。
   * key 必须和 src/content/posts 下的文件夹同名：
   *   src/content/posts/work/...  -> 工作
   *   src/content/posts/life/...  -> 生活
   * 想改名字就改 title；想改配色就改 accent。
   */
  boards: [
    {
      key: "work",
      title: "工作",
      description: "代码、系统、人工智能与研究笔记。",
      accent: "#2457d6",
    },
    {
      key: "life",
      title: "生活",
      description: "阅读、影像、音乐，以及生活里的碎屑。",
      accent: "#97465a",
    },
  ],
};
