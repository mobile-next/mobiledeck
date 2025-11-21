import React, { useState, useEffect } from "react";
import { AppleIcon } from "./AppleIcon";

// boot animation timing constants
const BOOT_ANIMATION_DELAY_MS = 2000;
const BOOT_PROGRESS_DURATION_MS = 15000;
const BOOT_PROGRESS_UPDATE_INTERVAL_MS = 1000 / 30; // 30 fps

export const IosBootSequence: React.FC = () => {
	const [progress, setProgress] = useState(0);
	const [showProgressBar, setShowProgressBar] = useState(false);

	useEffect(() => {
		// wait before starting the progress bar
		const delayTimeout = setTimeout(() => {
			const startTime = Date.now();

			// progress bar appears after delay
			setShowProgressBar(true);

			const timer = setInterval(() => {
				const elapsed = Date.now() - startTime;
				const newProgress = Math.min((elapsed / BOOT_PROGRESS_DURATION_MS) * 100, 100);
				setProgress(newProgress);

				if (newProgress >= 100) {
					clearInterval(timer);
				}
			}, BOOT_PROGRESS_UPDATE_INTERVAL_MS);

			return () => clearInterval(timer);
		}, BOOT_ANIMATION_DELAY_MS);

		return () => clearTimeout(delayTimeout);
	}, []);

	return (
		<div className="w-full h-full flex flex-col items-center justify-center gap-6" style={{ backgroundColor: '#000000' }}>
			<AppleIcon />
			<div
				style={{
					width: '25%',
					height: '6px',
					overflow: 'hidden',
					borderRadius: '2px',
					backgroundColor: '#888',
					visibility: showProgressBar ? "visible" : "hidden",
				}}
			>
				<div
					style={{
						width: `${progress}%`,
						height: '100%',
						backgroundColor: '#ffffff',
						transition: 'width 0.016s linear'
					}}
				/>
			</div>
		</div>
	);
};
