import { defineCollection, z } from "astro:content"

const postsCollection = defineCollection({
  type: "content",
  schema: () =>
    z.object({
      title: z.string(),
      published: z.string().transform((str) => new Date(str)),
      description: z.string(),
    }),
})

const projectsCollection = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      link: z.string(),
      image: image()
        .refine(() => true)
        .optional(),
      tags: z.array(z.string()),
    }),
})

export const collections = {
  posts: postsCollection,
  projects: projectsCollection,
}
