import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "../../blog.config.mjs";
import { excerptOf, getPosts, postUrl, withBase } from "../lib/posts";

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: new URL(withBase("/"), SITE.url).href,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: excerptOf(post, 200),
      link: postUrl(post),
    })),
    customData: `<language>${SITE.language}</language>`,
  });
}
