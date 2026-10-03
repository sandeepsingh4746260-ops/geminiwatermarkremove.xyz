import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        image: resolve(__dirname, 'gemini-image-watermark-remover/index.html'),
        video: resolve(__dirname, 'gemini-video-watermark-remover/index.html')
      }
    }
  }
});
