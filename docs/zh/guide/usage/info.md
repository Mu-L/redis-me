# 信息

[RedisME](https://www.hepengju.com) 的信息页(`info`)作为进入连接后默认标签页，整体展示服务器的关键信息。

## 功能简述
- **重点突出**：版本、模式、角色、运行时间等重点展示，支持**查看详情**
- **客户端详情**：点击连接数，弹框展示客户端详情 `client list`，支持关闭指定连接
- **配置弹框**：点击配置，弹框展示配置详情 `config get`
  - 支持和默认值（各版本）**对比与过滤，差异项定义颜色展示**
  - 支持查看官方默认配置文件，便于定制化配置文件
  - 支持配置项的详细解释
  - **支持界面直接编辑配置**
- **内存跳转**：点击跳转到内存分析标签，寻找大键 `memory usage`
- **分类展示**：按照模块分类表格展示，**添加键的详细解释**
- **原始信息**：点击书本图标查看info的原始信息
- **指定节点**：集群模式支持获取**指定节点的info信息**

![main.png](/images/info/main.png)
![client.png](/images/info/client.png)
![config.png](/images/info/config.png)
![raw.png](/images/info/raw.png)
![cluster.png](/images/info/cluster.png)