import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        intellicharts: resolve(__dirname, 'src/index.ts'),
        react: resolve(__dirname, 'src/react.tsx')
      },
      name: 'intellicharts',
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'umd.cjs'}`,
    },
    rollupOptions: {
      external: ['echarts', 'react', 'react-dom'],
      output: {
        globals: {
          echarts: 'echarts',
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
