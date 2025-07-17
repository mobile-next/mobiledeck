import React, { useEffect, useState } from "react";
import { Wifi } from "lucide-react";
import { DeviceDescriptor, ScreenSize } from "./models";

export interface DeviceStreamProps {
	isConnecting: boolean;
	selectedDevice: DeviceDescriptor | null;
	screenSize: ScreenSize;
	imageUrl: string;
	onTap: (x: number, y: number) => void;
	onKeyDown: (key: string) => void;
}

interface ClickAnimation {
	id: number;
	x: number;
	y: number;
}

export const DeviceStream: React.FC<DeviceStreamProps> = ({
	isConnecting,
	selectedDevice,
	screenSize,
	imageUrl,
	onTap,
	onKeyDown,
}) => {
	const [clicks, setClicks] = useState<ClickAnimation[]>([]);

	return (
		<div className="relative flex-grow flex items-center justify-center bg-black overflow-hidden focus:outline-none" tabIndex={0} onKeyDown={(e) => onKeyDown(e.key)}>
			<>
				{/* Simulated device stream */}
				<div className={`relative rounded-[36px] overflow-hidden`}>
					<div className="w-full h-full overflow-hidden">
						<div className="flex flex-col items-center justify-center h-full text-white">
							{isConnecting ? (
								<div className="animate-pulse text-center">
									Connecting to <br /> {selectedDevice?.name}...
								</div>
							) : (
								<>
									{imageUrl !== "" && (
										<div className="relative">
											{/* <div className="text-xs font-medium mb-2 break-all text-center">{selectedDevice.replace("Remote: ", "")}</div> */}
											{/* <div className="text-[10px] opacity-80"> */}
											{/* Live Streaming */}
											{/* </div> */}
											<img
												src={imageUrl}
												alt=""
												className="w-full h-full object-contain"
												style={{ maxHeight: 'calc(100vh - 8em)', maxWidth: 'calc(100vw - 2em)' }}
												onClick={(e) => {
													const rect = e.currentTarget.getBoundingClientRect();
													const x = e.clientX - rect.left;
													const y = e.clientY - rect.top;

													const newClick: ClickAnimation = {
														id: Date.now(),
														x,
														y,
													};

													setClicks(prevClicks => [...prevClicks, newClick]);

													setTimeout(() => {
														setClicks(prevClicks => prevClicks.filter(c => c.id !== newClick.id));
													}, 400);

													const screenX = Math.floor((x / e.currentTarget.width) * screenSize.width);
													const screenY = Math.floor((y / e.currentTarget.height) * screenSize.height);
													// console.log("gilm: ", x, y, screenX, screenY, e.currentTarget.width, e.currentTarget.height, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight, screenSize.scale);
													onTap(screenX, screenY);
												}}
											/>
											{clicks.map(click => (
												<div
													key={click.id}
													className="click-animation"
													style={{ left: `${click.x}px`, top: `${click.y}px` }}
												/>
											))}
										</div>
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
