// src/content/config.ts
import { z, defineCollection } from 'astro:content';

const projectsCollection = defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      description: z.string(),
      image: z.string(), // L'URL dell'immagine di copertina
      tags: z.array(z.string()),
      date: z.date(),
      github: z.string().optional(),
      report: z.string().optional(),
    })
});

const story = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        heroBackground: z.string(), // L'immagine di sfondo dati
        heroCutout: z.string(),     // La tua foto scontornata
    })
});

export const collections = { 
    projects: projectsCollection, 
    story 
};