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

