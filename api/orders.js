import { getDb, paged, applyFilters } from './_db.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const db = getDb()
  let list = [...db.orders].sort((a, b) => b.id.localeCompare(a.id))
  list = applyFilters(list, req.query, ['id', 'product', 'userName'])
  res.status(200).json(paged(list, req.query, res))
}
