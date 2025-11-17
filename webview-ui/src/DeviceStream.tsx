import React, { useEffect, useState, useRef } from "react";
import { DeviceDescriptor, DevicePlatform, ScreenSize } from "./models";
import { DeviceSkin as DeviceSkinType } from "./DeviceSkins";
import { DeviceSkin } from "./DeviceSkin";
import { Polyline } from "./Polyline";
import { DeviceControls } from "./DeviceControls";

interface AndroidBootSequenceProps {
	skinOverlayUri: string;
}

const AndroidBootSequence: React.FC<AndroidBootSequenceProps> = ({ skinOverlayUri }) => {
	return (
		<div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
			<img
				src={skinOverlayUri.substring(0, skinOverlayUri.lastIndexOf('/skins/')) + '/boot/android-boot-animation.gif'}
				alt="Booting"
				style={{ maxWidth: '80%', maxHeight: '80%' }}
			/>
		</div>
	);
};

const IosBootSequence: React.FC = () => {
	return (
		<div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="80"
				height="80"
				viewBox="0 0 842.32007 1000.0001"
			>
				<path
					fill="#ffffff"
					d="M824.66636 779.30363c-15.12299 34.93724-33.02368 67.09674-53.7638 96.66374-28.27076 40.3074-51.4182 68.2078-69.25717 83.7012-27.65347 25.4313-57.2822 38.4556-89.00964 39.1963-22.77708 0-50.24539-6.4813-82.21973-19.629-32.07926-13.0861-61.55985-19.5673-88.51583-19.5673-28.27075 0-58.59083 6.4812-91.02193 19.5673-32.48053 13.1477-58.64639 19.9994-78.65196 20.6784-30.42501 1.29623-60.75123-12.0985-91.02193-40.2457-19.32039-16.8514-43.48632-45.7394-72.43607-86.6641-31.060778-43.7024-56.597041-94.37983-76.602609-152.15586C10.740416 658.44309 0 598.01283 0 539.50845c0-67.01648 14.481044-124.8172 43.486336-173.25401C66.28194 327.34823 96.60818 296.6578 134.5638 274.1276c37.95566-22.53016 78.96676-34.01129 123.1321-34.74585 24.16591 0 55.85633 7.47508 95.23784 22.166 39.27042 14.74029 64.48571 22.21538 75.54091 22.21538 8.26518 0 36.27668-8.7405 83.7629-26.16587 44.90607-16.16001 82.80614-22.85118 113.85458-20.21546 84.13326 6.78992 147.34122 39.95559 189.37699 99.70686-75.24463 45.59122-112.46573 109.4473-111.72502 191.36456.67899 63.8067 23.82643 116.90384 69.31888 159.06309 20.61664 19.56727 43.64066 34.69027 69.2571 45.4307-5.55531 16.11062-11.41933 31.54225-17.65372 46.35662zM631.70926 20.0057c0 50.01141-18.27108 96.70693-54.6897 139.92782-43.94932 51.38118-97.10817 81.07162-154.75459 76.38659-.73454-5.99983-1.16045-12.31444-1.16045-18.95003 0-48.01091 20.9006-99.39207 58.01678-141.40314 18.53027-21.27094 42.09746-38.95744 70.67685-53.0663C578.3158 9.00229 605.2903 1.31621 630.65988 0c.74076 6.68575 1.04938 13.37191 1.04938 20.00505z"
				/>
			</svg>
		</div>
	);
};

interface BootSequenceProps {
	device: DeviceDescriptor;
	skinOverlayUri: string;
}

const BootSequence: React.FC<BootSequenceProps> = ({ device, skinOverlayUri }) => {
	if (device.platform === DevicePlatform.ANDROID) {
		return <AndroidBootSequence skinOverlayUri={skinOverlayUri} />;
	}

	return <IosBootSequence />;
};

interface ConnectingSequenceProps {
	device: DeviceDescriptor;
}

