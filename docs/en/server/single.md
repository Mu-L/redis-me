# Redis单机
Quickly set up a Redis using docker-compose for verification or testing environments.

```shell
mkdir /data/redis-single
cd /data/redis-single

vim docker-compose.yaml

docker compose up -d
```

## Redis
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

## Redis + SSL
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