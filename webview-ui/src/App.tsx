import React, { useState, useEffect } from 'react';
import { ChevronDown, MoreVertical, Play, Pause, RefreshCw, Wifi, X, Server, Smartphone, LinkIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Header } from './Header';
import { ConnectDialog } from './ConnectDialog';
import { DeviceStream } from './DeviceStream';
import { DeviceDescriptor } from './models';

declare function acquireVsCodeApi(): any;

let vscode: any = null;
try {
  vscode = acquireVsCodeApi();
} catch (error) {
  console.error("Failed to acquire VS Code API:", error);
}

interface StatusBarProps {
  isRefreshing: boolean;
  isRemoteConnection: boolean;
  selectedDevice: DeviceDescriptor | null;
}

// New: StatusBar Component
const StatusBar: React.FC<StatusBarProps> = ({
  isRefreshing,
  isRemoteConnection,
  selectedDevice,
}) => {
  return (
    <div className="px-2 py-1 text-[10px] text-gray-500 border-t border-[#333333] flex justify-between">
      <span>USB: Connected</span>
      <span>FPS: {isRefreshing ? "..." : "60"}</span>
    </div>
  );
};

function App() {
  const [selectedDevice, setSelectedDevice] = useState<DeviceDescriptor | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [remoteHostIp, setRemoteHostIp] = useState("");
  const [recentHosts, setRecentHosts] = useState<string[]>([
    "192.168.1.101",
    "10.0.0.5",
  ]);

  const [isRemoteConnection, setIsRemoteConnection] = useState(false);
  const [localDevices, setLocalDevices] = useState<Array<DeviceDescriptor>>([]);
  const [screenshot, setScreenshot] = useState<string>("");

  const onNewDevices = (devices: DeviceDescriptor[]) => {
    setLocalDevices(devices);
    setIsRefreshing(false);
  };

  const requestScreenshot = (deviceId: string) => {
    vscode.postMessage({ command: 'requestScreenshot', deviceId: deviceId }, '*');
  };

  const onNewScreenshot = (deviceId: string, screenshot: string) => {
    setScreenshot(screenshot);
    setTimeout(() => {
      requestScreenshot(deviceId);
    }, 50);
  };

  const requestDevices = () => {
    vscode.postMessage({ command: 'requestDevices' }, '*');
  };

  const refreshDeviceList = () => {
    setIsRefreshing(true);
    requestDevices();
  };

  const handleConnectToHost = () => {
    if (!remoteHostIp.trim()) { return; }
    const newHost = remoteHostIp.trim();

    // Update recent hosts
    setRecentHosts(prevHosts => {
      const updatedHosts = [newHost, ...prevHosts.filter(h => h !== newHost)];
      return updatedHosts.slice(0, 3); // Keep only the last 3
    });

    selectDevice({ deviceId: `Remote: ${newHost}`, deviceName: newHost });
    setShowConnectDialog(false);
    setRemoteHostIp(""); // Clear input after connecting
  };

  const selectDevice = (device: DeviceDescriptor) => {
    setSelectedDevice(device);
    requestScreenshot(device.deviceId);
  };

  const handleTap = (x: number, y: number) => {
    vscode.postMessage({ command: 'tap', x, y, deviceId: selectedDevice?.deviceId }, '*');
  };

  const handleKeyDown = (key: string) => {
    if (key === 'Enter') {
      key = "\n";
    } else if (key === 'Backspace') {
      key = "\b";
    } else if (key === 'Delete') {
      key = "\d";
    } else if (key === ' ') {
      key = " ";
    } else if (key === 'Shift') {
      // do nothing
      return;
    }

    vscode.postMessage({ command: 'keyDown', key, deviceId: selectedDevice?.deviceId }, '*');
  };

  const handleMessage = (event: any) => {
    const message = event.data;
    
    switch (message.command) {
      case 'onNewDevices':
        onNewDevices(message.payload.devices);
        break;

      case 'onNewScreenshot':
        onNewScreenshot(message.payload.deviceId, message.payload.screenshot);
        break;
    }
  };

  const onHome = () => {
    vscode.postMessage({ command: 'pressButton', deviceId: selectedDevice?.deviceId, key: 'home' }, '*');
  };

  useEffect(() => {
    const messageHandler = (event: any) => handleMessage(event);
    window.addEventListener('message', messageHandler);
    refreshDeviceList();

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
      {/* Header with controls */}
      <Header
        selectedDevice={selectedDevice?.deviceName}
        isRefreshing={isRefreshing}
        isRemoteConnection={isRemoteConnection}
        localDevices={localDevices}
        recentHosts={recentHosts}
        onSelectDevice={selectDevice}
        onHome={() => onHome()}
        onRefresh={() => refreshDeviceList()}
        onShowConnectDialog={() => setShowConnectDialog(true)}
      />

      {/* Device stream area */}
      <DeviceStream
        isRefreshing={isRefreshing}
        isRemoteConnection={isRemoteConnection}
        selectedDevice={selectedDevice}
        screenshot={screenshot}
        onTap={handleTap}
        onKeyDown={handleKeyDown}
      />

      {/* Status bar */}
      <StatusBar
        isRefreshing={isRefreshing}
        isRemoteConnection={isRemoteConnection}
        selectedDevice={selectedDevice}
      />

      {/* Connect to Host Dialog */}
      <ConnectDialog
        isOpen={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        remoteHostIp={remoteHostIp}
        onRemoteHostIpChange={setRemoteHostIp}
        recentHosts={recentHosts}
        onConnectToHost={handleConnectToHost}
        onSelectRecentHost={(host) => { // New handler to set IP and connect for recent host
          setRemoteHostIp(host);
          // Potentially auto-connect or just fill input:
          // For now, let's just fill the input, user still needs to click "Connect"
          // If auto-connect is desired, call handleConnectToHost after setRemoteHostIp(host)
        }}
      />
    </div>);
}

export default App; 
