import React from "react";
import { AppleIcon } from "./AppleIcon";

interface IosConnectSequenceProps {
	message: string;
}

export const IosConnectSequence: React.FC<IosConnectSequenceProps> = ({ message }) => {
	return (
		<div className="w-full h-full flex flex-col items-center justify-center gap-6" style={{ backgroundColor: 'black' }}>
			<AppleIcon />
			<div
				style={{
					color: '#ffffff',
					fontSize: '14px',
					textAlign: 'center',
					fontWeight: 500,
				}}
			>
				{message}
			</div>
		</div>
	);
};
