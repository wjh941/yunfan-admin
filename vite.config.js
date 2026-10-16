import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 手动分包：注意必须用函数形式。
        // 如果写成 { echarts: ['echarts'] } 这种包名形式，会把整个包打包进去，
        // echarts 按需引入的 tree-shaking 就失效了
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
          if (id.includes('antd') || id.includes('@ant-design')) return 'antd'
          if (id.includes('react')) return 'react'
          return undefined
        },
      },
    },
  },
})
