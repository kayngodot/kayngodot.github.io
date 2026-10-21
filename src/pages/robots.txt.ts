import type { APIRoute } from "astro";
import { SITE } from "../../blog.config.mjs";
import { withBase } from "../lib/posts";

export const GET: APIRoute = () => {
  const sitemap = new URL(withBase("/sitemap-index.xml"), SITE.url).href;

  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
};
