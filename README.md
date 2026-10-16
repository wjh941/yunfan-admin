<div align="center">

# ⛵ 云帆 Admin

**一个用 React 18 + TypeScript 从零实现的中后台管理系统**

JWT 鉴权 · 服务端分页 CRUD · 三级权限 · ⌘K 命令面板 · 暗色模式 · React Query 服务端状态 · 数据可视化 · 前后端一体部署

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-ff4154)](https://tanstack.com/query)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Ant Design](https://img.shields.io/badge/Ant_Design-5-1677ff?logo=antdesign&logoColor=white)](https://ant.design)
[![CI](https://github.com/wjh941/yunfan-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/wjh941/yunfan-admin/actions/workflows/ci.yml)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://yunfan-admin.vercel.app)

</div>

![仪表盘预览](docs/images/dashboard.png)

## ✨ 特性

- 🔐 **JWT 登录鉴权** —— axios 拦截器自动携带 token、401 统一回收登录态、路由守卫 + 登录后回跳
- 🛡️ **RBAC 权限（后端下发）** —— 权限点由登录接口下发，前端按权限动态渲染菜单/路由/按钮（参考 ant-design-pro access 模式）
- 🗂️ **多标签页导航** —— 访问过的页面自动生成标签，可切换/关闭，状态持久化（学习 soybean-admin）
- 📈 **图表下钻** —— 点击趋势图任意位置下钻到该月每日销售额，一键返回全年视图
- 🖱️ **统计卡联动** —— 点击数据卡片跳转对应管理模块，无权限的卡片自动禁用跳转
- ⚡ **React Query 服务端状态** —— 查询缓存（30s 内切页秒开）、翻页 `keepPreviousData` 不闪烁、变更后 `invalidateQueries` 自动失效刷新、通知 30s 轮询
- 🎨 **暗色模式 + 主题过渡动画** —— antd algorithm 全局切换，换肤平滑过渡（学习 soybean-admin）
- ⌨️ **⌘K 命令面板** —— 全局搜索页面 / 用户 / 订单，键盘 ↑↓ 导航、回车跳转
- 📊 **数据可视化** —— ECharts 按需引入（自封装渲染组件，图表包体 -51%），销量排行 / 趋势 / 渠道占比
- 🚀 **路由级代码分割** —— React.lazy + Suspense，每页独立 chunk，echarts(531KB) 仅在仪表盘路由加载
- 🧱 **前后端一体部署** —— 开发环境 json-server，生产环境 Vercel Serverless Functions，接口层零改动切换
- 🧪 **Vitest 单测 + CI** —— 权限判断与分页工具 12 个用例，GitHub Actions 自动执行类型检查 / 测试 / 构建
- 🧭 面包屑导航、返回顶部、页面切换动画、骨架屏、CSV 导出、消息通知中心、响应式布局

## 📈 Lighthouse 跑分

> 生产构建本地跑分（Chrome headless），完整报告见 [docs/lighthouse.html](docs/lighthouse.html)

| 性能   | 可访问性 | 最佳实践 | SEO    | 累积布局偏移 CLS    |
| ------ | -------- | -------- | ------ | ------------------- |
| **89** | **94**   | **96**   | **82** | **0**（无布局抖动） |

首屏 JS 传输约 309KB（gzip），echarts 533KB 仅在仪表盘路由按需加载。

## 🖼️ 界面预览

| 登录                           | 命令面板                                     |
| ------------------------------ | -------------------------------------------- |
| ![登录](docs/images/login.png) | ![命令面板](docs/images/command-palette.png) |

| 用户管理                           | 订单管理                            |
| ---------------------------------- | ----------------------------------- |
| ![用户管理](docs/images/users.png) | ![订单管理](docs/images/orders.png) |

| 暗色模式                               | 无权限访问                  |
| -------------------------------------- | --------------------------- |
| ![暗色模式](docs/images/dark-mode.png) | ![403](docs/images/403.png) |

## 🚀 快速开始

```bash
git clone https://github.com/wjh941/yunfan-admin.git
cd yunfan-admin
npm install

# 终端 1：本地 API（端口 3001）
npm run api

# 终端 2：前端（端口 5173）
npm run dev
```

**演示账号**：`admin / 123456`（管理员）· `guest / 123456`（只读访客）

其他命令：

```bash
npm run build        # tsc 类型检查 + 生产构建
npm run typecheck    # 仅类型检查
npm run preview      # 预览生产构建
node scripts/gen-db.mjs  # 重置本地数据库
```

## 🧱 工程亮点

| 实践                    | 说明                                                                                                       | 效果                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------ |
| axios 二次封装          | 实例化 + 请求/响应拦截器，token 注入、401 回收、错误统一包装                                               | 页面层零错误处理样板           |
| 自封装 EChart 组件      | echarts-for-react 内部全量引入 echarts，按需加载失效；自封装 30 行组件 + echarts/core 注册                 | 图表包体 1052KB → 513KB        |
| manualChunks 函数式分包 | 只对零依赖叶子库（echarts）手动分 chunk，避免 chunk 间循环初始化                                           | 白屏事故排查与修复，见下文踩坑 |
| 路由级代码分割          | React.lazy + Suspense，每页独立 chunk（1~29KB）                                                            | 非仪表盘路由不加载 echarts     |
| 接口层抽象              | 页面只调 api 函数，Mock → json-server → Serverless 三次切换页面代码零改动                                  | —                              |
| React Query 服务端状态  | `useQuery` 缓存 + `keepPreviousData` 翻页不闪烁 + `invalidateQueries` 变更后自动失效刷新，替代手写请求状态 | 消灭手写 loading/竞态/刷新样板 |
| tsc 构建门禁            | `tsc --noEmit && vite build`，类型错误在部署前拦截                                                         | —                              |

## 🕳️ 踩坑记录（真实调试痕迹）

1. **manualChunks 循环引用白屏**：函数式分包把路径含 "react" 的模块（如 rc-util 的 `React/` 目录）错分进 react chunk，而它们又依赖 antd，形成 chunk 间循环引用，antd 在 React 初始化前执行导致线上白屏（`Cannot read properties of undefined (reading 'createContext')`）。**修复**：只对零依赖叶子库手动分包，其余交给默认策略。
2. **Node ESM 相对导入必须带扩展名**：`"type": "module"` 下 `from './_db'` 部署后直接 500。
3. **json-server 中间件**：`"type": "module"` 项目里要用 `.cjs` 后缀；bodyParser 先于自定义中间件执行，手动读流会让请求挂起。
4. **echarts-for-react 按需加载失效**：它内部 `import * as echarts from 'echarts'`（全量），按需引入被整个抵消。
5. **接口层抽象的回报**：Mock → json-server → Serverless 三次切换，页面代码零改动。

## 📁 目录结构

```
├── api/                        # Vercel Serverless 函数（生产后端）
│   ├── _db.js                  #   内存数据库 + 分页工具
│   ├── login.js / users.js / orders.js / products.js ...
├── server/
│   ├── auth-middleware.cjs     # json-server 登录中间件（开发后端）
│   └── db.json                 # 本地数据库（可写）
├── scripts/gen-db.mjs          # 数据库生成/同步脚本
└── src/
    ├── access.ts               # 权限收敛模块（参考 ant-design-pro）
    ├── api/                    # request.ts(axios封装) + index.ts(接口函数)
    ├── components/             # EChart / CommandPalette / NotificationBell / PageLoading
    ├── constants/              # 状态字典
    ├── context/                # AuthContext / ThemeContext
    ├── hooks/                  # useLocalStorage
    ├── layouts/                # 后台骨架
    ├── pages/                  # Login / Dashboard / Users / Orders / Products / Forbidden
    ├── types/                  # 全局业务类型
    └── utils/                  # echarts 按需注册
```

## 🗺️ Roadmap

- [x] React Query 替代手写请求状态（缓存 / 翻页保持 / 失效管理 / 轮询）
- [x] 路由懒加载 + 主题过渡动画
- [x] RBAC 权限后端下发（登录接口返回权限点）
- [x] 多标签页导航
- [x] Vitest 单元测试 + GitHub Actions CI
- [ ] 权限点管理界面（超级管理员可视化编辑角色权限）
- [ ] Vitest 覆盖率提升 + 组件级测试（Testing Library）

## 📄 License

[MIT](LICENSE)
