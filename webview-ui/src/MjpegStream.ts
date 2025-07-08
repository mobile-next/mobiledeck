export interface MjpegStreamCallback {
	(imageUrl: string): void;
}

export class MjpegStream {
	private reader: ReadableStreamDefaultReader<Uint8Array>;
	private onImageCallback: MjpegStreamCallback;
	private isActive: boolean = false;
	private currentImageUrl: string = "";

	constructor(reader: ReadableStreamDefaultReader<Uint8Array>, onImageCallback: MjpegStreamCallback) {
		this.reader = reader;
		this.onImageCallback = onImageCallback;
	}

	public start(): void {
		this.isActive = true;
		this.processMjpegStream();
	}

	public stop(): void {
		this.isActive = false;
		if (this.currentImageUrl) {
			URL.revokeObjectURL(this.currentImageUrl);
			this.currentImageUrl = "";
		}
	}

	private async processMjpegStream(): Promise<void> {
		const boundary = '--BoundaryString';
		let buffer = new Uint8Array();
		let inImage = false;
		let imageData = new Uint8Array();
		let contentLength = 0;
		let bytesRead = 0;

		console.log("mobiledeck: starting mjpeg stream");
		try {
			while (this.isActive) {
				const { done, value } = await this.reader.read();

				if (done) {
					console.log('MJPEG stream ended');
					break;
				}

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
							this.displayMjpegImage(imageData);
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

	private displayMjpegImage(imageData: Uint8Array): void {
		try {
			const blob = new Blob([imageData], { type: 'image/jpeg' });
			const newImageUrl = URL.createObjectURL(blob);

			// Clean up previous URL
			if (this.currentImageUrl) {
				URL.revokeObjectURL(this.currentImageUrl);
			}

			this.currentImageUrl = newImageUrl;
			this.onImageCallback(newImageUrl);
		} catch (error) {
			console.error('Error displaying MJPEG image:', error);
		}
	}
}
