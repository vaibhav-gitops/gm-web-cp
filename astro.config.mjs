import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://gitmoxi.io",
  image: {
    domains: [],
  },
  integrations: [
    tailwind(),
    mdx(),
    icon(),
    sitemap(),
    react(),
  ],
  vite: {
    build: {
      assetsInlineLimit: 0, // Prevent any asset inlining
      rollupOptions: {
        output: {
          // Ensure scripts are kept as separate files
          manualChunks: undefined,
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js'
        }
      }
    }
  },
  build: {
    inlineStylesheets: 'never', // Never inline CSS
    // Ensure external scripts stay external
    assets: 'assets'
  }
});