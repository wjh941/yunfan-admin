import { getDb } from '../_db.js'

export default function handler(req, res) {
  const db = getDb()
  const id = Number(req.query.id)
  const idx = db.users.findIndex(u => u.id === id)

  if (idx === -1) {
    return res.status(404).json({ message: '用户不存在' })
  }

  if (req.method === 'PATCH') {
    db.users[idx] = { ...db.users[idx], ...req.body }
    return res.status(200).json(db.users[idx])
  }

  if (req.method === 'DELETE') {
    db.users.splice(idx, 1)
    return res.status(200).json({ message: 'ok' })
  }

  res.status(405).json({ message: 'Method Not Allowed' })
}
