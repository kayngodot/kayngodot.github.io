import type { APIRoute } from "astro";
import { SITE } from "../../blog.config.mjs";
import {
  boardOf,
  excerptOf,
  formatDate,
  getPosts,
  plainText,
  postUrl,
} from "../lib/posts";

export const GET: APIRoute = async () => {
  const posts = await getPosts();

  const items = posts.map((post) => ({
    title: post.data.title,
    url: postUrl(post),
    date: formatDate(post.data.date),
    board: boardOf(post).title,
    tags: post.data.tags,
    description: excerptOf(post, 160),
    text: plainText(post.body ?? "").slice(0, 4000),
  }));

  return new Response(JSON.stringify(items), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};
