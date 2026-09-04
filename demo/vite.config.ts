import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  // ★ 相对路径：GitHub Pages 把站点挂在 /<仓库名>/ 下，写死 '/' 的话
  //   进去就是一片白，而且控制台只报 404，看不出是 base 的问题
  base: './',
  build: { outDir: resolve(__dirname, '../dist-demo'), emptyOutDir: true },
  resolve: {
    // ★ demo 直接吃 src，不吃 dist —— 改一行组件立刻能看到，不用先 build
    alias: { '@liuman/react-contextmenu': resolve(__dirname, '../src/index.ts') },
  },
});
