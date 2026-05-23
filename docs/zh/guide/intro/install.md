<script setup>
import {version} from '../../../../package.json'
</script>

# 安装帮助

## Windows

- **安装版(x64): 下载 `RedisME_{{version}}_x64-setup.exe` 完成后双击安装即可**
- 绿色版(x64): 下载 `RedisME_{{version}}_portable_x64.zip` 解压zip文件，双击exe启动使用
- 安装版(Arm64): 下载 `RedisME_{{version}}_arm64-setup.exe` 完成后双击安装即可
- 绿色版(Arm64): 下载 `RedisME_{{version}}_portable_arm64.zip` 解压zip文件，双击exe启动使用
- 微软应用商店: [RedisME](https://apps.microsoft.com/detail/9NG9X1RCMW4P)

::: danger 故障排除
如运行提示需要安装Webview运行时，但是无法下载，可能需要自行下载安装 [Webview2运行时](https://developer.microsoft.com/zh-cn/microsoft-edge/webview2/)
:::

## MacOS

- **Apple芯片: 下载 `RedisME_{{version}}_aarch64.dmg`**
- Intel芯片: 下载 `RedisME_{{version}}_x64.dmg`

打开 `.dmg` 文件，将 `RedisME.app` 拖到 `Applications` 目录内即可。

::: danger 故障排除（应用签名需注册苹果开发者，每年99美元）

- 如果安装后提示 `“RedisME”已损坏，无法打开` ，请打开 `Terminal.app` 并执行以下命令即可：

```bash
sudo xattr -d com.apple.quarantine /Applications/RedisME.app
```

然后再次尝试打开`RedisME`

- 如果显示开发者无法验证：点击`取消`按钮，并打开`设置 -> 隐私与安全性`页面，点击`仍要打开`
  按钮，最后在弹出窗口里点击`打开`按钮即可。

:::

## Linux

- Debian: `RedisME_{{version}}_amd64.deb` | `RedisME_{{version}}_arm64.deb`
- Redhat: `RedisME-{{version}}-1.x86_64.rpm` | `RedisME-{{version}}-1.aarch64.rpm`
- 通用包: `RedisME_{{version}}_amd64.AppImage` | `RedisME_{{version}}_aarch64.AppImage`

`deb` 安装使用 `apt`

```bash-vue
# x64
sudo apt install ./RedisME_{{version}}_amd64.deb

# arm64
sudo apt install ./RedisME_{{version}}_arm64.deb
```

`rpm` 安装使用 `dnf`

```bash-vue
# x64
sudo dnf install ./RedisME-{{version}}-1.x86_64.rpm

# arm64
sudo dnf install ./RedisME-{{version}}-1.aarch64.rpm
```

`AppImage`的使用

```bash-vue
# x64
chmod u+x RedisME_{{version}}_amd64.AppImage
./RedisME_{{version}}_amd64.AppImage

# arm64
chmod u+x RedisME_{{version}}_aarch64.AppImage
./RedisME_{{version}}_aarch64.AppImage
```
