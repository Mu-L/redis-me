# docker install

## Install

```shell
curl -fsSL https://get.docker.com -o install-docker.sh
sudo sh install-docker.sh
# sudo sh install-docker.sh --version 23.0 --mirror Aliyun|AzureChinaCloud

systemctl start docker
systemctl enable docker
```

## Speed

```shell
vim /etc/docker/daemon.json
{
    "registry-mirrors": [
        "https://mirror.ccs.tencentyun.com"
    ]
}

sudo systemctl restart docker
sudo docker info
```
