import RSSParser from "rss-parser";
import { Post } from "./types.d.ts";

export const layout = "post.tsx";
export const renderOrder = -1;

export default async function* () {
  const posts = (
    await new RSSParser().parseURL(
      "https://zenn.dev/ras96/feed?include_scraps=1&all=1",
    )
  ).items
    .map(
      (item) => ({
        title: `[🔗Zenn] ${item.title}`,
        url: `/external/zenn${new URL(item.link!).pathname}/`,
        redirectURL: item.link!,
        unlisted: true,
        tags: ["Zenn"],
        date: new Date(item.pubDate ?? ""),
        content: item.contentSnippet,
        thumbnail: item.enclosure?.url,
      } satisfies Post),
    )
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  for (const post of posts) {
    yield post;
  }
}
