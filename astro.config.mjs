import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://gitmoxi.io",
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