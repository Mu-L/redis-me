# 4.x Changelog

## v4.0.0 (2026-06-20)

### ✨ New Features & Improvements

- **Command Log**
  - Support command interception, event push and visual panel display
  - Support RESP3 error recognition, response field optimization and front-end display optimization
  - Popup UI and interaction experience optimization
- **Key Tree**
  - Added TYPE cache to avoid repeated requests when expanding
  - Added quick delete icon on the right side of selected row
- **Icon**: Keep safe zone only on macOS, remove on Windows/Linux

### 🐞 Bug Fixes

- Fixed incorrect type unsupported error when `field_scan` key does not exist
- Optimized TYPE cache: only cache bytes, batch delete and FLUSHDB invalidate entire connection
