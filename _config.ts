import lume from "lume/mod.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import feed from "lume/plugins/feed.ts";
import jsx from "lume/plugins/jsx_preact.ts";
import lightningCss from "lume/plugins/lightningcss.ts";
import metas, { MetaData } from "lume/plugins/metas.ts";
import pagefind from "lume/plugins/pagefind.ts";
import sitemap from "lume/plugins/sitemap.ts";
import unocss from "lume/plugins/unocss.ts";
import unoConfig from "./uno.config.ts";
import { siteLang, siteTitle } from "./_includes/libs/consts.ts";

const isProd = Deno.env.get("DENO_ENV") === "production";

const site = lume();

// Extensions
site.use(jsx()).use(metas());

// Generators
site
  .use(codeHighlight({
    theme: {
      name: "atom-one-light",
      path: "/code_light.css",
    },
  }))
  .use(
    feed({
      info: {
        title: siteTitle,
        lang: siteLang,
      },
    }),
  )
  .use(pagefind())
  .use(sitemap())
  .use(
    unocss({
      options: unoConfig,
      transformers: unoConfig.transformers,
      reset: "tailwind-compat",
    }),
  );

// Bundlers
site.use(lightningCss({
  options: {
    minify: isProd,
  },
}));

site.data(
  "metas",
  {
    site: siteTitle,
    title: ({ title }) => `${title} | ${siteTitle}`,
    lang: siteLang,
    description: "Rasによる日記です",
    image: "=image",
    icon: "/favicon.svg",
    twitter: "@ras0q",
    robots: true,
    generator: true,
  } satisfies MetaData,
);

site.data("layout", "markdown.tsx", "/posts");
site.data("tags", ["diary"], "/posts");

site.copy("public", "");

site.parseBasename((basename) => ({
  date: basename.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? undefined,
  basename,
}));

export default site;
