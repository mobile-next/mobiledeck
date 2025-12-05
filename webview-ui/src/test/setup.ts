// test setup file for vitest

// throw if createImageBitmap is not available
if (typeof createImageBitmap === 'undefined') {
	throw new Error('createImageBitmap is not available in this environment');
}
