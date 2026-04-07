## Future

- 改为TypeScript 或 JSDoc以便支持类型提示？
- 调研: 谷歌firebase, 腾讯CloudBase实现用户体系会员登录/连接同步/设置同步等
- 账号: 微信登录后可以同步连接配置和应用配置
- Valkey9.0支持集群模式下的多数据库: rust-rs暂不支持
- Redis其他命令扩展支持
- 新增键后目录节点自动闭合了，需分析原因。已确认原因为ElementPlus版本问题，2.13.5没问题, 2.13.6出问题，因此暂固定版本
- 连接:
    - UNIX socks的支持
    - 连接超时、执行超时的配置
    - SSH隧道
    - 网络代理
    - URL反向解析
- 运行日志
- 值显示: 支持hex,binary,base64等 TODO
- 应用层面的快捷键
- 启动自动压缩是什么鬼？（RedisInsight/TinyRDM里面都有）
- 支持配置分隔符
- SSH隧道支持集群和哨兵