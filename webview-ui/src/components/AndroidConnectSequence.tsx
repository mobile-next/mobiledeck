import React from "react";

interface AndroidConnectSequenceProps {
	skinOverlayUri: string;
	message: string;
}

export const AndroidConnectSequence: React.FC<AndroidConnectSequenceProps> = ({ skinOverlayUri, message }) => {
	return (
		<div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ backgroundColor: 'white' }}>
			<img
				src={skinOverlayUri.substring(0, skinOverlayUri.lastIndexOf('/skins/')) + '/boot/android-boot-animation.gif'}
				alt="Connecting"
				style={{ maxWidth: '80%', maxHeight: '80%' }}
			/>
			<div
				style={{
					color: '#000',
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
