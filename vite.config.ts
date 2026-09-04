/**
 * @文件 vite.config.ts
 * @职责 react-contextmenu 库构建（ESM 单包，peer 依赖全部 external）
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'react-contextmenu.js' },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'styled-components', 'antd', '@ant-design/icons'],
    },
    sourcemap: true,
    minify: false,
  },
});
