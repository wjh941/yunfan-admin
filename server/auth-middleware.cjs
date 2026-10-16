// json-server 自定义中间件：提供 POST /login 登录接口
// 演示两个账号：admin（管理员，全部功能）、guest（只读访客，仅仪表盘和订单）
// 注意 1：必须用 .cjs 后缀，因为本项目 package.json 声明了 "type": "module"
// 注意 2：json-server 的 bodyParser 先于本中间件执行，请求体在 req.body 里；
//         不要再手动读流，否则流已被消费、监听永远不会触发、请求直接挂起
module.exports = (req, res, next) => {
  if (req.method === 'POST' && req.url === '/login') {
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
      res.json({
        token: `jwt.${Buffer.from(`${username}:${Date.now()}`).toString('base64')}.mock`,
        user: account.user,
      })
    } else {
      res.status(401).json({ message: '用户名或密码错误' })
    }
    return
  }
  next()
}
