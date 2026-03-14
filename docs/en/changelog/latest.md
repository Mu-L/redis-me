# 2.x Changelog

## [v2.3.0]() (2026-03-15)

- **Key type support**: Added support for json and stream types.
- The right-click menu of keys also includes the action of Add new key, and the default key name is set to current key name-copy.
- The drop-down box for the key type of newly added keys is kept consistent with the key type filtering and key type display.
- Check connection timeout: Changed from 1s to 2s to adapt to weak network environments.
- Upgraded to viteplus and upgraded the js and rust dependency code.

## [v2.2.1](https://mp.weixin.qq.com/s/GKM0wOIvPTl5Q_X_gme7Cg) (2026-03-08)

- Multi Window: A new "New Window" function is added to view multiple Redis connections simultaneously. Meanwhile,
  RedisME is changed to a single - instance application.
- Social QR code: A new "Social" function is added, which displays the pictures of the WeChat official account (
  Xiaohebao) and Bilibili (He Yileng). You can follow them to view the text and picture update logs and video tutorials.
- Valkey compatibility: A judgment identifier. The info contains the valkey_version key.
  - Info: Compatibility of server version and modes.
  - Config: Support for default configuration files and default table values (Valkey 7.2/8.0/8.1/9.0).
  - Prefix of the connection dropdown box: Icon display.
- Official Website: The redirection to the official Redis website for info/config/client/commands fully supports four
  URLs, including the Chinese and English versions of Redis and Valkey.

## [v2.1.0](https://mp.weixin.qq.com/s/WUJorR4rP3si5vFRD9qvWA) (2026-02-28)

- Terminal: Added command help table dialog, optimized the table style of the help command
- Config: Add the default configuration files and configuration values for the latest 8.6 and main versions
- Config: Added a jump link, the default version of the selection box is determined based on the current actual version
- Value: Optimized color display of JSON booleans and numbers in CodeMirror under dark theme
- Info: Added monotonic_clock tip
- Client: Added a jump link, Address/Name sortable
- Mock Data: submit in batches, and display progress

## [v2.0.0](https://mp.weixin.qq.com/s/HnlUblusvDuLIsZqae7npA) (2026-02-13)

- New Feature: Support exporting data and importing data
- Fix: Display of Chinese numbers in batch deletion keys
