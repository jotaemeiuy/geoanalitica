import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  site: "https://localhost:4321",
  output: "static",
  // Astro 7 cambió el default a 'jsx' (pega palabras alrededor de elementos
  // inline). Se fija en `true` para conservar el comportamiento clásico,
  // crítico aquí por el math inline (<Math display={false} />) en párrafos.
  compressHTML: true,
  markdown: {
    // Pipeline unified explícito (Sätteri es el default en v7 y no entiende
    // remark/rehype). Reservado para futuro contenido .md/.mdx.
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
  build: {
    inlineStylesheets: "auto",
  },
});
