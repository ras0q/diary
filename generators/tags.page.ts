export const layout = "home.tsx";
export const tags = ["tag"];

type Data = {
  url: string;
  title: string;
  type: string;
  query: string;
  unlisted?: boolean;
  metas?: {
    robots: string;
  };
};

export default function* ({ search }: Lume.Data) {
  yield {
    url: "/",
    title: "Home",
    type: "tag",
    query: "type!=tag",
  } satisfies Data;

  for (const tag of search.values<string>("tags")) {
    yield {
      url: `/tags/${tag}/`,
      title: `#${tag}`,
      type: "tag",
      query: tag,
      unlisted: true,
      metas: {
        robots: "noindex, follow",
      },
    } satisfies Data;
  }
}
