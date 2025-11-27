export interface MjpegStreamCallback {
	(imageBitmap: ImageBitmap): void;
}

export interface MjpegProgressCallback {
	(message: string): void;
}

export class MjpegStream {
	private isActive: boolean = false;

	constructor(
		private reader: ReadableStreamDefaultReader<Uint8Array>,
		private onImageCallback: MjpegStreamCallback,
		private onProgressCallback?: MjpegProgressCallback
	) { }

	public start(): void {
		this.isActive = true;
		this.processMjpegStream();
	}

	public stop(): void {
		this.isActive = false;
	}

	private async processMjpegStream(): Promise<void> {
		const boundary = '--BoundaryString';
		let buffer = new Uint8Array();
		let inImage = false;
		let imageData = new Uint8Array();
		let contentLength = 0;
		let contentType = '';
		let bytesRead = 0;

		console.log("mobiledeck: starting mjpeg stream");
		try {
			while (this.isActive) {
				const { done, value } = await this.reader.read();

				if (done) {
					console.log('MJPEG stream ended');
					break;
				}

				// TODO: we can do this without reallocation of memory. use copyWithin().
				const newBuffer = new Uint8Array(buffer.length + value.length);
				newBuffer.set(buffer);
				newBuffer.set(value, buffer.length);
				buffer = newBuffer;

				let processedData = false;
				while (true) {
					if (!inImage) {
						const bufferString = new TextDecoder().decode(buffer);
						const boundaryIndex = bufferString.indexOf(boundary);
						if (boundaryIndex === -1) {
							break;
						}

						const headerEndIndex = bufferString.indexOf('\r\n\r\n', boundaryIndex);
						if (headerEndIndex === -1) {
							break;
						}

						const headers = bufferString.substring(boundaryIndex + boundary.length, headerEndIndex);
						const contentLengthMatch = headers.match(/Content-Length:\s*(\d+)/i);
						if (contentLengthMatch) {
							contentLength = parseInt(contentLengthMatch[1]);
						}

						const contentTypeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i);
						contentType = contentTypeMatch ? contentTypeMatch[1].trim() : '';

						const headerEndBytes = headerEndIndex + 4;
						buffer = buffer.slice(headerEndBytes);
						inImage = true;
						imageData = new Uint8Array();
						bytesRead = 0;
						processedData = true;
					}

					if (inImage) {
						const remainingBytes = contentLength - bytesRead;
						const bytesToRead = Math.min(remainingBytes, buffer.length);

						if (bytesToRead === 0) {
							break;
						}

						const newImageData = new Uint8Array(imageData.length + bytesToRead);
						newImageData.set(imageData);
						newImageData.set(buffer.slice(0, bytesToRead), imageData.length);
						imageData = newImageData;

						bytesRead += bytesToRead;
						buffer = buffer.slice(bytesToRead);
						processedData = true;

						if (bytesRead >= contentLength) {
							// console.log('mobiledeck: frame complete, content-type:', contentType, 'bytes:', contentLength);
							if (contentType === 'image/jpeg') {
								this.displayMjpegImage(imageData);
							} else {
								// non-jpeg mime type, this will later be shown as connection progresses
								const bodyText = new TextDecoder().decode(imageData);
								console.log('non-jpeg frame received, content-type:', contentType, 'body:', bodyText);
								this.handleNonJpegFrame(contentType, bodyText);
							}

							inImage = false;
							imageData = new Uint8Array();
							bytesRead = 0;
						}
					}
				}

				if (processedData) {
					await new Promise(resolve => setTimeout(resolve, 0));
				}
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('MJPEG stream aborted');
			} else {
				console.error('Error processing MJPEG stream:', error);
			}
		}
	}

	private async displayMjpegImage(imageData: Uint8Array): Promise<void> {
		try {
			// console.log('mobiledeck: displaying jpeg image, size:', imageData.length);
			const blob = new Blob([imageData as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' });

			// create imagebitmap for fast rendering
			const imageBitmap = await createImageBitmap(blob);

			// console.log('mobiledeck: calling onImageCallback with imagebitmap:', imageBitmap.width, 'x', imageBitmap.height);
			this.onImageCallback(imageBitmap);
		} catch (error: any) {
			console.error('Error displaying MJPEG image:', error);
			console.error('Failed to decode JPEG, size:', imageData.length, 'first bytes:', Array.from(imageData.slice(0, 10)));
		}
	}

	private handleNonJpegFrame(contentType: string, bodyText: string): void {
		if (contentType === 'application/json' && this.onProgressCallback) {
			try {
				const jsonData = JSON.parse(bodyText);
				if (jsonData.jsonrpc === '2.0' && jsonData.method === 'notification/message' && jsonData.params?.message) {
					this.onProgressCallback(jsonData.params.message);
				}
			} catch (error) {
				console.error('Error parsing JSON-RPC notification:', error);
			}
		}
	}
}
