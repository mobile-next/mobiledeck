import React from 'react';
import vscode from '../vscode';

function GettingStartedBanner() {
	const handleGettingStartedClick = () => {
		vscode.postMessage({
			command: 'openGettingStarted'
		});
	};

	return (
		<div className="px-3 py-4">
			<div className="mt-4 p-3 bg-[#252526] border border-[#3e3e3e] rounded-md">
				<div className="flex flex-col gap-2">
					<p className="text-sm text-[#cccccc]">
						Can't find the device you were looking for? No worries, here is our getting started guide.
					</p>
					<p className="text-xs text-[#858585]">
						You can start with a simulator or emulator within minutes.
					</p>
					<button
						onClick={handleGettingStartedClick}
						className="mt-1 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:border-[#00ff88] hover:bg-[#2a2a2a] text-[#888] hover:text-[#00ff88] text-sm transition-all w-fit"
					>
						Read our wiki 🚀
					</button>
				</div>
			</div>
		</div>
	);
}

export default GettingStartedBanner;
