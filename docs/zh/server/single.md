# Redis单机
使用docker-compose快速搭建Redis单机，供验证或测试环境使用。

```shell
# 目录
mkdir /data/redis-single
cd /data/redis-single

# 编辑yaml内容
vim docker-compose.yaml

# 后台启动容器
docker compose up -d
```

## 单机
```yaml
services:
  redis:
    image: redis:8
    container_name: redis8-6379
    command: redis-server --requirepass "hepengju"
    restart: always
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
```

## 单机 + SSL
```yaml
services:
  redis:
    image: redis:8
    container_name: redis8-6380-ssl
    command: redis-server --requirepass "hepengju" --port 0 --tls-port 6380 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt
    restart: always
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
```

## 单机快速测试
```shell
docker run -d --name redis-8 --network host --restart always -e TZ=Asia/Shanghai redis:8 redis-server --requirepass "hepengju" --port 6666
```