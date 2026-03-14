# Redis集群

使用docker-compose快速搭建Redis集群，供验证或测试环境使用。

```shell
# 目录
mkdir /data/redis-cluster
cd /data/redis-cluster

# 编辑yaml内容
vim docker-compose.yaml

# 后台启动容器
docker compose up -d
```

## 集群

```yaml
services:
  redis8-7001:
    image: redis:8
    container_name: redis8-7001
    command: redis-server --cluster-enabled yes --port 7001 --cluster-announce-ip 192.168.1.111 --requirepass hepengju --masterauth hepengju
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
  redis8-7002:
    image: redis:8
    container_name: redis8-7002
    command: redis-server --cluster-enabled yes --port 7002 --cluster-announce-ip 192.168.1.111 --requirepass hepengju --masterauth hepengju
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
  redis8-7003:
    image: redis:8
    container_name: redis8-7003
    command: redis-server --cluster-enabled yes --port 7003 --cluster-announce-ip 192.168.1.111 --requirepass hepengju --masterauth hepengju
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
  redis8-7004:
    image: redis:8
    container_name: redis8-7004
    command: redis-server --cluster-enabled yes --port 7004 --cluster-announce-ip 192.168.1.111 --requirepass hepengju --masterauth hepengju
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
  redis8-7005:
    image: redis:8
    container_name: redis8-7005
    command: redis-server --cluster-enabled yes --port 7005 --cluster-announce-ip 192.168.1.111 --requirepass hepengju --masterauth hepengju
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
  redis8-7006:
    image: redis:8
    container_name: redis8-7006
    command: redis-server --cluster-enabled yes --port 7006 --cluster-announce-ip 192.168.1.111 --requirepass hepengju --masterauth hepengju
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
```

```shell
# 进入容器内部
docker exec -it redis8-7001 bash

# 执行创建集群命令
redis-cli --cluster create 192.168.1.111:7001 192.168.1.111:7002 192.168.1.111:7003 192.168.1.111:7004 192.168.1.111:7005 192.168.1.111:7006  --cluster-replicas 1 --pass hepengju

# 验证集群
redis-cli -p 7001 -c --pass hepengju
cluster nodes
```

## 集群 + SSL

```yaml
services:
  redis8-8001:
    image: redis:8
    container_name: redis8-8001-ssl
    command: redis-server --requirepass "hepengju" --cluster-enabled yes --cluster-announce-ip 192.168.1.111 --masterauth hepengju --port 0 --tls-port 8001 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt --tls-replication yes --tls-cluster yes
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
  redis8-8002:
    image: redis:8
    container_name: redis8-8002-ssl
    command: redis-server --requirepass "hepengju" --cluster-enabled yes --cluster-announce-ip 192.168.1.111 --masterauth hepengju --port 0 --tls-port 8002 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt --tls-replication yes --tls-cluster yes
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
  redis8-8003:
    image: redis:8
    container_name: redis8-8003-ssl
    command: redis-server --requirepass "hepengju" --cluster-enabled yes --cluster-announce-ip 192.168.1.111 --masterauth hepengju --port 0 --tls-port 8003 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt --tls-replication yes --tls-cluster yes
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
  redis8-8004:
    image: redis:8
    container_name: redis8-8004-ssl
    command: redis-server --requirepass "hepengju" --cluster-enabled yes --cluster-announce-ip 192.168.1.111 --masterauth hepengju --port 0 --tls-port 8004 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt --tls-replication yes --tls-cluster yes
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
  redis8-8005:
    image: redis:8
    container_name: redis8-8005-ssl
    command: redis-server --requirepass "hepengju" --cluster-enabled yes --cluster-announce-ip 192.168.1.111 --masterauth hepengju --port 0 --tls-port 8005 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt --tls-replication yes --tls-cluster yes
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
  redis8-8006:
    image: redis:8
    container_name: redis8-8006-ssl
    command: redis-server --requirepass "hepengju" --cluster-enabled yes --cluster-announce-ip 192.168.1.111 --masterauth hepengju --port 0 --tls-port 8006 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt --tls-replication yes --tls-cluster yes
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
```

```shell
# 进入容器内部
docker exec -it redis8-8001-ssl bash

# 执行创建集群命令
redis-cli --cluster create 192.168.1.111:8001 192.168.1.111:8002 192.168.1.111:8003 192.168.1.111:8004 192.168.1.111:8005 192.168.1.111:8006  --cluster-replicas 1 --pass hepengju --tls --cert /etc/redis/redis.crt --key /etc/redis/redis.key --cacert /etc/redis/redis.crt

# 验证集群
redis-cli -p 8001 -c --pass hepengju --tls --cert /etc/redis/redis.crt --key /etc/redis/redis.key --cacert /etc/redis/redis.crt
cluster nodes
```
