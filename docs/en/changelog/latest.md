# 3.x Changelog

## [v3.3.0](https://mp.weixin.qq.com/s/vowF5eeThW_TucjsZUFTWQ) (2026-05-05)

### ✨ New Features

- Keys panel: Improved empty-state UI when no connection is selected
  - **Colorful brand icon**; click to open the official website
  - **Source repository** and **bug report** entry points
- Encoding: **Separate byte encodings for keys and values**
  - Applies to **New Key**, **Edit Key**, and **Rename Key**
  - **Rename Key** uses a dedicated dialog; encoding can be set inside it
- MsgPack: **String** values support **MsgPack encode/decode (shown as JSON)**
- Performance: Faster insert path when adding fields to Hash/List/Set/ZSet, etc.
- Details: Reordered checkboxes in the save-connection dialog for typical workflows, etc.

### 🐞 Bug Fixes

- New Key: Fixed **partial writes** on Hash/List and similar multi-field types when **some values had encoding errors**
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
- Value view: Added an CodeMirror shortcut reference (dialog)
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

- **Data Encoding**: Added support for UTF8, Hex, Binary, and Base64 formats
  - New Key, Rename Key
  - Value Display: key shown on top, main value area supports display/save, insert field, edit field
- Package: **Added Linux ARM architecture support**
- Key Display: Database dropdown now supports filtering with improved style
- Slow Log: Quick adjustment for server slow log parameters
- Settings: Added quick-open buttons for config/app/log directories
- Path Resolution: SSL/SSH file paths now support home directory and environment variables

### 🐞 Bug Fixes

- Cluster Mode: More permissive support for renaming keys (Redis normally requires old/new keys in the same hash slot)
