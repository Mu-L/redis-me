- 字体列表读取还是需要rust版本: Windows可以提示，Mac都没有提示 √
- Memory标签页的英文格式有些错乱需处理 √
- 连接的回显问题处理 √
- 英文的配置项说明提示 √

- Mac标题栏显示适配 √
- 默认字体处理：适配MacOS,Linux可以合适显示 √
- 阻止已发布程序的右键reload  √
- 网站初步设计优化
- 各平台打包优化：考虑是否需要Windows绿色版
- 升级检测优化验证
- 连接的前后端同步考虑是否去掉自行同步
- 软件和网站的国际化支持
- 站点文档目录优化

- 发布苹果商店（还需要缴费！）
- 升级内容可以点击更新日志查看
- RedisME官方网站的上线
- Redis哨兵模式的支持

- Gitee的api暂不支直接获取最新release的latest.json文件，已提issue意向
> https://gitee.com/oschina/git-osc/issues/IDERPB?from=project-issue
- v-model.number优化 √
- 监控、发布/订阅优化
- 标准线程无法取消，是否必要使用异步？
- 终端命令是否需要单独的连接？避免相互影响？
- Command是Sized，是否可以定义个父类？
- tauri第三方组件unwrap导致程序直接退出
- tauri考虑是否需要使用异步模式执行
- 执行命令支持数据库切换
- 监控、发布订阅

- Redis的哨兵模式
- 国际化支持
- 微信登录同步账号信息

- dbSize显示出来 √
- 尝试更换secrets设置方式
- 单机、单机-ssl、集群、集群-ssl都验证连接成功 OK
- 连接配置优化，支持选择文件 OK
- INFO的弹框优化，支持全屏 OK
- 设置客户端名称 OK
- 连接怎么selectDB，是否使用1个连接即可？避免每次都更换数据库  OK
- 打开外部链接，跳转到外部官网 OK
- 弹框支持全屏 OK
- 1个连接是否需要连接管理器避免断开？是否有必要使用异步连接？ OK
- tauri的rust代码中如何获取版本？以便设置客户端名称时加入版本号 OK
- 切换DB的时候有必要重新建立连接吗？暂无必要
- 连接的导入导出 OK
- hash、list、set、zset的Scan扫描与非utf-8的bytes支持：ok
- Redis的SSL连接：ok