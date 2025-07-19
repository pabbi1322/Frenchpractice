import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // This allows importing JSON files directly
  assetsInclude: ['**/*.json'],
  // Fix for JSON dependencies
  optimizeDeps: {
    exclude: [
      './src/credentials/google-credentials.json',
      './src/content/words.json',
      './src/content/verbs.json',
      './src/content/sentences.json',
      './src/content/numbers.json'
    ]
  }
});