# Redis哨兵
使用docker-compose快速搭建Redis集群，供验证或测试环境使用。

```shell
# 目录
mkdir /data/redis-sentinel
cd /data/redis-sentinel

# 编辑yaml内容
vim docker-compose.yaml

# 后台启动容器
docker compose up -d
```

## 哨兵
## 哨兵 + SSL