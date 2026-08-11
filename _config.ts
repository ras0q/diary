import lume from "lume/mod.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import extractDate from "lume/plugins/extract_date.ts";
import feed from "lume/plugins/feed.ts";
import jsonLd from "lume/plugins/json_ld.ts";
import jsx from "lume/plugins/jsx.ts";
import lightningCss from "lume/plugins/lightningcss.ts";
import metas, { MetaData } from "lume/plugins/metas.ts";
import minifyHTML from "lume/plugins/minify_html.ts";
import ogImages from "lume/plugins/og_images.ts";
import pagefind from "lume/plugins/pagefind.ts";
import remark from "lume/plugins/remark.ts";
import sitemap from "lume/plugins/sitemap.ts";
import unocss from "lume/plugins/unocss.ts";
import unoConfig from "./uno.config.ts";
import { visit } from "unist-util-visit";
import ogs from "open-graph-scraper";
import type { OgObject } from "open-graph-scraper/types";
import { PluggableList } from "lume/deps/remark.ts";

export const siteTitle = "1245cal";
const siteDescription = "エネルギー 1245cal (1袋当たり)";
const siteLang = "ja";
const isProd = Deno.env.get("DENO_ENV") === "production";
export const siteLocation = isProd
  ? new URL("https://blog.ras0q.com")
  : new URL("http://localhost:3000");

const site = lume({ location: siteLocation });

site.use(extractDate({ remove: false }));

await Deno.mkdir("_cache", { recursive: true });
const kv = await Deno.openKv(
  Deno.env.get("DENO_KV_PATH") ?? "_cache/kv.sqlite",
);
site.addEventListener("afterBuild", () => {
  kv.close();
});

type OgInfo = Pick<OgObject, "ogTitle" | "ogDescription" | "ogImage">;

/**
 * Returns a root-relative image path when the original Markdown image URL points
 * to a local relative asset. External URLs and already-rooted paths are left
 * untouched so existing references keep their intended semantics.
 *
 * @param url Original image URL from the Markdown AST.
 * @returns Normalized URL for downstream HTML conversion.
 */
const normalizeImageUrl = (url: string): string => {
  if (
    url.startsWith("/") ||
    url.startsWith("#") ||
    /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)
  ) {
    return url;
  }

  return `/${url.replace(/^\.\//, "")}`;
};

// Convert raw links to link cards
const ogPlugin: PluggableList[number] = () => {
  const escapeHtml = (s: string) => {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  };

  return async (tree) => {
    const matches: {
      parent: { children: { type: string; value: string }[] };
      index: number;
      url: string;
    }[] = [];

    visit(
      tree,
      "paragraph",
      (node, index, parent) => {
        if (
          index === undefined ||
          node.data !== undefined ||
          node.children.length !== 1
        ) {
          return;
        }

        const linkNode = node.children[0];
        if (linkNode.type !== "link" || linkNode.children.length !== 1) {
          return;
        }

        const { url } = linkNode;
        const textNode = linkNode.children[0];
        if (textNode.type !== "text" || textNode.value !== url) {
          return;
        }

        matches.push({ parent, index, url });
      },
    );

    for (const match of matches) {
      let ogInfo: OgInfo | null;

      const cacheKey = ["og_cache", match.url];
      try {
        const entry = await kv.get<OgInfo>(cacheKey);
        ogInfo = entry.value;
      } catch (e) {
        console.error(`Failed to access KV for ${match.url}:`, e);
        continue;
      }

      if (!ogInfo) {
        console.log(`Fetching OG info: ${match.url}`);
        const { error, result } = await ogs({ url: match.url });
        if (error) {
          throw new Error(`Cannot extract OG info: ${match.url}`);
        }
        const { ogTitle, ogDescription, ogImage } = result;
        ogInfo = {
          ogTitle,
          ogDescription,
          ogImage,
        };
        await kv.set(cacheKey, ogInfo);
      }

      const title = escapeHtml(ogInfo.ogTitle || match.url);
      const description = escapeHtml(ogInfo.ogDescription || "");
      const image = ogInfo.ogImage?.at(0)?.url || "/fallback.svg";
      const html = `
<p class="sr-only"><strong>${title}</strong></p>
<p class="sr-only">${description}</p>
<p><a href="${match.url}" target="_blank" rel="noopener">${match.url}</a></p>
<figure class="linkcard bg-neutral-200 dark:bg-neutral-700 bg-opacity-50!">
  <img src="${image}" alt="${title}のサムネイル" loading="lazy">
  <figcaption>
    <a href="${match.url}" target="_blank" rel="noopener">${title}</a>
    <p>${description}</p>
  </figcaption>
</figure>
`;

      match.parent.children[match.index] = {
        type: "html",
        value: html,
      };
    }
  };
};

