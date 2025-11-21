import React from "react";

interface AndroidBootSequenceProps {
	skinOverlayUri: string;
}

export const AndroidBootSequence: React.FC<AndroidBootSequenceProps> = ({ skinOverlayUri }) => {
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
