# Mobiledeck

A Visual Studio Code extension for Android/iOS device previewing and management.

## Overview

Mobiledeck is a VSCode extension that allows developers to view and interact with Android/iOS devices directly within their development environment.

### Key Features

- **Device Discovery**: Automatically discover and connect to mobile devices
- **Real-time Preview**: View device screens with real-time streaming
- **Interaction**: Interact with the device though taps and keypresses
- **Remote Connection**: Connect to devices on remote hosts

### Prerequisites

- Node v20+
- VSCode (v1.85.0 or higher)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mobile-next/mobiledeck.git
   cd mobiledeck
   ```

2. Install dependencies:
   ```bash
   make npm_install
   ```

### Building

1. Build the extension:
   ```bash
   make
   ```

### Running in Development

1. Launch VSCode
2. Press Cmd-P and select: `Extensions: Install from VSIX`
3. Press Cmd-P and select: `Reload Window`
4. Open panel by clicking on Mobiledeck (M) icon, or by pressing Cmd-P and selecting `Mobiledeck: View device`

Note that you have to install and reload window every time you build a new version of the .vsix file. No need to uninstall prior.

### Working on webview-ui

You can work on the UI itself without iterating through vsix compilation. This gives you the opportunity to shorten the feedback
loop and get immediately results.

Notes:
- mobilecli server needs to be started manually on localhost:12000. Simply run `mobilecli start server --cors`.

To start an http server and webpack on watch, simply run:
```bash
cd assets
npx -y http-server
```

and in another terminal:
```bash
cd webview-ui
npm run watch
```

Then simply open http://localhost:8080/ and you should be good to go. Webpack will detect code changes and automatically rebuild, you will still need to refresh the page when desired.