const ConnectingSequence: React.FC<ConnectingSequenceProps> = ({ device }) => {
	return (
		<div className="w-full h-full flex items-center justify-center text-center" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
			Connecting to <br /> {device.name}...
		</div>
	);
};

export interface GesturePoint {
	x: number;
	y: number;
	duration: number;
}

export interface DeviceStreamProps {
	isConnecting: boolean;
	isBooting?: boolean;
	selectedDevice: DeviceDescriptor | null;
	screenSize: ScreenSize;
	imageUrl: string;
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

export const DeviceStream: React.FC<DeviceStreamProps> = ({
	isConnecting,
	isBooting = false,
	selectedDevice,
	screenSize,
	imageUrl,
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
}) => {
	const [clicks, setClicks] = useState<ClickAnimation[]>([]);
	const [gestureState, setGestureState] = useState<GestureState>(emptyGestureState);
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
		console.log("=> converting clientX,clientY " + clientX + "," + clientY + " to " + "x,y " + x + "," + y);
		return { x, y, screenX, screenY };
	};

	const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
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
		<div className="relative flex-grow flex items-center justify-center overflow-visible focus:outline-none" style={{ backgroundColor: "#202224", paddingTop: "24px", paddingBottom: "24px" }} tabIndex={0} onKeyDown={(e) => onKeyDown(e.key)}>
			<>
				{/* Simulated device stream */}
				<div className={`relative overflow-visible`}>
					<div className="w-full h-full overflow-visible">
						<div className="flex flex-col items-center justify-center h-full text-white">
							{(isConnecting || isBooting) && selectedDevice ? (
								<div className="relative flex items-center">
									<DeviceSkin
										skinOverlayUri={skinOverlayUri}
										deviceSkin={deviceSkin}
										skinRatio={skinRatio}
										deviceSkinRef={deviceSkinRef}
										onSkinLoad={calculateSkinRatio}
									>
										<div className="w-full h-full flex items-center justify-center text-center">
											{isBooting ? (
												<BootSequence device={selectedDevice} skinOverlayUri={skinOverlayUri} />
											) : (
												<ConnectingSequence device={selectedDevice} />
											)}
										</div>
									</DeviceSkin>
									{/* device controls positioned to the right */}
									<DeviceControls
										onRotateDevice={() => { }}
										onTakeScreenshot={() => { }}
										onDeviceHome={() => { }}
										onDeviceBack={selectedDevice.platform === DevicePlatform.ANDROID ? () => { } : undefined}
										onAppSwitch={selectedDevice.platform === DevicePlatform.ANDROID ? () => { } : undefined}
										onIncreaseVolume={() => { }}
										onDecreaseVolume={() => { }}
										onTogglePower={() => { }}
									/>
								</div>
							) : (
								<>
									{imageUrl !== "" && (
										<div className="relative flex items-center">
											<DeviceSkin
												skinOverlayUri={skinOverlayUri}
												deviceSkin={deviceSkin}
												skinRatio={skinRatio}
												deviceSkinRef={deviceSkinRef}
												onSkinLoad={calculateSkinRatio}
											>
												{/* device stream */}
												<img
													src={imageUrl}
													alt=""
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
											</DeviceSkin>
											{/* device controls positioned to the right */}
											{selectedDevice && (
												<DeviceControls
													onRotateDevice={onRotateDevice || (() => { })}
													onTakeScreenshot={onTakeScreenshot}
													onDeviceHome={onDeviceHome}
													onDeviceBack={selectedDevice.platform === DevicePlatform.ANDROID ? onDeviceBack : undefined}
													onAppSwitch={selectedDevice.platform === DevicePlatform.ANDROID ? onAppSwitch : undefined}
													onIncreaseVolume={onIncreaseVolume || (() => { })}
													onDecreaseVolume={onDecreaseVolume || (() => { })}
													onTogglePower={onTogglePower || (() => { })}
												/>
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
