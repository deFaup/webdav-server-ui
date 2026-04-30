import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isExtension = mode === 'extension';

  return {
    root: '.',
    build: {
      outDir: isExtension ? 'dist-extension' : 'dist',
      rollupOptions: {
        input: isExtension
          ? { tab: resolve(__dirname, 'extension/tab.html') }
          : { main: resolve(__dirname, 'index.html') },
      },
    },
  };
});