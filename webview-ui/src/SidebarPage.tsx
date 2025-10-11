import React, { useState } from 'react';
import { Plus, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';
import { DeviceDescriptor, DevicePlatform, DeviceType } from './models';

// icon components
function AndroidIcon() {
  return (
    <svg fill="#b3b3b3" width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.35 12.653l2.496-4.323c0.044-0.074 0.070-0.164 0.070-0.26 0-0.287-0.232-0.519-0.519-0.519-0.191 0-0.358 0.103-0.448 0.257l-0.001 0.002-2.527 4.377c-1.887-0.867-4.094-1.373-6.419-1.373s-4.532 0.506-6.517 1.413l0.098-0.040-2.527-4.378c-0.091-0.156-0.259-0.26-0.45-0.26-0.287 0-0.519 0.232-0.519 0.519 0 0.096 0.026 0.185 0.071 0.262l-0.001-0.002 2.496 4.323c-4.286 2.367-7.236 6.697-7.643 11.744l-0.003 0.052h29.991c-0.41-5.099-3.36-9.429-7.57-11.758l-0.076-0.038zM9.098 20.176c-0 0-0 0-0 0-0.69 0-1.249-0.559-1.249-1.249s0.559-1.249 1.249-1.249c0.69 0 1.249 0.559 1.249 1.249v0c-0.001 0.689-0.559 1.248-1.249 1.249h-0zM22.902 20.176c-0 0-0 0-0 0-0.69 0-1.249-0.559-1.249-1.249s0.559-1.249 1.249-1.249c0.69 0 1.249 0.559 1.249 1.249v0c-0.001 0.689-0.559 1.248-1.249 1.249h-0z"></path>
    </svg>
  );
}

function IosIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 842.32007 1000.0001">
      <path fill="#b3b3b3" d="M824.66636 779.30363c-15.12299 34.93724-33.02368 67.09674-53.7638 96.66374-28.27076 40.3074-51.4182 68.2078-69.25717 83.7012-27.65347 25.4313-57.2822 38.4556-89.00964 39.1963-22.77708 0-50.24539-6.4813-82.21973-19.629-32.07926-13.0861-61.55985-19.5673-88.51583-19.5673-28.27075 0-58.59083 6.4812-91.02193 19.5673-32.48053 13.1477-58.64639 19.9994-78.65196 20.6784-30.42501 1.29623-60.75123-12.0985-91.02193-40.2457-19.32039-16.8514-43.48632-45.7394-72.43607-86.6641-31.060778-43.7024-56.597041-94.37983-76.602609-152.15586C10.740416 658.44309 0 598.01283 0 539.50845c0-67.01648 14.481044-124.8172 43.486336-173.25401C66.28194 327.34823 96.60818 296.6578 134.5638 274.1276c37.95566-22.53016 78.96676-34.01129 123.1321-34.74585 24.16591 0 55.85633 7.47508 95.23784 22.166 39.27042 14.74029 64.48571 22.21538 75.54091 22.21538 8.26518 0 36.27668-8.7405 83.7629-26.16587 44.90607-16.16001 82.80614-22.85118 113.85458-20.21546 84.13326 6.78992 147.34122 39.95559 189.37699 99.70686-75.24463 45.59122-112.46573 109.4473-111.72502 191.36456.67899 63.8067 23.82643 116.90384 69.31888 159.06309 20.61664 19.56727 43.64066 34.69027 69.2571 45.4307-5.55531 16.11062-11.41933 31.54225-17.65372 46.35662zM631.70926 20.0057c0 50.01141-18.27108 96.70693-54.6897 139.92782-43.94932 51.38118-97.10817 81.07162-154.75459 76.38659-.73454-5.99983-1.16045-12.31444-1.16045-18.95003 0-48.01091 20.9006-99.39207 58.01678-141.40314 18.53027-21.27094 42.09746-38.95744 70.67685-53.0663C578.3158 9.00229 605.2903 1.31621 630.65988 0c.74076 6.68575 1.04938 13.37191 1.04938 20.00505z"/>
    </svg>
  );
}

// mock data with 5 random devices
const mockDevices: DeviceDescriptor[] = [
  {
    id: '1',
    name: 'Pixel 9 Pro Fold',
    platform: DevicePlatform.ANDROID,
    type: DeviceType.EMULATOR
  },
  {
    id: '2',
    name: 'iPhone 17 Pro',
    platform: DevicePlatform.IOS,
    type: DeviceType.SIMULATOR
  },
  {
    id: '3',
    name: 'Samsung Galaxy S24',
    platform: DevicePlatform.ANDROID,
    type: DeviceType.REAL
  },
  {
    id: '4',
    name: 'iPad Pro',
    platform: DevicePlatform.IOS,
    type: DeviceType.SIMULATOR
  },
  {
    id: '5',
    name: 'Pixel 8',
    platform: DevicePlatform.ANDROID,
    type: DeviceType.EMULATOR
  }
];

interface DeviceRowProps {
  device: DeviceDescriptor;
}

function DeviceRow({ device }: DeviceRowProps) {
  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#2d2d2d] rounded cursor-pointer group"
    >
      {/* device icon */}
      <div className="flex-shrink-0">
        {device.platform === DevicePlatform.ANDROID ? <AndroidIcon /> : <IosIcon />}
      </div>

      {/* device name and type */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[#cccccc]">
          {device.name}
          {device.type === DeviceType.EMULATOR && ' (Emulator)'}
          {device.type === DeviceType.SIMULATOR && ' (Simulator)'}
        </span>
      </div>

      {/* platform label */}
      <div className="text-xs text-[#858585]">
        {device.platform}
      </div>
    </div>
  );
}

function SidebarPage() {
  const [isLocalDevicesExpanded, setIsLocalDevicesExpanded] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc]">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2d2d2d]">
        <h1 className="text-sm font-semibold tracking-wide uppercase">MOBILEDECK: DEVICES</h1>
        <div className="flex gap-2">
          <button className="text-[#cccccc] hover:bg-[#2d2d2d] p-1 rounded">
            <Plus className="h-4 w-4" />
          </button>
          <button className="text-[#cccccc] hover:bg-[#2d2d2d] p-1 rounded">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* device list */}
      <div className="flex-1 overflow-y-auto">
        {/* local devices section */}
        <div className="px-4 py-2">
          <div
            className="flex items-center gap-2 text-sm text-[#cccccc] mb-2 cursor-pointer hover:bg-[#2d2d2d] rounded px-1 py-1 select-none"
            onClick={() => setIsLocalDevicesExpanded(!isLocalDevicesExpanded)}
          >
            {isLocalDevicesExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11 2H5a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1zM8 12.5a.5.5 0 110-1 .5.5 0 010 1z"/>
            </svg>
            <span className="font-medium">Local devices:</span>
            <span className="text-[#858585]">{mockDevices.length} device{mockDevices.length !== 1 ? 's' : ''}</span>
          </div>

          {/* device items */}
          {isLocalDevicesExpanded && (
            <div className="ml-6">
              {mockDevices.map((device) => (
                <DeviceRow key={device.id} device={device} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SidebarPage;
