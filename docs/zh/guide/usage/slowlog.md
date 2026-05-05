# 慢日志

RedisME 的慢日志基于Redis的`slowlog get`命令实现，方便排查问题。

## 功能简述

- 慢日志: 查看慢日志列表，支持模糊过滤、列排序、设置最大获取数量
- 慢参数: 查看慢参数配置，编辑服务器的慢参数配置（集群自动广播到所有节点）

![main.png](../../../public/images/slowlog/main.png)
![edit.png](../../../public/images/slowlog/edit.png)
