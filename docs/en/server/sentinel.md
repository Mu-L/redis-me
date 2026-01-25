# Redis Sentinel
Quickly set up a Redis Sentinel using docker-compose for verification or testing environments.

```shell
mkdir /data/redis-sentinel
cd /data/redis-sentinel

vim docker-compose.yaml

docker compose up -d
```

## Sentinel ConfigFile
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
## Sentinel
```yaml
services:
  redis8-7701:
    image: redis:8
    container_name: redis8-7701
    command: redis-server --port 7701 --requirepass hepengju --masterauth hepengju --replica-announce-ip 192.168.1.111
    restart: always
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
  redis8-7702:
    image: redis:8
    container_name: redis8-7702
    command: redis-server --port 7702 --requirepass hepengju --masterauth hepengju --replica-announce-ip 192.168.1.111 --replicaof 192.168.1.111 7701
    restart: always
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
  redis8-7703:
    image: redis:8
    container_name: redis8-7703
    command: redis-server --port 7703 --requirepass hepengju --masterauth hepengju --replica-announce-ip 192.168.1.111 --replicaof 192.168.1.111 7701
    restart: always
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
  redis8-27701:
    image: redis:8
    container_name: redis8-27701
    command: redis-sentinel /etc/redis/sentinel.conf
    restart: always
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./config-27701/:/etc/redis/
  redis8-27702:
    image: redis:8
    container_name: redis8-27702
    command: redis-sentinel /etc/redis/sentinel.conf
    restart: always
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./config-27702/:/etc/redis/
  redis8-27703:
    image: redis:8
    container_name: redis8-27703
    command: redis-sentinel /etc/redis/sentinel.conf
    restart: always
    network_mode: "host"
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./config-27703/:/etc/redis/
```


## Sentinel + SSL