// axios 二次封装：这是「axios 封装」面试题的标准答案结构
// 1. 创建实例（统一 baseURL、超时时间）
// 2. 请求拦截器：自动携带 token
// 3. 响应拦截器：统一剥数据、统一处理 401、统一包装错误信息
import axios from 'axios'

const request = axios.create({
  // 开发环境连本地 json-server（npm run api），生产环境走 Vercel 同域 Serverless API
  baseURL: import.meta.env.DEV ? 'http://localhost:3001' : '/api',
  timeout: 10000,
})

request.interceptors.request.use(config => {
  // token 存在 localStorage 里的是 JSON 字符串，取出来要 parse
  const saved = localStorage.getItem('yunfan_token')
  if (saved) {
    config.headers.Authorization = `Bearer ${JSON.parse(saved)}`
  }
  return config
})

request.interceptors.response.use(
  // 成功：返回完整 response（分页接口需要读 X-Total-Count 响应头）
  res => res,

  // 失败：401 清登录态踢回登录页；其余统一抛出可读的错误信息
  err => {
    const status = err.response?.status
    if (status === 401) {
      localStorage.removeItem('yunfan_token')
      localStorage.removeItem('yunfan_user')
      window.location.href = '/login'
    }
    const message = err.response?.data?.message ?? '网络请求失败，请稍后重试'
    return Promise.reject(new Error(message))
  },
)

export default request
