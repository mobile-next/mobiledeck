import React, { useState } from 'react';

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
	);
};

const ControlSeparator: React.FC = () => (
	<div style={{
		height: '56px',
		display: 'flex',
		alignItems: 'center',
		position: 'relative'
	}}>
		<div style={{
			height: '1px',
			width: '56px',
			background: '#2a2a2a'
		}} />
	</div>
);

const RotateIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
		<path d="M21 3v5h-5" />
	</svg>
);

const CameraIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
		<circle cx="12" cy="13" r="4" />
	</svg>
);

const HomeIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9 22 9 12 15 12 15 22" />
	</svg>
);

const BackIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<line x1="19" y1="12" x2="5" y2="12" />
		<polyline points="12 19 5 12 12 5" />
	</svg>
);

export const AppSwitchIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} style={style || (className ? undefined : { width: '24px', height: '24px' })}>
		<rect x="3" y="3" width="7" height="7" />
		<rect x="14" y="3" width="7" height="7" />
		<rect x="14" y="14" width="7" height="7" />
		<rect x="3" y="14" width="7" height="7" />
	</svg>
);

const VolumeUpIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
		<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
	</svg>
);

const VolumeDownIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
		<line x1="23" y1="9" x2="17" y2="15" />
		<line x1="17" y1="9" x2="23" y2="15" />
	</svg>
);

const PowerIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<path d="M12 2v10" />
		<path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
	</svg>
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
			{false && (
				<div style={{ position: 'relative', height: '56px' }}>
					<ControlButton
						onClick={onRotateDevice}
						icon={<RotateIcon />}
						text="Rotate"
					/>
				</div>
			)}

			<div style={{ position: 'relative', height: '56px' }}>
				<ControlButton
					onClick={onTakeScreenshot}
					icon={<CameraIcon />}
					text="Screenshot"
				/>
			</div>

			<ControlSeparator />

			<div style={{ position: 'relative', height: '56px' }}>
				<ControlButton
					onClick={onDeviceHome}
					icon={<HomeIcon />}
					text="Home"
				/>
			</div>

			{onDeviceBack && (
				<div style={{ position: 'relative', height: '56px' }}>
					<ControlButton
						onClick={onDeviceBack}
						icon={<BackIcon />}
						text="Back"
					/>
				</div>
			)}

			{onAppSwitch && (
				<div style={{ position: 'relative', height: '56px' }}>
					<ControlButton
						onClick={onAppSwitch}
						icon={<AppSwitchIcon />}
						text="Recents"
					/>
				</div>
			)}

			<ControlSeparator />

			<div style={{ position: 'relative', height: '56px' }}>
				<ControlButton
					onClick={onIncreaseVolume}
					icon={<VolumeUpIcon />}
					text="Volume Up"
				/>
			</div>

			<div style={{ position: 'relative', height: '56px' }}>
				<ControlButton
					onClick={onDecreaseVolume}
					icon={<VolumeDownIcon />}
					text="Volume Down"
				/>
			</div>

			<div style={{ position: 'relative', height: '56px' }}>
				<ControlButton
					onClick={onTogglePower}
					icon={<PowerIcon />}
					text="Power"
				/>
			</div>
		</div>
	);
};
