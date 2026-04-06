# RedisME - QWEN Context

# 人工补充
- 尽可能的保持中文沟通与展现思考过程，不要思考着思考着蹦出一堆英文
- RUST的代码编译检查，优先使用cargo check，避免整个应用程序编译（耗时很长）

## 项目概述

**RedisME** 是一个现代、轻量级、跨平台的 Redis 桌面管理器。它基于 **Tauri 2** 构建，使用 **Vue 3** 作为前端框架，结合了 **Element Plus** UI 组件库，提供美观的浅色/深色主题界面。

### 核心特性

- **超级轻量**：基于 Webview2，无内嵌浏览器，安装包小于 10MB
- **跨平台支持**：Windows / Mac / Linux
- **多语言**：英文、中文（i18n）
- **功能丰富**：
  - Redis 信息查看、键值管理
  - 终端命令行执行（带命令提示和解释）
  - 内存分析、慢日志、命令监控
  - 发布/订阅
  - 集群支持（命令自动广播到多节点）
- **特色功能**：
  - 只读/可写模式动态切换
  - 配置字段对比与默认值参考
  - 精细化内存扫描参数配置

## 技术栈

### 前端

| 技术           | 说明                        |
| -------------- | --------------------------- |
| Vue 3          | 前端框架（Composition API） |
| Element Plus   | UI 组件库                   |
| CodeMirror 6   | 代码编辑器                  |
| VueWebTerminal | 终端组件                    |
| Vue I18n       | 国际化                      |
| Chart.js       | 图表可视化                  |
| VueUse         | Vue 组合式工具库            |

### 后端 (Tauri/Rust)

| 技术             | 说明                                        |
| ---------------- | ------------------------------------------- |
| Tauri 2          | 桌面应用框架                                |
| redis-rs         | Redis 客户端（支持 cluster、sentinel、TLS） |
| serde/serde_json | JSON 序列化                                 |
| fern             | 日志库                                      |

### 构建工具

- **Vite+** (`vp`)：统一工具链，包装 Vite、Vitest、Oxlint、Oxfmt 等
- **包管理器**：pnpm@10.32.1

## 项目结构

```
redis-app/
├── src/                      # 前端 Vue 源码
│   ├── assets/               # 静态资源（图片、图标）
│   ├── components/           # 通用组件（MeButton, MeTable, MeCode 等）
│   ├── locales/              # 国际化语言文件
│   │   ├── lang/             # 各语言翻译
│   │   └── index.js
│   ├── plugins/              # 插件配置（ElementPlus, i18n, Tauri 等）
│   ├── utils/                # 工具函数
│   ├── views/                # 页面视图
│   │   ├── ext/              # 扩展视图
│   │   ├── key/              # 键值相关视图
│   │   ├── tab/              # 标签页视图
│   │   ├── AppMain.vue       # 主应用视图
│   │   ├── KeyHeader.vue     # 键值头部
│   │   ├── KeyMain.vue       # 键值主区域
│   │   ├── TabConn.vue       # 连接标签页
│   │   └── TabMain.vue       # 标签页主区域
│   ├── App.vue               # 根组件
│   ├── App.css               # 全局样式
│   └── main.js               # 入口文件
├── src-tauri/                # Tauri/Rust 后端
│   ├── src/
│   │   ├── client/           # Redis 客户端实现
│   │   ├── utils/            # Rust 工具函数
│   │   ├── api.rs            # API 定义
│   │   ├── lib.rs            # 库入口
│   │   └── main.rs           # 主入口
│   ├── capabilities/         # Tauri 权限配置
│   ├── resources/            # 打包资源（图标、配置文件）
│   ├── tests/                # Rust 测试
│   ├── Cargo.toml            # Rust 依赖
│   ├── tauri.conf.json       # Tauri 配置
│   └── build.rs              # 构建脚本
├── docs/                     # VitePress 文档/文档站点
├── test/                     # 前端测试
├── package.json              # Node 依赖配置
├── vite.config.ts            # Vite 配置
└── QWEN.md                   # 本文件
```

## 构建与运行

### 前置要求

- **Rust**：`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Vite+**：`curl -fsSL https://vite.plus | bash`
- **系统依赖**：
  - Windows: Microsoft C++ Build Tools
  - Mac: Xcode
  - Linux: `libwebkit2gtk`, `build-essential` 等

### 常用命令

```bash
# 安装依赖
vp install

# 启动开发模式（Tauri + Vite）
vp run tauri dev

# 仅启动前端开发服务器
vp dev

# 构建生产版本
vp build

# Tauri 打包（生成安装包）
vp run tauri build

# 代码检查
vp check        # 格式化 + lint + TypeScript 检查
vp lint         # 仅 lint
vp fmt          # 仅格式化

# 运行测试
vp test

# 文档开发
vp run docs:dev

# 文档构建
vp run docs:build
```

### 开发服务器配置

- 端口：`2222`（固定）
- HMR 端口：`2221`（WebSocket）
- 路径别名：`@` → `src/`

## 开发规范

### 代码风格

- **不使用分号**（`semi: false`）
- **使用单引号**（`singleQuote: true`）
- 使用 Vue 3 Composition API（`<script setup>`）
- 自动导入 Vue 函数（`ref`, `reactive`, `toRef` 等）

### SVG 图标

- 图标目录：`src/assets/icons/`
- 组件前缀：`me-icon`
- 使用 `unplugin-svg-component` 自动注册

### 插件系统

应用启动时按顺序初始化以下插件：

1. `setupElementPlus` - Element Plus UI
2. `setupSvgIcon` - SVG 图标组件
3. `setupMe` - 自定义全局工具
4. `setupTauri` - Tauri API 集成
5. `setupI18n` - 国际化
6. `setupTernimal` - 终端组件

### 主题与国际化

- 主题：支持 `light` / `dark` / `system` 三种模式
- 语言：支持 `en` / `zh-CN` / `system`，通过 `meTauri.settings.language` 控制
- 字体：可自定义 UI 字体和代码字体

## Tauri 配置要点

- **应用标识**：`com.hepengju.redis`
- **窗口大小**：1200 x 800，居中显示
- **打包目标**：deb, rpm, appimage, nsis, dmg, app
- **更新器**：支持 GitHub 和 Gitee 双源自动更新
- **Windows 安装**：支持 WiX 和 NSIS，包含中英文语言包

## 注意事项

1. **使用 Vite+ 命令**：不要直接使用 pnpm/npm 命令，使用 `vp install`、`vp dev` 等
2. **Tauri 开发**：使用 `vp run tauri dev` 启动完整桌面应用开发模式
3. **忽略监听**：Vite 配置中忽略了 `dist/` 和 `src-tauri/` 目录的文件监听
4. **端口固定**：Vite 开发服务器固定使用 2222 端口
