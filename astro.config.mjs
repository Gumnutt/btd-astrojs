import { defineConfig } from "astro/config"

import mdx from "@astrojs/mdx"

import { remarkReadingTime } from "./src/utils/calculate-reading-time.mjs"

// https://astro.build/config
export default defineConfig({
  markdown: {
    syntaxHighlight: "prism",
    remarkPlugins: [remarkReadingTime],
    extendDefaultPlugins: true,
    gfm: true,
  },
  integrations: [mdx()],
  vite: {
    ssr: {
      noExternal: ["modern-normalize"],
    },
  },
})
