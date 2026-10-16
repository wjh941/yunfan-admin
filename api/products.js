import { getDb } from './_db.js'

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(getDb().products)
  }
  res.status(405).json({ message: 'Method Not Allowed' })
}
