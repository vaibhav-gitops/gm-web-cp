import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import rehypePrettyCode from "rehype-pretty-code";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://astroship-pro.web3templates.com",
  image: {
    domains: ["unsplash.com", "images.unsplash.com"],
  },
  integrations: [
    tailwind(),
    mdx(),
    icon(),
    sitemap(),
    react(),
  ],
});