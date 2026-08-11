import { Post } from "../generators/types.d.ts";

export const layout = "base.tsx";

const escapeMarkdown = (text: string, maxLines: number) =>
  text
    .replaceAll("\n\n", "\n")
    .split("\n")
    .filter((line) =>
      line.match(/^\s*<.+<\/\w+>\s*$|^\s*<!--.*-->\s*$|^---+$|^!$/) === null
    )
    .slice(0, maxLines)
    .map((line) =>
      line.replaceAll(
        /^(\s*)(#+|!\[|```+|-\s|\d+\.\s)/g,
        "$1\\$2",
      )
    )
    .join("\n");

export default (data: Lume.Data, helpers: Lume.Helpers) => {
  if (data.query === undefined) {
    return <div>Tag not found!</div>;
  }

  return (
    <div class="flex flex-col gap-4xl">
      <h1 class="text-center m-0">{data.title}</h1>
      <section>
        <div
          id="search"
          class="min-h-51.2px"
          style={{
            "--pagefind-ui-primary": "var(--un-prose-body)",
            "--pagefind-ui-text": "var(--un-prose-body)",
            "--pagefind-ui-background":
              "color-mix(in srgb, var(--un-prose-td-borders) 50%, transparent)",
            "--pagefind-ui-border": "var(--un-prose-td-borders)",
            "--pagefind-ui-tag": "var(--un-prose-td-borders)",
          }}
        >
        </div>
      </section>
      <section class="flex flex-wrap justify-center gap-xs text-2xl">
        {data.search.values<string>("tags").toSorted().map((tag) => (
          <data.comp.Tag key={tag} tag={tag} />
        ))}
      </section>
      <section class="flex flex-col gap-4xl">
        {data.search.pages<Post>(data.query, "date=desc")
          .map((data) => ({
            ...data,
            href: data.redirectURL ?? data.url,
            isExternal: data.redirectURL !== undefined,
          }))
          .map((data) => (
            <article>
              <h2 class="text-2xl m-0">
                <a
                  href={data.href}
                  rel={data.isExternal ? "noopener" : undefined}
                  target={data.isExternal ? "_blank" : undefined}
                >
                  {data.title ?? "Untitled"}
                </a>
              </h2>
              <div class="flex justify-between gap-lg">
                <div>
                  <data.comp.PageData {...data} />
                  {data.content && (
                    <div class="break-all whitespace-pre-wrap line-clamp-3 children:m-0">
                      {helpers.mdRemark(escapeMarkdown(data.content, 4))}
                    </div>
                  )}
                </div>
                {data.thumbnail && (
                  <img
                    src={data.thumbnail}
                    alt={`${data.title ?? "Untitled"}のサムネイル`}
                    loading="lazy"
                    class="not-prose pt-xs w-40% min-w-40% aspect-ratio-[16/9] object-cover"
                  />
                )}
              </div>
            </article>
          ))}
      </section>
    </div>
  );
};
