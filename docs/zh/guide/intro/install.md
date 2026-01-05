# 安装使用

## Windows
- 64位: 下载 `RedisME_${version}_x64-setup.exe` 完成后双击安装即可
- ARM64: 下载 `RedisME_${version}_arm64-setup.exe` 完成后双击安装即可
- 微软应用商店：[RedisME](https://apps.microsoft.com/detail/9NG9X1RCMW4P)

::: danger 故障排除
如运行提示需要安装Webview运行时，但是无法下载，可能需要自行下载安装 [Webview2运行时](https://developer.microsoft.com/zh-cn/microsoft-edge/webview2/)
:::

## MacOS
- Apple芯片: 下载 `RedisME_${version}_aarch64.dmg`
- Intel芯片: 下载 `RedisME_${version}_x64.dmg`

打开 `.dmg` 文件，将 `RedisME.app` 拖到 `Applications` 目录内即可。

::: danger 故障排除 
由于应用没有签名，如果显示开发者无法验证：
点击`取消`按钮，并打开`设置 -> 隐私与安全性`页面，点击`仍要打开`按钮，最后在弹出窗口里点击`打开`按钮即可。
:::

## Linux
- DEB包(Debian系): `RedisME_${version}_amd64.deb`
- RPM包(Redhat系): `RedisME-${version}-1.x86_64.rpm`
- 通用包: 下载 `RedisME_${version}_amd64.AppImage`

`deb` 安装使用 `apt`
```bash
sudo apt install ./RedisME_${version}_amd64.deb
```

`rpm` 安装使用 `dnf`
```bash
sudo dnf install ./RedisME-${version}-1.x86_64.rpm
```

`AppImage`的使用
```bash
chmod u+x RedisME_${version}_amd64.AppImage
./RedisME_${version}_amd64.AppImage
```