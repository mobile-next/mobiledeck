import React, { useEffect, useState } from "react";
import { Wifi } from "lucide-react";
import { DeviceDescriptor, ScreenSize } from "./models";

export interface DeviceStreamProps {
	isConnecting: boolean;
	selectedDevice: DeviceDescriptor | null;
	screenSize: ScreenSize;
	imageUrl: string;
	onTap: (x: number, y: number) => void;
	onGesture: (points: Array<[number, number, number]>) => void;
	onKeyDown: (key: string) => void;
}

interface ClickAnimation {
	id: number;
	x: number;
	y: number;
}

interface GesturePoint {
	x: number;
	y: number;
	timestamp: number;
}

interface GestureState {
	isGesturing: boolean;
	startTime: number;
	points: GesturePoint[];
	path: Array<[number, number]>;
}

export const DeviceStream: React.FC<DeviceStreamProps> = ({
	isConnecting,
	selectedDevice,
	screenSize,
	imageUrl,
	onTap,
	onGesture,
	onKeyDown,
}) => {
	const [clicks, setClicks] = useState<ClickAnimation[]>([]);
	const [gestureState, setGestureState] = useState<GestureState>({
		isGesturing: false,
		startTime: 0,
		points: [],
		path: []
	});

	const convertToScreenCoords = (clientX: number, clientY: number, imgElement: HTMLImageElement) => {
		const rect = imgElement.getBoundingClientRect();
		const x = clientX - rect.left;
		const y = clientY - rect.top;
		const screenX = Math.floor((x / imgElement.width) * screenSize.width);
		const screenY = Math.floor((y / imgElement.height) * screenSize.height);
		return { x, y, screenX, screenY };
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
		const coords = convertToScreenCoords(e.clientX, e.clientY, e.currentTarget);
		const now = Date.now();

		setGestureState({
			isGesturing: false,
			startTime: now,
			points: [{ x: coords.screenX, y: coords.screenY, timestamp: now }],
			path: [[coords.x, coords.y]]
		});
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
		if (gestureState.points.length === 0) {
			return;
		}

		const coords = convertToScreenCoords(e.clientX, e.clientY, e.currentTarget);
		const now = Date.now();

		// If we've been dragging for more than 100ms, start collecting gesture
		if (!gestureState.isGesturing && (now - gestureState.startTime) > 100) {
			setGestureState((prev: GestureState) => ({
				...prev,
				isGesturing: true
			}));
		}

		if (gestureState.isGesturing || (now - gestureState.startTime) > 100) {
			setGestureState((prev: GestureState) => ({
				...prev,
				isGesturing: true,
				points: [...prev.points, { x: coords.screenX, y: coords.screenY, timestamp: now }],
				path: [...prev.path, [coords.x, coords.y]]
			}));
		}
	};

	const handleMouseUp = (e: React.MouseEvent<HTMLImageElement>) => {
		if (gestureState.points.length === 0) {
			return;
		}

		const coords = convertToScreenCoords(e.clientX, e.clientY, e.currentTarget);
		const now = Date.now();

		if (gestureState.isGesturing) {
			// Add final point and send gesture
			const finalPoints = [...gestureState.points, { x: coords.screenX, y: coords.screenY, timestamp: now }];
			const gestureData: Array<[number, number, number]> = finalPoints.map(point => [
				point.x,
				point.y,
				point.timestamp - gestureState.startTime,
			]);

			onGesture(gestureData);
		} else {
			// This was a quick tap, use existing tap logic
			const newClick: ClickAnimation = {
				id: Date.now(),
				x: coords.x,
				y: coords.y,
			};

			setClicks(prevClicks => [...prevClicks, newClick]);

			setTimeout(() => {
				setClicks(prevClicks => prevClicks.filter(c => c.id !== newClick.id));
			}, 400);

			onTap(coords.screenX, coords.screenY);
		}

		// Reset gesture state
		setGestureState({
			isGesturing: false,
			startTime: 0,
			points: [],
			path: []
		});
	};

	return (
		<div className="relative flex-grow flex items-center justify-center overflow-hidden focus:outline-none" style={{backgroundColor: "#202224"}} tabIndex={0} onKeyDown={(e) => onKeyDown(e.key)}>
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
												className="w-full h-full object-contain cursor-crosshair"
												style={{ maxHeight: 'calc(100vh - 8em)', maxWidth: 'calc(100vw - 2em)' }}
												onMouseDown={handleMouseDown}
												onMouseMove={handleMouseMove}
												onMouseUp={handleMouseUp}
												onMouseLeave={handleMouseUp}
												draggable={false}
											/>
											{clicks.map(click => (
												<div
													key={click.id}
													className="click-animation"
													style={{ left: `${click.x}px`, top: `${click.y}px` }}
												/>
											))}
											{gestureState.isGesturing && gestureState.path.length > 1 && (
												<svg
													className="absolute inset-0 pointer-events-none"
													style={{ width: '100%', height: '100%' }}
												>
													<polyline
														fill="none"
														stroke="#ffff00"
														strokeWidth="5"
														strokeLinecap="round"
														strokeLinejoin="round"
														points={gestureState.path.map((point: [number, number]) => `${point[0]},${point[1]}`).join(' ')}
													/>
												</svg>
											)}
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
