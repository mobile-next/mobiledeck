import React, { useState } from 'react';
import { RotateIcon, CameraIcon, HomeIcon, BackIcon, AppSwitchIcon, VolumeUpIcon, VolumeDownIcon, PowerIcon } from './CustomIcons';

interface DeviceControlsProps {
	onRotateDevice: () => void;
	onTakeScreenshot: () => void;
	onDeviceHome: () => void;
	onDeviceBack?: () => void;
	onAppSwitch?: () => void;
	onIncreaseVolume: () => void;
	onDecreaseVolume: () => void;
	onTogglePower: () => void;
}

interface ControlButtonProps {
	onClick: () => void;
	icon: React.ReactNode;
	text: string;
	isActive?: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({ onClick, icon, text, isActive = false }) => {
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);

	return (
		<div style={{ position: 'relative', height: '56px' }}>
			<button
				onClick={onClick}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => {
					setIsHovered(false);
					setIsPressed(false);
				}}
				onMouseDown={() => setIsPressed(true)}
				onMouseUp={() => setIsPressed(false)}
				title={text}
				style={{
					width: isHovered ? '150px' : '56px',
					height: '56px',
					background: isActive
						? 'linear-gradient(135deg, #00ff88 0%, #00cc6f 100%)'
						: (isHovered ? '#2a2a2a' : '#1a1a1a'),
					border: (isActive || isHovered) ? '1px solid #00ff88' : '1px solid #2a2a2a',
					borderRadius: '12px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'flex-start',
					cursor: 'pointer',
					transition: isHovered ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0s' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
					position: isHovered ? 'relative' : 'absolute',
					overflow: 'hidden',
					padding: '0 16px',
					color: isActive ? '#0a0a0a' : '#888',
					left: 0,
					boxShadow: isHovered ? '0 8px 24px rgba(0, 255, 136, 0.2)' : 'none',
					zIndex: isHovered ? 1001 : 'auto',
					transform: isPressed ? 'translateX(0px) scale(0.98)' : 'translateX(0px)',
				}}
			>
				<div style={{
					width: '24px',
					height: '24px',
					color: isActive ? '#0a0a0a' : (isHovered ? '#00ff88' : '#888'),
					transition: isHovered ? 'color 0.3s 0s' : 'color 0.3s 0.3s',
					flexShrink: 0
				}}>
					{icon}
				</div>
				<span style={{
					marginLeft: '12px',
					fontSize: '12px',
					color: isActive ? '#0a0a0a' : '#e0e0e0',
					whiteSpace: 'nowrap',
					opacity: isHovered ? 1 : 0,
					transition: isHovered ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0s' : 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.3s'
				}}>
					{text}
				</span>
			</button>
		</div>
	);
};

const ControlSeparator: React.FC = () => (
	<div style={{
		height: '4px',
		display: 'flex',
		alignItems: 'center',
		position: 'relative'
	}}>
		<div style={{
			height: '1px',
			width: '4px',
			background: '#2a2a2a'
		}} />
	</div>
);

const ControlButtonsContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div
		style={{
			display: 'flex',
			flexDirection: 'column',
			gap: '12px',
			zIndex: 1000,
			marginLeft: '10px',
			position: 'relative',
			width: '56px'
		}}
	>
		{children}
	</div>
);

export const DeviceControls: React.FC<DeviceControlsProps> = ({
	onRotateDevice,
	onTakeScreenshot,
	onDeviceHome,
	onDeviceBack,
	onAppSwitch,
	onIncreaseVolume,
	onDecreaseVolume,
	onTogglePower,
}) => {

	return (
		<ControlButtonsContainer>
			{false && (
				<ControlButton
					onClick={onRotateDevice}
					icon={<RotateIcon />}
					text="Rotate"
				/>
			)}

			<ControlButton
				onClick={onTakeScreenshot}
				icon={<CameraIcon />}
				text="Screenshot"
			/>

			<ControlButton
				onClick={onDeviceHome}
				icon={<HomeIcon />}
				text="Home"
			/>

			{onDeviceBack && (
				<ControlButton
					onClick={onDeviceBack}
					icon={<BackIcon />}
					text="Back"
				/>
			)}

			{onAppSwitch && (
				<ControlButton
					onClick={onAppSwitch}
					icon={<AppSwitchIcon />}
					text="Recents"
				/>
			)}

			<ControlSeparator />

			<ControlButton
				onClick={onIncreaseVolume}
				icon={<VolumeUpIcon />}
				text="Volume Up"
			/>

			<ControlButton
				onClick={onDecreaseVolume}
				icon={<VolumeDownIcon />}
				text="Volume Down"
			/>

			<ControlButton
				onClick={onTogglePower}
				icon={<PowerIcon />}
				text="Power"
			/>
		</ControlButtonsContainer>
	);
};
