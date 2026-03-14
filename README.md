<div align="center">
<a href="https://github.com/hepengju/redis-me/"><img src="docs/public/images/logo.svg" width="100"/></a>
</div>
<h1 align="center">RedisME</h1>
<h4 align="center">
  English 
| <a href="/README_zh.md">简体中文</a> 
| <a href="/docs/en/guide/intro/screenshots.md">Screenshots</a>
</h4>
<div align="center">

[![License](https://img.shields.io/github/license/hepengju/redis-me)](https://github.com/hepengju/redis-me/blob/main/LICENSE)
[![GitHub release](https://img.shields.io/github/release/hepengju/redis-me)](https://github.com/hepengju/redis-me/releases)
![GitHub All Releases](https://img.shields.io/github/downloads/hepengju/redis-me/total)

<strong>RedisME is a modern lightweight cross-platform Redis desktop manager </strong>

</div>

![light.png](docs/public/images/light.png)
![dark.png](docs/public/images/dark.png)

## Features

- Super Lightweight: Based on Webview2, no embedded browser (Thanks to [Tauri](https://tauri.app))
- Pretty UI: Provides light/dark themes(Thanks to [ElementPlus](https://element-plus.org), [CodeMirror](https://codemirror.net/), [VueWebTerminal](https://tzfun.github.io/vue-web-terminal/))
- Cross-platform: Supports Windows/Mac/Linux
- Multi-language: English, Chinese, more languages coming soon
- Rich functionality: info, value, terminal, memory analysis, slow logs, command monitoring, pub/sub etc
- Special features:
  - Dynamic switching between read-only/writable modes
  - Terminal command prompts and detailed explanations
  - Highlighting and detailed explanations of info fields
  - Configuration field comparison, detailed explanations, and default value references
  - Fine-grained memory scan parameter configuration for quick memory issue troubleshooting
  - Terminal command execution with automatic broadcasting to multiple nodes in a cluster
  - Cluster operations can specify nodes

## Installation

Available to download for free from [here](https://github.com/hepengju/redis-me/releases)

## Build Guidelines

```shell
# System Prerequisites: Refer Tauri  https://tauri.app/start/prerequisites/
# Windows: Microsoft C++
# Mac: Xcode
# Linux: libwebkit2gtk, build-essential etc

# rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# vite+: node/pnpm etc
curl -fsSL https://vite.plus | bash

# clone
git clone https://github.com/hepengju/redis-me.git --depth=1

# install package.json and start dev
vp install
vp run tauri dev
```

## WeChat Official Account

Regularly share the special features and update logs of RedisME, as well as other technical issues and solutions.

<img src="src/assets/images/wechat.png" alt="wechat" width="400" />
