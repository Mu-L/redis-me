# 4.x Changelog

## [v4.1.0](https://mp.weixin.qq.com/s/pM545fZPNiy3gxCvpDvmlw) (2026-06-27)

### ✨ New Features

- Added **Favorite Keys**
  - Right-click to favorite/unfavorite; favorited keys show a star icon
  - "My Favorites" entry in the status bar; favorite mode shows only keys for the current connection/database
  - Favorite list supports keyword filtering; batch favorite/unfavorite in multi-select mode
- **Key Area**
  - **Search history**; dropdown placed below the key list to avoid blocking keys
  - **Real-time scan progress with pause/resume** #116
  - Exact search uses EXISTS for better performance #122
  - DB selector: new icon and styling improvements
- **Value Tab**: Improved header layout; TTL shown next to the key name; actions moved to favorite and more menus
- **Command Log**
  - Added monitoring for MONITOR, Pub/Sub, import/export, and other async commands
  - Improved dialog interaction and table display
- Other improvements
  - Hide Info and Chart tabs when INFO command is not permitted
  - Improved MONITOR and Pub/Sub labels and icons
  - Improved minimal mode detection
  - Updated flat mode icons

### 🐞 Bug Fixes

- Fixed "Load All Remaining Keys" failing after scan improvements

## [v4.0.0](https://mp.weixin.qq.com/s/U9DYq4LfoliE_eR1BKE5mg) (2026-06-18)

### ✨ New Features

- **Command Log**
  - Command interception, event push and visual panel display
  - Commands within the last 1s are highlighted in color for easy tracking of latest operations
- **Key Tree**: Added TYPE cache to avoid repeated requests when expanding
- **Key Tree**: Added quick delete icon on the right side of selected row
- **Search**: Optimized large data scan logic to prevent UI freezing #116
- **Icon**: Keep safe zone only on macOS, remove on Windows/Linux
- **HTTL**: Optimized detection of HTTL command support

### 🐞 Bug Fixes

- Fixed incorrect type unsupported error when `field_scan` key does not exist
- Prevented INFO refresh after key deletion to avoid permission popup for unauthorized users
