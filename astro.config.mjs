import { defineConfig } from 'astro/config';
import node from '@astrojs/node'; // Linha 1: Importa o adaptador Node

// https://astro.build/config
export default defineConfig({
  output: 'server', // Linha 2: Define o modo de renderização como SSR
  adapter: node({ // Linha 3: Adiciona o adaptador
    mode: 'standalone'
  })
});
