import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isExtension = mode === 'extension';

  return {
    root: '.',
    server: {
      host: '0.0.0.0',
    },
    build: {
      outDir: isExtension ? 'dist-extension' : 'dist',
      rollupOptions: {
        input: { main: resolve(__dirname, 'index.html') },
      },
    },
  };
});