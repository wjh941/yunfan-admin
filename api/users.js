import { getDb, paged, applyFilters } from './_db.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const db = getDb()
  let list = [...db.users].sort((a, b) => b.id - a.id)
  list = applyFilters(list, req.query, ['name', 'email', 'id'])
  res.status(200).json(paged(list, req.query, res))
}
