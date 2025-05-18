import { defineConfig } from "astro/config"
import { fileURLToPath, URL } from "node:url"

// https://astro.build/config
import mdx from "@astrojs/mdx"

// https://astro.build/config
export default defineConfig({
  markdown: {
    syntaxHighlight: "prism",
    extendDefaultPlugins: true,
    gfm: true,
  },
  integrations: [mdx()],
  vite: {
    ssr: {
      noExternal: ["modern-normalize"],
    },
    resolve: {
      alias: {
        "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
        "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
        "@images": fileURLToPath(new URL("./src/images", import.meta.url)),
      },
    },
  },
})
