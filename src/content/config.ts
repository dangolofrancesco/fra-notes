// src/content/config.ts
import { z, defineCollection } from 'astro:content';

const projectsCollection = defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      description: z.string(),
      image: z.string(),
      tags: z.array(z.string()),
      date: z.date(),
      github: z.string().optional(),
      report: z.string().optional(),
    })
});

const blogCollection = defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.date(),
      tags: z.array(z.string()),
      playlist: z.string(),
      playlistSlug: z.string(),
      image: z.string(),
      readingTime: z.number().optional(),
      featured: z.boolean().optional().default(false),
    })
});

export interface BlogTopic {
  slug: string;
  name: string;
  title: string;
  blurb: string;
  intro: string;
  image: string;
}

// Add a new entry here to create a new topic section + dedicated page.
export const blogTopics: BlogTopic[] = [
  {
    slug: "quant",
    name: "Quant",
    title: "My Quant Path",
    blurb: "My journey into quantitative finance — from a computer science background to building trading systems and learning the theory behind the markets.",
    intro: "I come from computer science. When I arrived in Chicago I discovered quantitative finance - a world where mathematics, statistics, and markets intersect in ways I hadn't imagined. But reading papers and textbooks felt too abstract. Coming from an engineering background, I decided the best way to learn was to build.\n\nThese posts document that journey: the theory I had to absorb, the bugs that cost me weeks, and the deeper questions that keep pulling me forward. I'm still early in this path. That's the point.",
    image: "/images/blog/quant/quant_hero.png"
  },
];

const story = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        heroBackground: z.string(),
        heroCutout: z.string(),
    })
});

export const collections = {
    projects: projectsCollection,
    blog: blogCollection,
    story
};
