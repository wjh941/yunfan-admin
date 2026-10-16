import { getDb } from '../_db.js'

export default function handler(req, res) {
  const db = getDb()
  const order = db.orders.find(o => o.id === req.query.id)

  if (!order) {
    return res.status(404).json({ message: '订单不存在' })
  }

  if (req.method === 'PATCH') {
    Object.assign(order, req.body)
    return res.status(200).json(order)
  }

  res.status(405).json({ message: 'Method Not Allowed' })
}
