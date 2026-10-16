export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { username, password } = req.body ?? {}
  const ACCOUNTS = {
    admin: {
      password: '123456',
      user: {
        name: '管理员',
        role: 'admin',
        avatar: '管',
        // RBAC：权限点由后端下发，前端只负责按权限渲染
        permissions: ['viewUsers', 'viewProducts', 'markOrderDone'],
      },
    },
    guest: {
      password: '123456',
      user: { name: '访客用户', role: 'guest', avatar: '访', permissions: [] },
    },
  }
  const account = ACCOUNTS[username]

  if (account && account.password === password) {
    return res.json({
      token: `jwt.${Buffer.from(`${username}:${Date.now()}`).toString('base64')}.mock`,
      user: account.user,
    })
  }
  res.status(401).json({ message: '用户名或密码错误' })
}
