import React from "react";

function ErrorPage() {
	return (
		<div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] p-4">
			<h1 className="text-xl mb-4 text-red-500">Error</h1>
			<p>Unknown page requested.</p>
		</div>
	);
}

export default ErrorPage;
