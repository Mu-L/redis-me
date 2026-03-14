# Redis Sentinel

Quickly set up a Redis Sentinel using docker-compose for verification or testing environments.

```shell
mkdir /data/redis-sentinel
cd /data/redis-sentinel

vim docker-compose.yaml

docker compose up -d
```

## Sentinel

### config

Sentinel must use a configuration file when running, because the system will use this file to save the current state for reloading upon restart. If no configuration file is provided or the configuration file path is not writable, Sentinel will refuse to start.

```shell
mkdir config-2770{1,2,3}

vim config-27701/sentinel.conf

port 27701
requirepass "hepengjuSentinel"
sentinel monitor mymaster 192.168.1.111 7701 1
sentinel down-after-milliseconds mymaster 30000
sentinel failover-timeout mymaster 180000
sentinel parallel-syncs mymaster 1
sentinel auth-pass mymaster "hepengju"
sentinel announce-ip 192.168.1.111

vim config-27702/sentinel.conf

port 27702
requirepass "hepengjuSentinel"
sentinel monitor mymaster 192.168.1.111 7702 1
sentinel down-after-milliseconds mymaster 30000
sentinel failover-timeout mymaster 180000
sentinel parallel-syncs mymaster 1
sentinel auth-pass mymaster "hepengju"
sentinel announce-ip 192.168.1.111

vim config-27703/sentinel.conf

port 27703
requirepass "hepengjuSentinel"
sentinel monitor mymaster 192.168.1.111 7703 1
sentinel down-after-milliseconds mymaster 30000
sentinel failover-timeout mymaster 180000
sentinel parallel-syncs mymaster 1
sentinel auth-pass mymaster "hepengju"
sentinel announce-ip 192.168.1.111

# permission
chmod -R 777 config-27701/ config-27702/ config-27703/
```

### docker-compose.yaml

```yaml
services:
  redis8-7701:
    image: redis:8
    container_name: redis8-7701
    command: redis-server --port 7701 --requirepass hepengju --masterauth hepengju --replica-announce-ip 192.168.1.111
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
  redis8-7702:
    image: redis:8
    container_name: redis8-7702
    command: redis-server --port 7702 --requirepass hepengju --masterauth hepengju --replica-announce-ip 192.168.1.111 --replicaof 192.168.1.111 7701
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
  redis8-7703:
    image: redis:8
    container_name: redis8-7703
    command: redis-server --port 7703 --requirepass hepengju --masterauth hepengju --replica-announce-ip 192.168.1.111 --replicaof 192.168.1.111 7701
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
  redis8-27701:
    image: redis:8
    container_name: redis8-27701
    command: redis-sentinel /etc/redis/sentinel.conf
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./config-27701/:/etc/redis/
  redis8-27702:
    image: redis:8
    container_name: redis8-27702
    command: redis-sentinel /etc/redis/sentinel.conf
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./config-27702/:/etc/redis/
  redis8-27703:
    image: redis:8
    container_name: redis8-27703
    command: redis-sentinel /etc/redis/sentinel.conf
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./config-27703/:/etc/redis/
```

## Sentinel + SSL

### config

```shell
mkdir config-2880{1,2,3}

vim config-28801/sentinel.conf

port 0
tls-port 28801
tls-cert-file /etc/redis/redis.crt
tls-key-file /etc/redis/redis.key
tls-ca-cert-file /etc/redis/redis.crt
tls-replication yes
tls-cluster yes
requirepass "hepengjuSentinel"
sentinel monitor mymaster 192.168.1.111 8801 1
sentinel auth-pass mymaster "hepengju"
sentinel announce-ip 192.168.1.111

vim config-28802/sentinel.conf

port 0
tls-port 28802
tls-cert-file /etc/redis/redis.crt
tls-key-file /etc/redis/redis.key
tls-ca-cert-file /etc/redis/redis.crt
tls-replication yes
tls-cluster yes
requirepass "hepengjuSentinel"
sentinel monitor mymaster 192.168.1.111 8801 1
sentinel auth-pass mymaster "hepengju"
sentinel announce-ip 192.168.1.111

vim config-28803/sentinel.conf

port 0
tls-port 28803
tls-cert-file /etc/redis/redis.crt
tls-key-file /etc/redis/redis.key
tls-ca-cert-file /etc/redis/redis.crt
tls-replication yes
tls-cluster yes
requirepass "hepengjuSentinel"
sentinel monitor mymaster 192.168.1.111 8801 1
sentinel auth-pass mymaster "hepengju"
sentinel announce-ip 192.168.1.111

# copy(redis.key、redis.crt)
cp ../redis.* config-28801
cp ../redis.* config-28802
cp ../redis.* config-28803

# 所有用户添加写权限
chmod -R 777 config-28801/ config-28802/ config-28803/

```

### docker-compose.yaml

```yaml
services:
  redis8-8801:
    image: redis:8
    container_name: redis8-8801-ssl
    command: redis-server --port 0 --tls-port 8801 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt --tls-replication yes --requirepass hepengju --masterauth hepengju --replica-announce-ip 192.168.1.111
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
  redis8-8802:
    image: redis:8
    container_name: redis8-8802-ssl
    command: redis-server --port 0 --tls-port 8802 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt --tls-replication yes --requirepass hepengju --masterauth hepengju --replica-announce-ip 192.168.1.111 --replicaof 192.168.1.111 8801
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
  redis8-8803:
    image: redis:8
    container_name: redis8-8803-ssl
    command: redis-server --port 0 --tls-port 8803 --tls-cert-file /etc/redis/redis.crt --tls-key-file /etc/redis/redis.key --tls-ca-cert-file /etc/redis/redis.crt --tls-replication yes --requirepass hepengju --masterauth hepengju --replica-announce-ip 192.168.1.111 --replicaof 192.168.1.111 8801
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ../redis.crt:/etc/redis/redis.crt
      - ../redis.key:/etc/redis/redis.key
  redis8-28801:
    image: redis:8
    container_name: redis8-28801-ssl
    command: redis-sentinel /etc/redis/sentinel.conf
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./config-28801/:/etc/redis/
  redis8-28802:
    image: redis:8
    container_name: redis8-28802-ssl
    command: redis-sentinel /etc/redis/sentinel.conf
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./config-28802/:/etc/redis/
  redis8-28803:
    image: redis:8
    container_name: redis8-28803-ssl
    command: redis-sentinel /etc/redis/sentinel.conf
    restart: always
    network_mode: 'host'
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./config-28803/:/etc/redis/
```
