import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * 文章目录：src/content/posts/<板块>/<文件名>.md
 * front matter 只要求 title 和 date，其它都可以不写。
 */
const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // 不写会自动截取正文开头作为摘要
    description: z.string().optional(),
    // 草稿不会出现在任何页面和构建结果里
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
