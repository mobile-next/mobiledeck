import React, { useEffect, useState, useRef } from "react";
import { Wifi } from "lucide-react";
import { DeviceDescriptor, ScreenSize } from "./models";
import { DeviceSkin, sanitizeMediaSkinUri } from "./DeviceSkins";
import { Polyline } from "./Polyline";

export interface GesturePoint {
	x: number;
	y: number;
	duration: number;
}

export interface DeviceStreamProps {
	isConnecting: boolean;
	selectedDevice: DeviceDescriptor | null;
	screenSize: ScreenSize;
	imageUrl: string;
	skinOverlayUri: string;
	deviceSkin: DeviceSkin;
	onTap: (x: number, y: number) => void;
	onGesture: (points: Array<GesturePoint>) => void;
	onKeyDown: (key: string) => void;
}

interface ClickAnimation {
	id: number;
	x: number;
	y: number;
}

interface GestureState {
	isGesturing: boolean;
	startTime: number;
	lastTimestamp: number;
	points: Array<GesturePoint>;
	path: Array<[number, number]>;
}

export const DeviceStream: React.FC<DeviceStreamProps> = ({
	isConnecting,
	selectedDevice,
	screenSize,
	imageUrl,
	skinOverlayUri,
	deviceSkin,
	onTap,
	onGesture,
	onKeyDown,
}) => {
	// sanitize skin overlay uri for defense in depth
	const safeSkinOverlayUri = sanitizeMediaSkinUri(skinOverlayUri);

	const [clicks, setClicks] = useState<ClickAnimation[]>([]);
	const [gestureState, setGestureState] = useState<GestureState>({
		isGesturing: false,
		startTime: 0,
		lastTimestamp: 0,
		points: [],
		path: []
	});
	const [skinRatio, setSkinRatio] = useState<number>(1.0);
	const deviceSkinRef = useRef<HTMLImageElement>(null);

	const calculateSkinRatio = () => {
		if (deviceSkinRef.current) {
			const naturalHeight = deviceSkinRef.current.naturalHeight;
			const renderedHeight = deviceSkinRef.current.height;
			const ratio = renderedHeight / naturalHeight;
			console.log(`Skin height ratio: ${ratio} (rendered: ${renderedHeight}px, natural: ${naturalHeight}px)`);
			setSkinRatio(ratio);
		}
	};

	useEffect(() => {
		window.addEventListener('resize', calculateSkinRatio);

		return () => {
			window.removeEventListener('resize', calculateSkinRatio);
		};
	}, []);

	const convertToScreenCoords = (clientX: number, clientY: number, imgElement: HTMLImageElement) => {
		const rect = imgElement.getBoundingClientRect();
		const x = clientX - rect.left;
		const y = clientY - rect.top;
		const screenX = Math.floor((x / imgElement.width) * screenSize.width);
		const screenY = Math.floor((y / imgElement.height) * screenSize.height);
		console.log("=> converting clientX,clientY " + clientX + "," + clientY + " to " + "x,y " + x + ","+ y);
		return { x, y, screenX, screenY };
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
		const coords = convertToScreenCoords(e.clientX, e.clientY, e.currentTarget);
		const now = Date.now();

		setGestureState({
			isGesturing: false,
			startTime: now,
			lastTimestamp: now,
			points: [{ x: coords.screenX, y: coords.screenY, duration: 0}],
			path: [[coords.x, coords.y]]
		});
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
		if (gestureState.points.length === 0) {
			// move without mousedown
			return;
		}

		const coords = convertToScreenCoords(e.clientX, e.clientY, e.currentTarget);
		const now = Date.now();

		// if we've been dragging for more than 100ms, start collecting gesture
		if (!gestureState.isGesturing && (now - gestureState.startTime) > 100) {
			setGestureState((prev: GestureState) => ({
				...prev,
				isGesturing: true
			}));
		}

		if (gestureState.isGesturing || (now - gestureState.startTime) > 100) {
			const duration = now - gestureState.lastTimestamp;
			const newPoint: GesturePoint = { x: coords.screenX, y: coords.screenY, duration };
			setGestureState((prev: GestureState) => ({
				...prev,
				isGesturing: true,
				points: [...prev.points, newPoint],
				path: [...prev.path, [coords.x, coords.y]],
				lastTimestamp: now,
			}));
		}
	};

	const handleMouseUp = (e: React.MouseEvent<HTMLImageElement>) => {
		if (gestureState.points.length === 0) {
			// up without gesture
			return;
		}

		const coords = convertToScreenCoords(e.clientX, e.clientY, e.currentTarget);
		const now = Date.now();

		if (gestureState.isGesturing) {
			// Add final point and send gesture
			const duration = now - gestureState.lastTimestamp;
			const finalPoints: Array<GesturePoint> = [...gestureState.points, { x: coords.screenX, y: coords.screenY, duration }];
			onGesture(finalPoints);
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
			lastTimestamp: 0,
			points: [],
			path: []
		});
	};

	return (
		<div className="relative flex-grow flex items-center justify-center overflow-hidden focus:outline-none" style={{backgroundColor: "#202224"}} tabIndex={0} onKeyDown={(e) => onKeyDown(e.key)}>
			<>
				{/* Simulated device stream */}
				<div className={`relative overflow-hidden`}>
					<div className="w-full h-full overflow-hidden">
						<div className="flex flex-col items-center justify-center h-full text-white">
							{isConnecting ? (
								<div className="animate-pulse text-center">
									Connecting to <br /> {selectedDevice?.name}...
								</div>
							) : (
								<>
									{imageUrl !== "" && (
										<>
											{safeSkinOverlayUri ? (
												// with device skin
												<div className="relative">
													{/* device skin frame */}
													<img
														ref={deviceSkinRef}
														src={safeSkinOverlayUri}
														alt=""
														className="relative"
														style={{ maxHeight: 'calc(100vh - 8em)', maxWidth: 'calc(100vw - 2em)' }}
														draggable={false}
														onLoad={calculateSkinRatio}
													/>
													{/* device stream container positioned inside the skin bezel */}
													<div
														className="absolute"
														style={{
															top: `${deviceSkin.insets.top * skinRatio}px`,
															left: `${deviceSkin.insets.left * skinRatio}px`,
															right: `${deviceSkin.insets.right * skinRatio}px`,
															bottom: `${deviceSkin.insets.bottom * skinRatio}px`,
															zIndex: 1
														}}
													>
														{/* device stream */}
														<img
															src={imageUrl}
															alt=""
															className="cursor-crosshair w-full h-full"
															style={{
																objectFit: 'cover',
																borderRadius: `${deviceSkin.borderRadius * skinRatio}px`
															}}
															onMouseDown={handleMouseDown}
															onMouseMove={handleMouseMove}
															onMouseUp={handleMouseUp}
															onMouseLeave={handleMouseUp}
															draggable={false}
														/>
														{/* click animations relative to stream */}
														{clicks.map(click => (
															<div
																key={click.id}
																className="click-animation"
																style={{ left: `${click.x}px`, top: `${click.y}px` }}
															/>
														))}
														{/* gesture path relative to stream */}
														{gestureState.isGesturing && <Polyline points={gestureState.path} />}
													</div>
													{/* device skin frame overlay on top */}
													<img
														src={safeSkinOverlayUri}
														alt=""
														className="pointer-events-none"
														style={{
															position: 'absolute',
															top: 0,
															left: 0,
															width: '100%',
															height: '100%',
															zIndex: 2
														}}
														draggable={false}
													/>
												</div>
											) : (
												// without device skin
												<div className="relative">
													{/* device stream */}
													<img
														src={imageUrl}
														alt=""
														className="cursor-crosshair"
														style={{
															maxHeight: 'calc(100vh - 8em)',
															maxWidth: 'calc(100vw - 2em)',
															borderRadius: `${deviceSkin.borderRadius}px`
														}}
														onMouseDown={handleMouseDown}
														onMouseMove={handleMouseMove}
														onMouseUp={handleMouseUp}
														onMouseLeave={handleMouseUp}
														draggable={false}
													/>
													{/* click animations relative to stream */}
													{clicks.map(click => (
														<div
															key={click.id}
															className="click-animation"
															style={{ left: `${click.x}px`, top: `${click.y}px` }}
														/>
													))}
													{/* gesture path relative to stream */}
													{gestureState.isGesturing && <Polyline points={gestureState.path} />}
												</div>
											)}
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
