# ⛵ 云帆 Admin · 后台管理系统

一个用 React 构建的中后台管理系统，对应国内 React 岗位 JD 里最常见的「中后台开发经验」。
当前版本：**真实后端（json-server）+ axios 二次封装 + 双角色权限 + 构建优化**。

## 技术栈

**TypeScript**（strict 模式全量类型覆盖）· React 18 · Vite 5 · Ant Design 5 · ECharts 5（按需引入）· React Router 6 · Axios · json-server + Vercel Serverless

## 测试账号

| 账号 | 密码 | 角色 | 权限 |
|---|---|---|---|
| admin | 123456 | 管理员 | 全部菜单 + 增删改 + 订单「标记完成」 |
| guest | 123456 | 只读访客 | 仅仪表盘/订单管理，无任何写操作 |

## 启动（两个终端）

```bash
# 终端 1：后端 API（端口 3001，数据持久化到 server/db.json）
npm run api

# 终端 2：前端（端口 5173，被占用会自动换）
npm run dev
```

数据库初始化：`node scripts/gen-db.mjs`（修改假数据后重新生成）

## 功能清单

| 模块 | 功能 |
|---|---|
| 登录鉴权 | POST /login 中间件签发 token、axios 拦截器自动携带、401 统一踢回登录页 |
| 仪表盘 | 5 个并发请求聚合数据、统计卡、ECharts 折线/环形图、最近订单 |
| 用户管理 | 服务端分页（X-Total-Count）、q 全文搜索、状态筛选、CRUD 全走真实接口、数据落盘 |
| 订单管理 | 分页 + 状态筛选、详情抽屉、管理员专属「标记完成」（按钮级权限） |
| 商品管理 | 上/下架开关（二次确认）、库存偏低高亮 |
| 权限体系 | 菜单权限（按角色过滤）+ 路由权限（403 页面）+ 按钮权限（条件渲染） |

## 进阶亮点（面试考点）

### 1. axios 二次封装（`src/api/request.js`）
创建实例统一 baseURL → 请求拦截器带 token → 响应拦截器剥数据、401 踢登录、错误统一包装。

### 2. 为什么自封装 EChart 组件而不用 echarts-for-react？
echarts-for-react 内部 `import * as echarts from 'echarts'`（全量），会让按需引入失效。
本项目 `src/utils/echarts.js` 只注册 LineChart/PieChart + `src/components/EChart.jsx` 30 行封装，
echarts 打包体积从 **1052KB 降到 513KB**。

### 3. manualChunks 必须用函数形式
写成 `{ echarts: ['echarts'] }` 会把整包拉进 chunk、破坏 tree-shaking；
函数形式只对实际引用的模块分包。最终产物从单个 2182KB 巨型文件拆为 4 个可独立缓存的 chunk，
总 gzip 从 **709KB 降到 557KB**。

### 4. 踩坑记录（真实调试痕迹）
- **Node ESM 相对导入必须带扩展名**：`"type": "module"` 下 `from './_db'` 直接 500，必须写 `from './_db.js'`（部署后 500 排查出来的）
- json-server 的 `type: module` 项目里中间件要 `.cjs` 后缀
- json-server bodyParser 先于自定义中间件执行，`req.body` 已解析，手动读流会让请求挂起
- 内存 Mock 改真实接口时，页面代码零改动——接口层抽象的价值
- `vercel dev` 可以在本地直接跑 Serverless 函数，是验证线上逻辑的利器

### 5. TypeScript 迁移要点
- `strict: true` 全量覆盖：接口返回值（`PagedResult<T>` / `DashboardData`）、组件 props、事件回调全部显式类型
- 类型收敛在 `src/types/index.ts`，后端改字段时 tsc 直接报错定位所有受影响文件
- 构建命令带类型门禁：`tsc --noEmit && vite build`，类型错误在部署前就被拦下
- 迁移期典型问题：事件回调隐式 any、联合类型字面量拓宽（`type: 'page' as const`）、ref 泛型（`useRef<EChartsType | null>`）

## 部署

```bash
npx vercel login              # 设备授权登录
npx vercel deploy --prod --yes
```

- 前端 + Serverless API 同一项目同域部署，无需自建服务器
- 部署后记得在 Project Settings → Deployment Protection 关闭 Vercel Authentication（否则别人打不开）
- Serverless 数据为冷启动快照，演示用途；生产需接真数据库（Supabase / Turso）

## 目录结构

```
├── server/
│   ├── auth-middleware.cjs    # json-server 登录接口中间件（双账号双角色）
│   └── db.json                # 数据库文件（增删改会真实写盘）
├── scripts/gen-db.mjs         # 数据库生成脚本
└── src/
    ├── api/
    │   ├── request.js         # axios 二次封装（拦截器）
    │   └── index.js           # 接口层：页面只调函数，不关心数据来源
    ├── components/EChart.jsx  # 自封装图表组件（支持按需引入）
    ├── utils/echarts.js       # echarts/core 按需注册
    ├── context/AuthContext.jsx
    ├── layouts/AdminLayout.jsx # 菜单按角色过滤
    ├── App.jsx                 # RequireAuth + RequireRole 双守卫
    └── pages/                  # Login / Dashboard / Users / Orders / Products / Forbidden
```

## 下一步

1. TypeScript 迁移（接口返回值、组件 props 全部标注类型）
2. 部署：前端 Vercel + 后端可换 Supabase/自建服务
3. 权限升级：RBAC 表驱动（权限点配置化）
