// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node'; 

export default defineConfig({
  output: 'server', 
  adapter: node({ 
    mode: 'standalone'
  }),
  
  // >>> CORREÇÃO CRUCIAL PARA COOLIFY/DOCKER <<<
  server: {
    host: true, // Isso força o Node.js a se vincular a 0.0.0.0
  },
  // ------------------------------------------

});