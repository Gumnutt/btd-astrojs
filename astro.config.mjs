import { defineConfig } from "astro/config"

// https://astro.build/config
import vue from "@astrojs/vue"
import mdx from "@astrojs/mdx"

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), mdx()],
  vite: {
    ssr: {
      noExternal: ["modern-normalize"],
    },
  },
})
