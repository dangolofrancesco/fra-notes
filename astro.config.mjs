// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  },
  integrations: [mdx({
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  })],
  vite: {
    plugins: [tailwindcss()]
  }
});