import React from "react";

interface PolylineProps {
	points: Array<[number, number]>;
}

export const Polyline: React.FC<PolylineProps> = ({ points }) => {
	if (points.length < 2) {
		return null;
	}

	return (
		<svg
			className="absolute inset-0 pointer-events-none"
			style={{ width: '100%', height: '100%' }}
		>
			<polyline
				fill="none"
				stroke="#00ff88"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
				points={points.map((point: [number, number]) => `${point[0]},${point[1]}`).join(' ')}
			/>
		</svg>
	);
};
