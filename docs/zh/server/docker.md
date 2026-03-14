# docker 安装

## 安装

```shell
curl -fsSL https://get.docker.com -o install-docker.sh
sudo sh install-docker.sh
# 指定版本和镜像源
# sudo sh install-docker.sh --version 23.0 --mirror Aliyun|AzureChinaCloud

# 启动服务, 开机启动
systemctl start docker
systemctl enable docker
```

## 加速

```shell
# https://mirror.ccs.tencentyun.com 只支持内网访问，不支持外网域名访问加速
vim /etc/docker/daemon.json
# 按 i 切换至编辑模式，添加以下内容，并保存
{
    "registry-mirrors": [
        "https://mirror.ccs.tencentyun.com"
    ]
}

# 重启服务
sudo systemctl restart docker
# 查看信息中的加速镜像
sudo docker info
```
