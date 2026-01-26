# Installation

## Windows

- x64: Download `RedisME_${version}_x64-setup.exe`, double-click to install
- arm64: Download `RedisME_${version}_arm64-setup.exe`, double-click to install
- Microsoft Store: [RedisME](https://apps.microsoft.com/detail/9NG9X1RCMW4P)

::: danger Troubleshooting
If you receive a prompt that you need to install the Webview runtime, but you cannot download it, you may need to
download and install the [Webview2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) Runtime manually.
:::

## MacOS

- Apple Silicon: Download `RedisME_${version}_aarch64.dmg`
- Intel CPU: Download `RedisME_${version}_x64.dmg`

After downloading, open the `.dmg` file and drag `RedisME.app` into the `Applications` folder.

::: danger Troubleshooting
Since the app is not signed, shows "The developer cannot be verified":
Click the `Cancel` button, then go to `Settings -> Privacy & Security` page, click the `Still Open` button, and then
click the `Open` button in the pop-up window
:::

## Linux

- Debian: `RedisME_${version}_amd64.deb`
- Redhat: `RedisME-${version}-1.x86_64.rpm`
- AppImage: `RedisME_${version}_amd64.AppImage`

Install `deb` package using `apt`:

```bash
sudo apt install ./RedisME_${version}_amd64.deb
```

Install `rpm` package using `dnf`:

```bash
sudo dnf install ./RedisME-${version}-1.x86_64.rpm
```

Use `AppImage`

```bash
chmod u+x RedisME_${version}_amd64.AppImage
./RedisME_${version}_amd64.AppImage
```