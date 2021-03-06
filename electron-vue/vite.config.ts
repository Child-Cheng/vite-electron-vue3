import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { join } from 'path';
require('dotenv').config({ path: join(__dirname, '.env') })

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: parseInt(process.env.PORT),
  },
  build: {
    outDir: join(__dirname, 'dist/render'),
    assetsDir: '', // 相对路径 加载问题
    rollupOptions: {
      output: {
        format: 'cjs', // 配置 Rollup 打包输出 CommonJs 格式
      },
      external: ['electron'], // 告诉 Rollup 不要去打包 electron
    },
  },
  optimizeDeps: {
    exclude: ['electron'], // 告诉 Vite 不要转换 electron 模块
  },
});