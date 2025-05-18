import { defineCollection, z } from "astro:content"
import { glob, file } from "astro/loaders"

const postsCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/posts" }),
  schema: () =>
    z.object({
      title: z.string(),
      published: z.string().transform((str) => new Date(str)),
      description: z.string(),
      tags: z.array(z.string()),
      author: z.string(),
      slug: z.string(),
    }),
})

const projectsCollection = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      link: z.string(),
      image: image()
        .refine(() => true)
        .optional(),
      tags: z.array(z.string()),
      slug: z.string(),
      description: z.string(),
    }),
})

export const collections = {
  posts: postsCollection,
  projects: projectsCollection,
}
