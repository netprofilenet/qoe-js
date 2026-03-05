import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        core: resolve(__dirname, 'src/core/index.ts'),
        ui: resolve(__dirname, 'src/ui/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'js';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: ['chart.js'],
      output: {
        globals: {
          'chart.js': 'Chart'
        },
        // Enable tree-shaking
        preserveModules: false,
      },
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging
        pure_funcs: [], // Don't remove any functions by default
      },
    },
  },
  optimizeDeps: {
    exclude: ['chart.js'],
  },
});