// Normalize Markdown image paths before HTML conversion.
const normalizeImagePlugin: PluggableList[number] = () => {
  return (tree) => {
    visit(tree, "image", (node) => {
      node.url = normalizeImageUrl(node.url);
    });
  };
};

// Generate HTML files
site
  .use(remark({
    remarkPlugins: [
      normalizeImagePlugin,
      ogPlugin,
    ],
    rehypePlugins: [
      () => (tree) => {
        visit(tree, "element", (node) => {
          switch (node.tagName) {
            case "img": {
              node.properties.loading = "lazy";
              break;
            }
            case "a": {
              node.properties.class = "decoration-underline";
              node.properties.target = "_blank";
              node.properties.rel = "noopener";
            }
          }
        });
      },
    ],
  }))
  .use(jsx());

// Generate other files
site
  .use(codeHighlight({
    theme: {
      name: "atom-one-light",
    },
  }))
  .use(pagefind())
  .use(sitemap())
  .use(jsonLd())
  .use(
    unocss({
      options: unoConfig,
      transformers: unoConfig.transformers,
    }),
  );

// Optimization
if (isProd) {
  site
    .use(lightningCss({
      options: {
        minify: true,
      },
    }))
    .use(minifyHTML());
}

// Open Graph Images
site.use(ogImages({
  options: {
    fonts: [
      {
        name: "Dela Gothic One",
        weight: 400,
        style: "normal",
        data: (await Deno.readFile(
          "./_fonts/Dela_Gothic_One/DelaGothicOne-Regular.ttf",
        )).buffer,
      },
    ],
  },
}));

// Metas
site.use(metas());

// Feed
site
  .use(
    feed({
      query: "type!=tag",
      info: {
        title: siteTitle,
        lang: siteLang,
      },
      items: {
        content: ({ children }) =>
          typeof children === "string"
            ? (children.includes("at://") ? "" : children)
            : undefined,
      },
    }),
  );

site.data(
  "metas",
  {
    site: siteTitle,
    title: ({ title }) => `${title} | ${siteTitle}`,
    lang: siteLang,
    description: ({ description, content }) =>
      description ??
        (typeof content === "string"
          ? content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(
            0,
            300,
          )
          : siteDescription),
    icon: "/favicon.svg",
    twitter: "@ras0q",
    robots: true,
  } satisfies MetaData,
);

// Site-wide JSON-LD: WebSite schema
site.data("jsonLd", {
  "@type": "WebSite",
  url: "/",
  name: siteTitle,
  description: siteDescription,
  author: {
    "@type": "Person",
    name: "ras0q",
    url: "https://ras0q.com",
  },
});

// Per-post JSON-LD: BlogPosting schema (overrides site-wide WebSite schema)
site.data(
  "jsonLd",
  {
    "@type": "BlogPosting",
    headline: "=title",
    datePublished: "=date",
    description: "=description",
    image: "=thumbnail",
    url: "=url",
    author: {
      "@type": "Person",
      name: "ras0q",
      url: "https://ras0q.com",
    },
    publisher: {
      "@type": "Organization",
      name: siteTitle,
      url: siteLocation,
    },
  },
  "/posts",
);

site.ignore("README.md");
site.ignore("tmp");

site.data("layout", "post.tsx", "/posts");
site.data("openGraphLayout", "og.tsx", "/posts");
site.data("tags", ["Diary"], "/posts");

site.copy("public/", "");
// NOTE: files starting with `_` will not be copied automatically.
site.copy("public/_headers", "_headers");
site.copy("public/_redirects", "_redirects");
site.copy("posts/public", "");

export default site;
