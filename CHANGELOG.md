## [0.0.12](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.12) (2025-11-03)

- General: added device controls on the right-side of the mobile device

## [0.0.4](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.4) (2025-09-08)

- General: changed design to open list of devices in a tree view manner
- General: fixed race conditioning when listing available devices upon extension first appear
- Android: added support for POWER and APP_SWITCH buttons

## [0.0.3](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.3) (2025-08-27)

- General: split .vsix per platforms (5 targets total) for smaller file size
- General: mouse taps on device are visible as a yellow circle
- General: support for mjpeg stream for all platforms
- General: use of jsonrpc protocol instead of mobilecli executions
- General: support for swipe
- General: restore connection to previously selected device when re-activating panel
- General: smaller .js bundles with webpack set to "production"
- iOS: go-ios is now bundled within mobiledeck, no external dependency needed

