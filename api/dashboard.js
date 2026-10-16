import { getDb } from './_db.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const db = getDb()
  const recentOrders = [...db.orders].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5)

  res.status(200).json({
    userCount: db.users.length,
    orderCount: db.orders.length,
    salesAmount: db.dashboard.salesAmount,
    conversion: db.dashboard.conversion,
    salesTrend: db.salesTrend,
    channels: db.channels,
    recentOrders,
  })
}
