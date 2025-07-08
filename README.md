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
   npm install
   (cd webview-ui && npm install)
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
