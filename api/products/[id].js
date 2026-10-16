import { getDb } from '../_db.js'

export default function handler(req, res) {
  const db = getDb()
  const product = db.products.find(p => p.id === Number(req.query.id))

  if (!product) {
    return res.status(404).json({ message: '商品不存在' })
  }

  if (req.method === 'PATCH') {
    Object.assign(product, req.body)
    return res.status(200).json(product)
  }

  res.status(405).json({ message: 'Method Not Allowed' })
}
