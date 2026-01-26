# SSL Certificate Generation

```shell
openssl genrsa 2048 -3 > redis.key
openssl req -new -key redis.key -out redis.csr
openssl x509 -req -in redis.csr -signkey redis.key -days 3650 -out redis.crt

# Show Certificate Content
# openssl x509 -in redis.crt -noout -text
# Certificate:
#     Data:
#         Version: 3 (0x2)   ==> Note the version number here, v1 version is deprecated, rustls drops support
  
# Merge private key and certificate into a PFX file
# openssl pkcs12 -export -out redis.pfx \
#  -inkey redis.key -in redis.crt -password pass:hepengju
```