import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = (name) => fileURLToPath(new URL(`./${name}`, import.meta.url));

// Meerdere pagina's: elke .html hieronder wordt apart gebouwd.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: page('index.html'),
        begeleiding: page('begeleiding.html'),
        werkwijze: page('werkwijze.html'),
        overMij: page('over-mij.html'),
        kennis: page('kennis.html'),
        contact: page('contact.html'),
        notFound: page('404.html'),
      },
    },
  },
});
