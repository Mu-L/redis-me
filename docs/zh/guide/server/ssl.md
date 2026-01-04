# Redis SSL证书生成

```shell
# 生成自签名证书
openssl genrsa 2048 > redis.key
openssl req -new -key redis.key -out redis.csr
openssl x509 -req -in redis.csr -signkey redis.key -days 3650 -out redis.crt

# 查看证书内容
# openssl x509 -in redis.crt -noout -text

# 合并私钥和证书为PFX文件
# openssl pkcs12 -export -out redis.pfx -inkey redis.key -in redis.crt -password pass:hepengju
```