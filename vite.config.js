import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 只对「零依赖的叶子库」echarts 做手动拆分：它只在仪表盘路由被动态加载，
        // 且不依赖 react/antd，拆出去绝不可能形成循环初始化。
        //
        // 教训：之前用函数把 antd、react 也各自拆成 chunk，
        // 但 node_modules 里路径含 "react" 的模块（如 rc-util 的 React/ 目录）
        // 被错分进 react chunk，而它们又依赖 antd，形成 chunk 间循环引用，
        // 导致 antd 在 React 初始化前执行，线上白屏（Cannot read properties
        // of undefined (reading 'createContext')）。
        // 动态导入的页面路由无论是否配置 manualChunks 都会被自动拆分，
        // 所以其余第三方库交给默认策略即可。
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
          return undefined
        },
      },
    },
  },
})
