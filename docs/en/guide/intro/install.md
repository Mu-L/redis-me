<script setup>
import {version} from '../../../../package.json'
</script>

# Installation

## Windows

- **Installer (x64): Download `RedisME_{{version}}_x64-setup.exe`, then double-click to install**
- Portable (x64): Download `RedisME_{{version}}_portable_x64.zip`, extract the archive, and double-click the `.exe` to run
- Installer (Arm64): Download `RedisME_{{version}}_arm64-setup.exe`, then double-click to install
- Portable (Arm64): Download `RedisME_{{version}}_portable_arm64.zip`, extract the archive, and double-click the `.exe` to run
- Microsoft Store: [RedisME](https://apps.microsoft.com/detail/9NG9X1RCMW4P)

::: danger Troubleshooting
If the app asks you to install the WebView runtime but the download fails, install the
[WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) manually.
:::

## MacOS

- **Apple Silicon: Download `RedisME_{{version}}_aarch64.dmg`**
- Intel: Download `RedisME_{{version}}_x64.dmg`

Open the `.dmg` file and drag `RedisME.app` into the `Applications` folder.

::: danger Troubleshooting (app notarization requires an Apple Developer Program membership, $99/year)

- If you see **“RedisME” is damaged and can’t be opened** after installation, open `Terminal.app` and run:

```bash
sudo xattr -d com.apple.quarantine /Applications/RedisME.app
```

Then try opening **RedisME** again.

- If you see **cannot be opened because the developer cannot be verified**: click **Cancel**, open **System Settings → Privacy & Security**, click **Open Anyway**, then confirm **Open** in the dialog.

:::

## Linux

- DEB (Debian-based): `RedisME_{{version}}_amd64.deb` | `RedisME_{{version}}_arm64.deb`
- RPM (Red Hat–based): `RedisME-{{version}}-1.x86_64.rpm` | `RedisME-{{version}}-1.aarch64.rpm`
- Generic: `RedisME_{{version}}_amd64.AppImage` | `RedisME_{{version}}_aarch64.AppImage`

Install `deb` packages with `apt`:

```bash-vue
# x64
sudo apt install ./RedisME_{{version}}_amd64.deb

# arm64
sudo apt install ./RedisME_{{version}}_arm64.deb
```

Install `rpm` packages with `dnf`:

```bash-vue
# x64
sudo dnf install ./RedisME-{{version}}-1.x86_64.rpm

# arm64
sudo dnf install ./RedisME-{{version}}-1.aarch64.rpm
```

Using `AppImage`:

```bash-vue
# x64
chmod u+x RedisME_{{version}}_amd64.AppImage
./RedisME_{{version}}_amd64.AppImage

# arm64
chmod u+x RedisME_{{version}}_aarch64.AppImage
./RedisME_{{version}}_aarch64.AppImage
```
