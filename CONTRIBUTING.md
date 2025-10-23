# Contributing to Mobile Deck

Thank you for your interest in contributing to Mobile Deck! This guide will help you get started with development.

## Prerequisites

- Node v20+
- VSCode (v1.85.0 or higher)
- `make` build tool

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mobile-next/mobiledeck.git
   cd mobiledeck
   ```

2. Install dependencies:
   ```bash
   make npm_install
   ```

## Building

1. Build the extension:
   ```bash
   make

   # you can speed up development by building just the active platform like:
   make build-darwin-arm64
   ```

## Running in Development

1. Launch VSCode
2. Press Cmd-P and select: `Extensions: Install from VSIX`
3. Press Cmd-P and select: `Reload Window`
4. Open panel by clicking on Mobile Deck (M) icon on the sidebar

Note that you have to install and reload window every time you build a new version of the .vsix file. No need to uninstall prior.

## Working on webview-ui

For faster UI development, you can work on the webview interface without rebuilding the .vsix extension each time. This significantly shortens the feedback loop, allowing you to see changes immediately in your browser without the VSCode install/reload cycle.

**Benefits:**
- No need to rebuild and reinstall the .vsix extension
- Automatic rebuild on code changes (via webpack watch mode)
- Direct browser access for faster testing and debugging

**Requirements:**
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

Then simply open http://localhost:8080/?page=device and you should be good to go. Webpack will detect code changes and automatically rebuild, you will still need to refresh the page when desired.

