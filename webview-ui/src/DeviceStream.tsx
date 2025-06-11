import React, { useEffect } from "react";
import { Wifi } from "lucide-react";

export interface DeviceStreamProps {
	isRefreshing: boolean;
	isRemoteConnection: boolean;
	selectedDevice: string;
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
				<div className={`relative ${isRemoteConnection ? "w-[260px] h-[160px] rounded-lg" : "rounded-[36px]"} overflow-hidden border-4 border-[#1a1a1a] shadow-lg`}>
					{!isRemoteConnection && (
						<div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-5 bg-[#1a1a1a] rounded-b-lg z-10"></div>
					)}

					<div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
						<div className="flex flex-col items-center justify-center h-full text-white p-4">
							{isRefreshing ? (
								<div className="animate-pulse text-center">
									<Wifi className="h-6 w-6 mx-auto mb-2 text-blue-400 animate-ping" />
									Connecting to <br /> {selectedDevice.replace("Remote: ", "")}...
								</div>
							) : (
								<>
									{screenshot != "" && (
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