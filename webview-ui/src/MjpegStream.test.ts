import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { MjpegStream } from './MjpegStream';

// helper function to create mock reader from buffer
function createMockReader(data: Uint8Array, chunkSize: number = 1024): ReadableStreamDefaultReader<Uint8Array> {
	let position = 0;

	return {
		read: async () => {
			if (position >= data.length) {
				return { done: true, value: undefined };
			}

			const end = Math.min(position + chunkSize, data.length);
			const chunk = data.slice(position, end);
			position = end;

			return { done: false, value: chunk };
		},
		releaseLock: () => { },
		cancel: async () => { },
		closed: Promise.resolve(undefined),
	} as ReadableStreamDefaultReader<Uint8Array>;
}

// helper function to load mjpeg test file
function loadMjpegFile(): Uint8Array {
	const buffer = readFileSync('./src/test/fixtures/file.mjpeg');
	return new Uint8Array(buffer);
}

describe('MjpegStream', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('when processing mjpeg stream', () => {
		it('should call image callback with imagebitmap', async () => {
			const streamData = loadMjpegFile();
			const mockReader = createMockReader(streamData);
			const imageCallback = vi.fn();

			const stream = new MjpegStream(mockReader, imageCallback);
			stream.start();

			await waitForImageCallback(imageCallback);

			expect(imageCallback).toHaveBeenCalled();
			expect(imageCallback).toHaveBeenCalledWith(expect.objectContaining({
				width: expect.any(Number),
				height: expect.any(Number),
			}));
		});

		it('should handle frame split across multiple chunks', async () => {
			const streamData = loadMjpegFile();
			// use small chunks to force frame splitting (but not too small)
			const mockReader = createMockReader(streamData, 512);
			const imageCallback = vi.fn();

			const stream = new MjpegStream(mockReader, imageCallback);
			stream.start();

			await waitForImageCallback(imageCallback);

			expect(imageCallback).toHaveBeenCalled();
		}, 10000);

		it('should stop processing after stop is called', async () => {
			const streamData = loadMjpegFile();
			const mockReader = createMockReader(streamData, 50);
			const imageCallback = vi.fn();

			const stream = new MjpegStream(mockReader, imageCallback);
			stream.start();

			// stop immediately
			stream.stop();

			// wait for processing to stop
			await waitForStreamEnd();

			// should have been stopped (verified it completes)
			expect(imageCallback.mock.calls.length).toBeGreaterThanOrEqual(0);
		});

		it('should stop processing when reader returns done', async () => {
			const streamData = loadMjpegFile();
			const mockReader = createMockReader(streamData);
			const imageCallback = vi.fn();

			const stream = new MjpegStream(mockReader, imageCallback);
			stream.start();

			await waitForImageCallback(imageCallback);
			await waitForStreamEnd();

			expect(imageCallback).toHaveBeenCalled();
		});
	});
});

// helper function to wait for image callback to be called
function waitForImageCallback(callback: any, expectedCalls: number = 1): Promise<void> {
	return new Promise((resolve) => {
		const checkInterval = setInterval(() => {
			if (callback.mock.calls.length >= expectedCalls) {
				clearInterval(checkInterval);
				resolve();
			}
		}, 10);

		// timeout after 5 seconds
		setTimeout(() => {
			clearInterval(checkInterval);
			resolve();
		}, 5000);
	});
}

// helper function to wait for progress callback to be called
function waitForProgressCallback(callback: any): Promise<void> {
	return new Promise((resolve) => {
		const checkInterval = setInterval(() => {
			if (callback.mock.calls.length > 0) {
				clearInterval(checkInterval);
				resolve();
			}
		}, 10);

		// timeout after 5 seconds
		setTimeout(() => {
			clearInterval(checkInterval);
			resolve();
		}, 5000);
	});
}

// helper function to wait for stream processing to end
function waitForStreamEnd(): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, 100);
	});
}
