import React, { RefObject } from "react";
import { DeviceSkin as DeviceSkinType } from "./DeviceSkins";
import { isSanitizedSkinOverlayUri } from "./DeviceSkins";

export interface DeviceSkinProps {
	skinOverlayUri: string;
	deviceSkin: DeviceSkinType;
	skinRatio: number;
	deviceSkinRef: RefObject<HTMLImageElement>;
	onSkinLoad: () => void;
	children: React.ReactNode;
}

export const DeviceSkin: React.FC<DeviceSkinProps> = ({
	skinOverlayUri,
	deviceSkin,
	skinRatio,
	deviceSkinRef,
	onSkinLoad,
	children
}) => {
	// render without skin if no valid skin overlay uri
	if (!skinOverlayUri || !isSanitizedSkinOverlayUri(skinOverlayUri)) {
		return (
			<div
				className="relative"
				style={{
					borderRadius: `${deviceSkin.borderRadius}px`
				}}
			>
				{children}
			</div>
		);
	}

	// render with device skin frame
	return (
		<div className="relative">
			{/* device skin frame */}
			<img
				ref={deviceSkinRef}
				src={skinOverlayUri}
				alt=""
				className="relative"
				style={{
					maxHeight: 'calc(100vh - 100px)',
					maxWidth: 'calc(100vw - 2em)'
				}}
				draggable={false}
				onLoad={onSkinLoad}
			/>
			{/* children container positioned inside the skin bezel */}
			<div
				className="absolute flex items-center justify-center"
				style={{
					top: `${deviceSkin.insets.top * skinRatio}px`,
					left: `${deviceSkin.insets.left * skinRatio}px`,
					right: `${deviceSkin.insets.right * skinRatio}px`,
					bottom: `${deviceSkin.insets.bottom * skinRatio}px`,
					borderRadius: `${deviceSkin.borderRadius * skinRatio}px`,
					overflow: 'hidden',
					zIndex: 1
				}}
			>
				{children}
			</div>
			{/* device skin frame overlay on top */}
			<img
				src={skinOverlayUri}
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
	);
};
