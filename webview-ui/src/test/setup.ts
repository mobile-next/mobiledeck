// test setup file for vitest

// mock createImageBitmap if not available
if (typeof createImageBitmap === 'undefined') {
	global.createImageBitmap = async (blob: Blob) => {
		// create a simple mock ImageBitmap
		return {
			width: 100,
			height: 100,
			close: () => { },
		} as ImageBitmap;
	};
}
