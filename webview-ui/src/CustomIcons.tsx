import React from 'react';

export const RotateIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
		<path d="M21 3v5h-5" />
	</svg>
);

export const CameraIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
		<circle cx="12" cy="13" r="4" />
	</svg>
);

export const HomeIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
		<polyline points="9 22 9 12 15 12 15 22" />
	</svg>
);

export const BackIcon = () => (
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

export const VolumeUpIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
		<path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
	</svg>
);

export const VolumeDownIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
		<line x1="23" y1="9" x2="17" y2="15" />
		<line x1="17" y1="9" x2="23" y2="15" />
	</svg>
);

export const PowerIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}>
		<path d="M12 2v10" />
		<path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
	</svg>
);
