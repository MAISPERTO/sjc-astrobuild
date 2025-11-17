// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node'; // 1. Importe o adapter

export default defineConfig({
  output: 'server', // 2. Defina a saída como 'server'
  adapter: node({ // 3. Configure o adapter node
    mode: 'standalone'
  })
});
