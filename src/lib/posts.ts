import { getCollection, type CollectionEntry } from "astro:content";
import { SITE } from "../../blog.config.mjs";

export type Post = CollectionEntry<"posts">;
export type Board = (typeof SITE.boards)[number];

/** 加上部署子路径（如果 base 不是 /） */
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base === "/" ? "" : base.replace(/\/$/, "");
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 文件名去掉扩展名，作为文章 URL */
export function slugOf(post: Post): string {
  return post.id.split("/").pop()!.replace(/\.md$/, "");
}

export function postUrl(post: Post): string {
  return withBase(`/posts/${encodeURIComponent(slugOf(post))}/`);
}

/** 文章所在文件夹决定它属于哪个板块 */
export function boardOf(post: Post): Board {
  const folder = post.id.split("/")[0];
  return SITE.boards.find((board) => board.key === folder) ?? SITE.boards[0];
}

export function formatDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE.timezone || "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function yearOf(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE.timezone || "Asia/Shanghai",
    year: "numeric",
  }).format(date);
}

export function plainText(markdown: string): string {
  let text = (markdown || "").split("<!--more-->")[0];
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/~~~[\s\S]*?~~~/g, " ");
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  text = text.replace(/^\s*>\s?/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");
  text = text.replace(/\$\$[\s\S]*?\$\$/g, " ");
  text = text.replace(/\$[^$\n]*\$/g, " ");
  text = text.replace(/[*_~`]/g, "");
  return text.replace(/\s+/g, " ").trim();
}

export function excerptOf(post: Post, max = 110): string {
  if (post.data.description) return post.data.description;
  const text = plainText(post.body ?? "");
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function readingMinutes(post: Post): number {
  const text = plainText(post.body ?? "");
  const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  const words = text.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(cjk / 400 + words / 200);
  return Math.max(1, minutes);
}

export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const diff = b.data.date.valueOf() - a.data.date.valueOf();
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

export async function getPosts(): Promise<Post[]> {
  // 开发模式包含草稿，方便本地预览；正式构建仍然排除
  const includeDrafts = import.meta.env.DEV;
  const posts = sortPosts(
    await getCollection("posts", ({ data }) => includeDrafts || !data.draft),
  );

  const seen = new Map<string, Post>();
  for (const post of posts) {
    const slug = slugOf(post);
    const duplicate = seen.get(slug);
    if (duplicate) {
      throw new Error(
        `文章文件名重复：「${slug}」。\n  ${duplicate.id}\n  ${post.id}\n请把其中一个改名，文件名就是文章网址。`,
      );
    }
    seen.set(slug, post);
  }

  return posts;
}

export function postsInBoard(posts: Post[], boardKey: string): Post[] {
  return posts.filter((post) => boardOf(post).key === boardKey);
}

/**
 * 标签网址只保留安全字符。
 * 例如 "C/C++" -> "C-C++"，"Machine Learning" -> "Machine-Learning"。
 * 显示时仍然用原始标签名。
 */
export function tagSlug(tag: string): string {
  const slug = tag
    .trim()
    .replace(/[/\\?#%]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug || /^\.+$/.test(slug)) return "tag";
  return slug;
}

export function tagUrl(tag: string): string {
  return withBase(`/tags/${encodeURIComponent(tagSlug(tag))}/`);
}

export function getTagEntries(
  posts: Post[],
): { name: string; slug: string; count: number }[] {
  const entries = new Map<string, { name: string; slug: string; count: number }>();
  const owners = new Map<string, string>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = tagSlug(tag);
      const owner = owners.get(slug);

      if (owner && owner !== tag) {
        throw new Error(
          `标签「${owner}」和「${tag}」会生成相同的网址 /tags/${slug}/，请改掉其中一个。`,
        );
      }

      owners.set(slug, tag);

      const entry = entries.get(tag) ?? { name: tag, slug, count: 0 };
      entry.count += 1;
      entries.set(tag, entry);
    }
  }

  return [...entries.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"),
  );
}

export function adjacentPosts(posts: Post[], index: number) {
  return {
    newer: index > 0 ? posts[index - 1] : null,
    older: index < posts.length - 1 ? posts[index + 1] : null,
  };
}
