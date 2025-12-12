import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { DeviceDescriptor, DevicePlatform, ScreenSize } from "@shared/models";
import { DeviceSkin as DeviceSkinType } from "./DeviceSkins";
import { DeviceSkin } from "./DeviceSkin";
import { Polyline } from "./Polyline";
import { DeviceControls } from "./DeviceControls";
import { BootSequence } from "./components/BootSequence";
import { ConnectSequence } from "./components/ConnectSequence";

export interface GesturePoint {
	x: number;
	y: number;
	duration: number;
}

export interface DeviceStreamHandle {
	getCanvas: () => HTMLCanvasElement | null;
}

export interface DeviceStreamProps {
	isConnecting: boolean;
	isBooting?: boolean;
	connectProgressMessage?: string;
	selectedDevice: DeviceDescriptor | null;
	screenSize: ScreenSize;
	skinOverlayUri: string;
	deviceSkin: DeviceSkinType;
	onTap: (x: number, y: number) => void;
	onGesture: (points: Array<GesturePoint>) => void;
	onKeyDown: (key: string) => void;
	onRotateDevice?: () => void;
	onTakeScreenshot: () => void;
	onDeviceHome: () => void;
	onDeviceBack?: () => void;
	onAppSwitch?: () => void;
	onIncreaseVolume?: () => void;
	onDecreaseVolume?: () => void;
	onTogglePower?: () => void;
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

const emptyGestureState: GestureState = {
	isGesturing: false,
	startTime: 0,
	lastTimestamp: 0,
	points: [],
	path: []
};

export const DeviceStream = forwardRef<DeviceStreamHandle, DeviceStreamProps>(({
	isConnecting,
	isBooting = false,
	connectProgressMessage,
	selectedDevice,
	screenSize,
	skinOverlayUri,
	deviceSkin,
	onTap,
	onGesture,
	onKeyDown,
	onRotateDevice,
	onTakeScreenshot,
	onDeviceHome,
	onDeviceBack,
	onAppSwitch,
	onIncreaseVolume,
	onDecreaseVolume,
	onTogglePower,
}, ref) => {
	const [clicks, setClicks] = useState<ClickAnimation[]>([]);
	const [gestureState, setGestureState] = useState<GestureState>(emptyGestureState);
	const [skinRatio, setSkinRatio] = useState<number>(1.0);
	const deviceSkinRef = useRef<HTMLImageElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// expose canvas to parent
	useImperativeHandle(ref, () => ({
		getCanvas: () => canvasRef.current,
	}));

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

	const convertToScreenCoords = (clientX: number, clientY: number, element: HTMLCanvasElement) => {
		const rect = element.getBoundingClientRect();
		const x = clientX - rect.left;
		const y = clientY - rect.top;
		const screenX = Math.floor((x / rect.width) * screenSize.width);
		const screenY = Math.floor((y / rect.height) * screenSize.height);
		return { x, y, screenX, screenY };
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const coords = convertToScreenCoords(e.clientX, e.clientY, e.currentTarget);
		const now = Date.now();

		setGestureState({
			isGesturing: false,
			startTime: now,
			lastTimestamp: now,
			points: [{ x: coords.screenX, y: coords.screenY, duration: 0 }],
			path: [[coords.x, coords.y]]
		});
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

	const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
		<div className="relative flex-grow flex items-center justify-center overflow-visible focus:outline-none" style={{ backgroundColor: "#202224", paddingTop: "24px", paddingBottom: "24px" }} tabIndex={0} onKeyDown={(e) => onKeyDown(e.key)}>
			{/* Simulated device stream */}
			<div className="relative overflow-visible">
				<div className="w-full h-full overflow-visible">
					<div className="flex flex-col items-center justify-center h-full text-white">
						<div className="relative flex items-center">
							<DeviceSkin
								skinOverlayUri={skinOverlayUri}
								deviceSkin={deviceSkin}
								skinRatio={skinRatio}
								deviceSkinRef={deviceSkinRef}
								onSkinLoad={calculateSkinRatio}
							>

								{(isConnecting || isBooting) && selectedDevice ? (
									<>
										<div className="w-full h-full flex items-center justify-center text-center">
											{isBooting ? (
												<BootSequence device={selectedDevice} skinOverlayUri={skinOverlayUri} />
											) : (
												<ConnectSequence device={selectedDevice} skinOverlayUri={skinOverlayUri} message={connectProgressMessage || "Connecting..."} />
											)}
										</div>
									</>
								) : (
									<>
										{/* device stream */}
										<canvas
											ref={canvasRef}
											className="cursor-crosshair w-full h-full"
											style={{
												objectFit: 'cover',
												maxHeight: 'calc(100vh - 100px)',
												maxWidth: 'calc(100vw - 2em)',
												borderRadius: `${deviceSkin.borderRadius * skinRatio}px`
											}}
											onMouseDown={handleMouseDown}
											onMouseMove={handleMouseMove}
											onMouseUp={handleMouseUp}
											onMouseLeave={handleMouseUp}
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
									</>
								)}
							</DeviceSkin>

							{/* device controls positioned to the right */}
							{selectedDevice && (
								<DeviceControls
									onRotateDevice={onRotateDevice}
									onTakeScreenshot={onTakeScreenshot}
									onDeviceHome={onDeviceHome}
									onDeviceBack={selectedDevice.platform === DevicePlatform.ANDROID ? onDeviceBack : undefined}
									onAppSwitch={selectedDevice.platform === DevicePlatform.ANDROID ? onAppSwitch : undefined}
									onIncreaseVolume={onIncreaseVolume}
									onDecreaseVolume={onDecreaseVolume}
									onTogglePower={onTogglePower}
								/>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
});
