import type {
  ChannelItem,
  DailySales,
  Order,
  OrderStatus,
  Product,
  SalesTrend,
  User,
} from '../types'

// 确定性伪随机：同样的序号永远生成同样的数据，演示效果稳定
function seeded(n: number) {
  const x = Math.sin(n * 999 + 7) * 10000
  return x - Math.floor(x)
}

const NAME_POOL = [
  '张伟',
  '王芳',
  '李娜',
  '刘洋',
  '陈静',
  '杨帆',
  '赵磊',
  '黄敏',
  '周涛',
  '吴倩',
  '徐强',
  '孙丽',
  '马超',
  '朱婷',
  '胡军',
  '郭欣',
  '林峰',
  '何雨',
  '高远',
  '罗雪',
]
const ROLES = ['管理员', '运营', '编辑', '访客']
const DOMAINS = ['qq.com', '163.com', 'gmail.com', 'outlook.com']

export const users: User[] = Array.from({ length: 47 }, (_, i) => ({
  id: 1000 + i,
  name:
    i < NAME_POOL.length
      ? NAME_POOL[i]
      : NAME_POOL[Math.floor(seeded(i + 1) * NAME_POOL.length)] +
        String(10 + Math.floor(seeded(i + 23) * 89)),
  age: 18 + Math.floor(seeded(i + 2) * 30),
  email: `user${1000 + i}@${DOMAINS[Math.floor(seeded(i + 3) * DOMAINS.length)]}`,
  role: ROLES[Math.floor(seeded(i + 4) * ROLES.length)],
  status: seeded(i + 5) > 0.2 ? 'active' : 'disabled',
  createdAt: `2026-${String(1 + Math.floor(seeded(i + 6) * 10)).padStart(2, '0')}-${String(
    1 + Math.floor(seeded(i + 7) * 28),
  ).padStart(2, '0')}`,
}))

const PRODUCT_POOL = [
  '智能手表 Pro',
  '无线降噪耳机',
  '机械键盘 87键',
  '4K 显示器 27寸',
  '便携充电宝 2万毫安',
  '电竞鼠标',
  '高清摄像头',
  '蓝牙音箱',
  '平板电脑 11寸',
  '智能台灯',
]
const ORDER_STATUS: OrderStatus[] = ['pending', 'paid', 'done', 'cancelled']

// 420 笔订单铺满 10 个月：既让「分产品」多折线平滑可读，也更能展示服务端分页
export const orders: Order[] = Array.from({ length: 420 }, (_, i) => {
  const product = PRODUCT_POOL[Math.floor(seeded(i + 11) * PRODUCT_POOL.length)]
  const user = users[Math.floor(seeded(i + 12) * users.length)]
  const month = String(1 + Math.floor(seeded(i + 15) * 10)).padStart(2, '0')
  const day = String(1 + Math.floor(seeded(i + 16) * 28)).padStart(2, '0')
  const hour = String(Math.floor(seeded(i + 17) * 24)).padStart(2, '0')
  const minute = String(Math.floor(seeded(i + 18) * 60)).padStart(2, '0')
  return {
    id: `SO2026${String(88000 + i * 3)}`,
    product,
    qty: 1 + Math.floor(seeded(i + 19) * 3),
    amount: Math.floor(seeded(i + 13) * 4000 + 99),
    userName: user.name,
    status: ORDER_STATUS[Math.floor(seeded(i + 14) * ORDER_STATUS.length)],
    createdAt: `2026-${month}-${day} ${hour}:${minute}`,
  }
})

const CATEGORIES = ['数码', '配件', '家居']

// 商品图文案：emoji 当商品图（离线可用），desc 用于详情页（键必须与商品名完全一致）
const PRODUCT_META: Record<string, { emoji: string; desc: string }> = {
  '智能手表 Pro': { emoji: '⌚', desc: 'AMOLED 视网膜屏，血氧心率全天监测，超长续航 14 天' },
  无线降噪耳机: { emoji: '🎧', desc: '40dB 主动降噪，HiFi 音质，单次续航 30 小时' },
  '机械键盘 87键': { emoji: '⌨️', desc: '全键热插拔轴体，全键无冲，PBT 注塑键帽' },
  '4K 显示器 27寸': { emoji: '🖥️', desc: '4K IPS 面板，Type-C 65W 反向充电，升降旋转支架' },
  '便携充电宝 2万毫安': { emoji: '🔋', desc: '22.5W 超级快充，支持登机，LED 数显电量' },
  电竞鼠标: { emoji: '🖱️', desc: '26000 DPI 电竞引擎，58g 轻量化设计，RGB 灯效' },
  高清摄像头: { emoji: '📷', desc: '2K 画质，AI 自动对焦，内置双降噪麦克风' },
  蓝牙音箱: { emoji: '🔊', desc: '360° 环绕音效，IPX7 防水，单次续航 24 小时' },
  '平板电脑 11寸': { emoji: '📱', desc: '2.5K 120Hz 高刷屏，支持手写笔，八扬声器环绕' },
  智能台灯: { emoji: '💡', desc: '国 AA 级照度，无蓝光危害，入座自动亮灯' },
}

export const products: Product[] = PRODUCT_POOL.map((name, i) => ({
  id: 1 + i,
  name,
  emoji: PRODUCT_META[name].emoji,
  desc: PRODUCT_META[name].desc,
  category: CATEGORIES[Math.floor(seeded(i + 21) * CATEGORIES.length)],
  price: Math.floor(seeded(i + 22) * 4000 + 99),
  stock: Math.floor(seeded(i + 25) * 500),
  sold: Math.floor(seeded(i + 26) * 800 + 50),
  onSale: seeded(i + 24) > 0.25,
}))

// 图表数据
export const salesTrend: SalesTrend = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月'],
  values: [82, 93, 101, 97, 118, 132, 129, 145, 158, 172],
}

// 每月每日销售额（图表下钻数据）：随机权重归一化，让每日之和等于当月总额
export const salesDaily: Record<string, DailySales> = Object.fromEntries(
  salesTrend.months.map((month, i) => {
    const total = salesTrend.values[i]
    const dayCount = 30
    const weights = Array.from({ length: dayCount }, (_, j) => 0.6 + seeded(i * 37 + j + 101))
    const sum = weights.reduce((a, b) => a + b, 0)
    const values = weights.map((w) => +((w / sum) * total).toFixed(1))
    const monthNo = i + 1
    const days = Array.from({ length: dayCount }, (_, j) => `${monthNo}/${j + 1}`)
    return [month, { days, values }]
  }),
)

export const channels: ChannelItem[] = [
  { name: '直接访问', value: 335 },
  { name: '搜索引擎', value: 274 },
  { name: '广告投放', value: 190 },
  { name: '社交推荐', value: 154 },
]
