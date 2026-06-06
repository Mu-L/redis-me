# 3.x Changelog

## [v3.8.0](https://mp.weixin.qq.com/s/Us7_dM8mEVOAz7kbqvbh4w) (2026-06-06)

### ✨ New Features

- **ACL user management**
  - User list: current user, user list, save and reload, link to official docs, etc.
  - Log list: security log display and reset
  - User actions: add user, generate password, dry-run simulation, reset password, enable/disable, etc.
  - Quick presets: templates for normal, read-only, and admin users
  - Command categories: dropdown of all categories and the commands in each category
  - Cluster: ACL write operations automatically **broadcast to all nodes**
- Connection: support for accounts restricted on INFO, CONFIG, and similar commands
  - New **minimal mode**: shows only **keys/values** and **terminal**
  - Connection init **gracefully degrades** when INFO, CLIENT SETNAME, CONFIG GET, etc. are unavailable

### 🐞 Bug Fixes

- Read-only mode: context menu **rename key** was not hidden

## [v3.7.0](https://mp.weixin.qq.com/s/mhlhujX5zpbi1XadHTa60A) (2026-06-01)

### ✨ New Features

- Custom codec
  - Base64 over **8000 chars uses stdin** (avoids Windows command-line limits)
  - Dialog adds a **Help** button linking to official examples
- Settings: **Command timeout** and **script timeout**
- Info: Overview adds **users/commands/network/memory limits**
- Shortcuts: Global shortcuts; improved shortcut display in the value area and terminal
- Details
  - Export filenames use the **RedisME** prefix
  - More settings: improved defaults for field display, scan counts, etc.
  - Value area status bar shows **total vs scanned**
  - Config: default **Redis 8.8** configuration file
  - Cluster: improved **master/replica ordering** and **selection display** in the node list
- Toolchain: Updated frontend/backend dependencies to latest versions

### 🐞 Bug Fixes

- Language: On **macOS**, UI stayed English when the system was Chinese and language was set to **Follow system** (`zh-Hans-CN` was not mapped correctly)

## [v3.6.0](https://mp.weixin.qq.com/s/K99PFYCowxDmvSlaUzqR-g) (2026-05-30)

### ✨ New Features

- Codec: **Complete redesign and improvements**
  - **Custom encode/decode** via external scripts
  - New practical codec: **StrJson**
  - Removed the rarely useful **Binary** codec
- Paginated tables: **Copy and export**
  - Applies to **Slow Log**, Config, Info, and similar tables
  - Formats: JSON, CSV, HTML, Markdown, Excel
- Terminal:
  - Help table shows whether each command is **read-only**; improved fuzzy search; filterable column headers
  - **Read-only commands can run in read-only mode**
- Value area:
  - Hash/List and similar types show **total element count**
  - Read-only mode now supports **viewing fields**
- Downloads: **Quick download table** added to releases
- Website: Installer downloads **auto-detect the OS**; improved naming

### 🐞 Bug Fixes

- Updates: Attempted fix for the app not auto-restarting after an upgrade on macOS

## [v3.5.0](https://mp.weixin.qq.com/s/l7AcVFTI1bamWU3mfZqF5A) (2026-05-23)

### ✨ New Features

- Added **empty state** for the connection list
- Added **grouped connection list** display #86
- Field display modes: **Auto** and **Table** #89
- Field element editing
  - **Beautify**: enabled by default, same as the value area #90
  - **Copy**: one-click copy field values
  - **Fixed field value dimensions** to prevent global scrollbars from large values
- DB Select: **display count limit** #92
- Auto-refresh key list after import completes #93
- Removed the key tree **full-name display** setting (abbreviated names only)
- Other details: icons in the connection dropdown; dedicated icon for Sentinel mode; etc.

## [v3.4.0](https://mp.weixin.qq.com/s/YlUq0vu4hk3wFYGYDmivNg) (2026-05-16)

### ✨ New Features

- Pub/Sub
  - **Subscribe to multiple channels at once using space-separated names**
  - Improved icons and copy for start/cancel subscription
  - Paginated table, default sort by time (newest first)
  - Input clears after send; **Enter** sends the message
