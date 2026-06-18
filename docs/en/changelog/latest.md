# 4.x Changelog

## [v4.0.0](https://mp.weixin.qq.com/s/U9DYq4LfoliE_eR1BKE5mg) (2026-06-18)

### ✨ New Features & Improvements

- **Command Log**
  - Command interception, event push and visual panel display
  - Commands within the last 1s are highlighted in color for easy tracking of latest operations
- **Key Tree**: Added TYPE cache to avoid repeated requests when expanding
- **Key Tree**: Added quick delete icon on the right side of selected row
- **Search**: Optimized large data scan logic to prevent UI freezing #116
- **Icon**: Keep safe zone only on macOS, remove on Windows/Linux

### 🐞 Bug Fixes

- Fixed incorrect type unsupported error when `field_scan` key does not exist
- Prevented INFO refresh after key deletion to avoid permission popup for unauthorized users
