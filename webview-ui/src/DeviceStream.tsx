import React, { useEffect } from "react";
import { Wifi } from "lucide-react";
import { DeviceDescriptor } from "./models";

export interface DeviceStreamProps {
	isRefreshing: boolean;
	isRemoteConnection: boolean;
	selectedDevice: DeviceDescriptor | null;
	screenshot: string;
	onTap: (x: number, y: number) => void;
	onKeyDown: (key: string) => void;
}

export const DeviceStream: React.FC<DeviceStreamProps> = ({
	isRefreshing,
	isRemoteConnection,
	selectedDevice,
	screenshot,
	onTap,
	onKeyDown,
}) => {
	return (
		<div className="relative flex-grow flex items-center justify-center bg-black overflow-hidden" tabIndex={0} onKeyDown={(e) => onKeyDown(e.key)}>
			<>
				{/* Simulated device stream */}
				<div className={`relative rounded-[36px] overflow-hidden`}>
					<div className="w-full h-full overflow-hidden">
						<div className="flex flex-col items-center justify-center h-full text-white">
							{isRefreshing ? (
								<div className="animate-pulse text-center">
									Connecting to <br /> {selectedDevice?.deviceName}...
								</div>
							) : (
								<>
									{screenshot !== "" && (
										<>
											{/* <div className="text-xs font-medium mb-2 break-all text-center">{selectedDevice.replace("Remote: ", "")}</div> */}
											{/* <div className="text-[10px] opacity-80"> */}
											{/* {isRemoteConnection ? "Remote Stream" : "Live Streaming"} */}
											{/* </div> */}
											<img
												src={`data:image/jpg;base64,${screenshot}`}
												alt=""
												className="w-full h-full object-contain"
												onClick={(e) => {
													const rect = e.currentTarget.getBoundingClientRect();
													const x = e.clientX - rect.left;
													const y = e.clientY - rect.top;
													const scale = 3.0;
													const screenX = Math.floor((x / e.currentTarget.width) * e.currentTarget.naturalWidth / scale);
													const screenY = Math.floor((y / e.currentTarget.height) * e.currentTarget.naturalHeight / scale);
													// convert to screenshot size
													onTap(screenX, screenY);
												}}
											/>
										</>
									)
									}
								</>
							)}
						</div>
					</div>
				</div>
			</>
		</div>
	);
};