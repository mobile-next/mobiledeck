## [0.0.20](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.20) (2025-11-29)

- General: merged 'available' and 'connected' device categories into one list
- General: fixed vscode output channel leak by using a single shared channel
- General: switched from Blob to ImageBitmap for faster frame rendering, moved to Canvas
- General: removed per-panel device refresh timer, reduce load on mobilecli server
- General: removed old mobiledeck commands from command palette
- General: added on-screen progress notifications from mobilecli during screen capture startup
- General: updated mobilecli to 0.0.42 (see [mobilecli releases](https://github.com/mobile-next/mobilecli/releases))

## [0.0.19](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.19) (2025-11-26)

- General: posthog-js and posthog-node packages updated to latest

## [0.0.18](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.18) (2025-11-25)

- General: added publishing to OpenVSX marketplace
- General: optimized workflow to use previously built artifacts

## [0.0.17](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.17) (2025-11-23)

- General: added documentation and feedback links to sidebar
- General: fixed device stream to remain running when panel is not visible
- General: added theme-aware mobile icon to device editor tabs
- General: removed duplicate fetch device list timer
- General: handle non-jpeg mime types in mjpeg stream

## [0.0.16](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.16) (2025-11-22)

- General: improved device connection with platform-specific animations
- General: fixed duplicate mjpeg stream start calls when device becomes available
- General: fixed localhost warning in Chrome after OAuth login
- General: updated glob package dependency

## [0.0.15](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.15) (2025-11-17)

- General: Show 3 sections: Connected, Available and Offline devices
- iOS: Added default device skin for all iPhone models
- iOS: Added device skin for portrait iPads
- iOS: Support booting, rebooting and shutting down simulators
- iOS: Added boot sequence animation for iOS devices
- Android: Support booting, rebooting, and shutting down emulators
- Android: Added boot sequence animation for Android devices

## [0.0.14](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.14) (2025-11-12)

- General: fixed race-condition where mobilecli starts after device list, causing a 2-seconds delay
- General: show device with skin and control buttons while waiting for it connect
- General: improved rightside device controls layout on big and small displays

## [0.0.13](https://github.com/mobile-next/mobiledeck/releases/tag/0.0.13) (2025-11-06)

- General: added basic telemetry for debugging

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

