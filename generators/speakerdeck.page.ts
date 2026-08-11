import RSSParser from "rss-parser";
import { Post } from "./types.d.ts";

export const layout = "post.tsx";
export const renderOrder = -1;

export default async function* () {
  const trapPosts = (
    await new RSSParser({
      customFields: {
        item: ["media:content"],
      },
    }).parseURL("https://speakerdeck.com/ras0q.rss")
  ).items
    .map(
      (item) => ({
        title: `[🔗Speaker Deck] ${item.title}`,
        url: `/external/speakerdeck${new URL(item.link!).pathname}/`,
        redirectURL: item.link!,
        unlisted: true,
        tags: ["SpeakerDeck"],
        date: new Date(item.pubDate ?? ""),
        content: item.contentSnippet,
        thumbnail: item["media:content"].$.url,
      } satisfies Post),
    )
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  for (const post of trapPosts) {
    yield post;
  }
}
