# 1.x Changelog

## Future

- Terminal: Add command prompts, add command list for manual selection
- Scan scanning for hash, list, set, zset

## v1.6.1 (2026-01-30)

- Value: Supports cursor scanning for hash, list, set, and zset
- Value: UI optimization for the flickering of the loadMore/All button when switching key values
- Value: Error fix for field_del related to list/set/zset
- Value: Value size display changed from frontend calculation to server returning actual memory usage
- Connection: Support for Redis Sentinel mode (SSL does not support disabling hostname verification for now)
- Connection: Compatibility for importing connections/reading connections with older configuration files
- Connection: Password input library supports display, dialog supports dragging
- Chart: Configurable to display up to N data points, exceeding which approximately N/2 data points are sampled evenly
- Chart: Fixed defect where disabling auto-refresh did not take effect
- Info: Added cache hit rate metric
- UI: Added color coding for Redis key types, ensuring consistent appearance in both the Key/Value/Memory

## v1.5.0 (2026-01-24)

- Update: Added a update log link redirection during upgrade reminders
- Chart: Added command execution count, memory, network inbound/outbound charts
- Terminal: Added Ctrl+L/C shortcut
- Terminal: Supports automatic copying of command results
- Terminal: Support commands automatic broadcasting for cluster mode

## v1.4.1 (2026-01-18)

- Supports automatic reconnection after connection is disconnected (passive check)
- Client connection list supports Kill function, manual forced close (client kill)
- Microsoft App Store version detection (changed to checking if the appStore.txt file exists in the
  AppData directory)

## v1.3.0 (2026-01-10)

- Official Website: Launched [RedisME Official Website](https://www.hepengju.com)
- Terminal: Completely rewritten underlying layer, [Xterm](https://xtermjs.org/)
  to [XTerminal](https://xterminal.js.org/), solving issues like Chinese backspace and
  multi-line commands
- Optimization: Version upgrades in the Microsoft Store are now controlled by the store itself
- Optimization: Replaced native Mutex lock with parking_lot's Mutex to support configuring lock timeout duration,
  avoiding infinite waits
- Optimization: Improved UI loading during simulated data insertion
- Optimization: Upgraded all dependency versions to the latest and optimized code with cargo fmt/clippy
- Bugfix: Fixed display issues when leaf and non-leaf node names are the same in the key tree view
- Bugfix: Fixed freezing issue when batch deleting keys with direct batch deletion (added lock for connection
  acquisition)

## v1.2.0 (2026-01-05)

- New special features: Read-only writable mode real-time conversion
- Terminal prompt color optimization for light and dark themes
- Resolve the display defect of dragging up and down in the connection management interface

## v1.1.0 (2026-01-04)

- Auto-upgrade mechanism: unified use of static files on both GitHub and Gitee
- Version number management unified using package.json: official website, frontend, and App versions
- Added support for Windows Arm64 version and Linux AppImage version

## v1.0.0 (2026-01-01)

- 🎉 Welcome the new year, first official version released
- Upgrade: supports auto-update and manual update; added New label and download progress display; supports Gitee/Github
  dual-end updates
- Configuration: added default value display, optional display of all/differences, special color display for
  differences, added Redis 8.4 configuration
- Theme: supports light and dark themes
- Font: supports custom fonts, supports browser font retrieval and Rust system font reading, to adapt to different
  environments
- i18n: supports Chinese and English, supports plural handling in English, detailed explanations for messages and
  configuration options support Chinese and English