- Clients: Fields returned with **proper runtime types** so numeric values sort correctly
- Command monitor: Icon and copy improvements; paginated table; default sort by time (newest first)
- Memory analysis: Paginated table; key type **ReJSON-RL** shown as **JSON**
- Charts: **F11** toggles fullscreen for the chart panel
- Other improvements
  - Custom tables: column sort applies to the **full dataset** across pages, not only the current page
  - Connection health checks logged at **debug** level to reduce noise
  - Toolchain and all frontend/backend dependencies upgraded to the latest versions

### 🐞 Bug Fixes

- Pub/Sub: Fixed unsubscribe failing when specific channels were subscribed
- Store installs: Fixed the **New** badge still showing for Microsoft Store / Mac App Store builds

## [v3.3.0](https://mp.weixin.qq.com/s/vowF5eeThW_TucjsZUFTWQ) (2026-05-05)

### ✨ New Features

- Keys panel: Improved empty-state UI when no connection is selected
  - **Colorful brand icon**; click to open the official website
  - **Source repository** and **bug report** entry points
- Codec: **Separate byte codecs for keys and values**
  - Applies to **New Key**, **Edit Key**, and **Rename Key**
  - **Rename Key** uses a dedicated dialog; codec can be set inside it
- MsgPack: **String** values support **MsgPack encode/decode (shown as JSON)**
- Performance: Faster insert path when adding fields to Hash/List/Set/ZSet, etc.
- Details: Reordered checkboxes in the save-connection dialog for typical workflows, etc.

### 🐞 Bug Fixes

- New Key: Fixed **partial writes** on Hash/List and similar multi-field types when **some values had codec errors**
- Add field: Fixed failures adding fields to Hash and similar types when **key names are non–UTF-8 bytes** (e.g. JDK serialization)

## [v3.2.0](https://mp.weixin.qq.com/s/8c39tELlwtjrkbvD8kWB6A) (2026-05-05)

### ✨ New Features

- Connection import and export
  - **Import connection data from AnotherRDM, TinyRDM, and Redis Insight**
  - **Export connections to the built-in `.mec` format (simple Base64 encoding)**
- Highlight: Multiple CodeMirror viewer improvements
  - **Syntax highlighting supports JSON5**
  - Shortcuts: **F11 fullscreen**, Ctrl+L toggles line wrap, Ctrl+N toggles line numbers
  - Shortcuts: Ctrl+=, Ctrl+-, and Ctrl+0 increase, decrease, and reset editor font size
- Value view: Added a CodeMirror shortcut reference (dialog)
- Code: **End-to-end strong typing** (frontend migrated from JavaScript to TypeScript; Tauri commands and events are strongly typed)
- Updates: No in-app auto-update when installed from the Microsoft Store or Mac App Store (updates follow store policy)
- Details: Pub/Sub hints, wider "new key" layout, English plural and related copy tweaks, etc.
- Docs: complete coverage for memory analysis, slow logs, command monitoring, and pub/sub

### 🐞 Bug Fixes

- Value view: After editing String/JSON without saving, refreshing the key could still show the draft instead of the server value

## [v3.1.0](https://mp.weixin.qq.com/s/c1H-_54UwnRUPUEaEa89hQ) (2026-04-30)

### ✨ New Features

- **Added cluster topology graph visualization**
- Highlight: Optimized CodeMirror language styling for Info and Config tabs
- Description: AI supplemented and improved explanation fields in both Chinese and English
- Info: Optimized display style when executable path or config values are too long #81
- Website: Grouped download files by Windows/macOS/Linux

### 🐞 Bug Fixes

- Compatibility with third-party cache databases (e.g. Tencent Cloud Redis) that do not support `MEMORY USAGE` #81

## [v3.0.0](https://mp.weixin.qq.com/s/37hqIYE7AuYbvoGJXippdg) (2026-04-25)

### ✨ New Features

- **Data Codec**: Added support for UTF8, Hex, Binary, and Base64 formats
  - New Key, Rename Key
  - Value Display: key shown on top, main value area supports display/save, insert field, edit field
- Package: **Added Linux ARM architecture support**
- Key Display: Database dropdown now supports filtering with improved style
- Slow Log: Quick adjustment for server slow log parameters
- Settings: Added quick-open buttons for config/app/log directories
- Path Resolution: SSL/SSH file paths now support home directory and environment variables

### 🐞 Bug Fixes

- Cluster Mode: More permissive support for renaming keys (Redis normally requires old/new keys in the same hash slot)
