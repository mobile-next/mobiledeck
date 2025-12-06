type NALUnitType = 'sps' | 'pps' | 'idr' | 'non-idr' | 'other';

export interface AvcFrameCallback {
	(frame: VideoFrame): void;
}

export interface AvcErrorCallback {
	(error: Error): void;
}

export interface AvcStreamOptions {
	onFrame: AvcFrameCallback;
	onError?: AvcErrorCallback;
	width?: number;
	height?: number;
}

interface NALUnit {
	type: NALUnitType;
	data: Uint8Array;
}

export class AvcStream {
	private isActive: boolean = false;
	private decoder: VideoDecoder | null = null;
	private buffer: Uint8Array = new Uint8Array();
	private sps: Uint8Array | null = null;
	private pps: Uint8Array | null = null;
	private isConfigured: boolean = false;
	private frameCount: number = 0;

	constructor(
		private reader: ReadableStreamDefaultReader<Uint8Array>,
		private options: AvcStreamOptions
	) {
		this.initializeDecoder();
	}

	private initializeDecoder(): void {
		// check if VideoDecoder is supported
		if (typeof VideoDecoder === 'undefined') {
			const error = new Error('VideoDecoder API not supported in this browser');
			this.options.onError?.(error);
			throw error;
		}

		this.decoder = new VideoDecoder({
			output: (frame: VideoFrame) => {
				console.log(`mobiledeck: VideoDecoder output! frame=${frame.codedWidth}x${frame.codedHeight}, timestamp=${frame.timestamp}, format=${frame.format}`);
				this.options.onFrame(frame);
			},
			error: (error: Error) => {
				console.error('mobiledeck: VideoDecoder error callback triggered:', error);
				console.error('mobiledeck: error name:', error.name, 'message:', error.message);
				console.error('mobiledeck: decoder state after error:', this.decoder?.state);

				// mark as not configured so we stop trying to decode
				this.isConfigured = false;

				this.options.onError?.(error);
			}
		});

		console.log('mobiledeck: VideoDecoder initialized, state:', this.decoder.state);
	}

	public start(): void {
		this.isActive = true;
		this.processAvcStream();
	}

	public stop(): void {
		console.log('mobiledeck: stopping avc stream');
		this.isActive = false;

		// cancel the reader to immediately abort any pending read operation
		this.reader.cancel();

		// close and reset decoder
		if (this.decoder) {
			if (this.decoder.state !== 'closed') {
				this.decoder.close();
			}
			this.decoder = null;
		}

		this.isConfigured = false;
		this.sps = null;
		this.pps = null;
	}

	private findNalUnits(data: Uint8Array): NALUnit[] {
		const nalUnits: NALUnit[] = [];
		let start = -1;

		// look for start codes: 0x00 0x00 0x01 or 0x00 0x00 0x00 0x01
		for (let i = 0; i < data.length - 3; i++) {
			if (data[i] === 0 && data[i + 1] === 0) {
				let startCodeLength = 0;

				// check for 0x00 0x00 0x00 0x01
				if (i < data.length - 4 && data[i + 2] === 0 && data[i + 3] === 1) {
					startCodeLength = 4;
				}
				// check for 0x00 0x00 0x01
				else if (data[i + 2] === 1) {
					startCodeLength = 3;
				}

				if (startCodeLength > 0) {
					if (start !== -1) {
						// extract previous nal unit
						const nalData = data.slice(start, i);
						if (nalData.length > 0) {
							nalUnits.push(this.parseNalUnit(nalData));
						}
					}
					start = i + startCodeLength;
					i += startCodeLength - 1;
				}
			}
		}

		// handle last nal unit
		if (start !== -1 && start < data.length) {
			const nalData = data.slice(start);
			if (nalData.length > 0) {
				nalUnits.push(this.parseNalUnit(nalData));
			}
		}

		return nalUnits;
	}

	private parseNalUnit(data: Uint8Array): NALUnit {
		const nalHeader = data[0];
		const nalTypeValue = nalHeader & 0x1F;

		let type: NALUnitType = 'other';

		switch (nalTypeValue) {
			case 7:
				type = 'sps';
				break;
			case 8:
				type = 'pps';
				break;
			case 5:
				type = 'idr';
				break;
			case 1:
				type = 'non-idr';
				break;
			default:
				type = 'other';
				break;
		}

		// log NAL unit details
		const firstBytes = Array.from(data.slice(0, Math.min(10, data.length))).map(b => b.toString(16).padStart(2, '0')).join(' ');
		console.log(`mobiledeck: NAL unit type=${type} (${nalTypeValue}), length=${data.length}, first bytes: ${firstBytes}`);

		return { type, data };
	}

	private configureDecoder(): void {
		if (!this.sps || !this.pps) {
			console.log('mobiledeck: cannot configure - sps:', !!this.sps, 'pps:', !!this.pps);
			return;
		}

		// if decoder is closed or doesn't exist, reinitialize it
		if (!this.decoder || this.decoder.state === 'closed') {
			console.log('mobiledeck: decoder is closed or missing, reinitializing...');
			this.initializeDecoder();
		}

		if (!this.decoder) {
			console.error('mobiledeck: failed to create decoder');
			return;
		}

		// build codec string (avc1.profile.level)
		const profileIdc = this.sps[1];
		const constraintSet = this.sps[2];
		const levelIdc = this.sps[3];

		const codec = `avc1.${profileIdc.toString(16).padStart(2, '0')}${constraintSet.toString(16).padStart(2, '0')}${levelIdc.toString(16).padStart(2, '0')}`;

		console.log('mobiledeck: configuring VideoDecoder with codec:', codec, 'size:', this.options.width, 'x', this.options.height);

		// build avcC box (ISO/IEC 14496-15 format)
		const avcC = this.buildAvcCBox(this.sps, this.pps);

		try {
			this.decoder.configure({
				codec: codec,
				codedWidth: this.options.width || 1080,
				codedHeight: this.options.height || 1920,
				description: avcC,
				optimizeForLatency: true
			});

			this.isConfigured = true;
			console.log('mobiledeck: VideoDecoder configured successfully, state:', this.decoder.state);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			console.error('mobiledeck: failed to configure VideoDecoder:', err);
			this.isConfigured = false;
			this.options.onError?.(err);
		}
	}

	private buildAvcCBox(sps: Uint8Array, pps: Uint8Array): Uint8Array {
		// avcC box format:
		// - configurationVersion (1 byte) = 1
		// - AVCProfileIndication (1 byte) = sps[1]
		// - profile_compatibility (1 byte) = sps[2]
		// - AVCLevelIndication (1 byte) = sps[3]
		// - lengthSizeMinusOne (1 byte) = 0xFF (4-byte length)
		// - numOfSequenceParameterSets (1 byte) = 0xE1 (1 SPS with reserved bits)
		// - SPS length (2 bytes, big-endian)
		// - SPS data
		// - numOfPictureParameterSets (1 byte) = 1
		// - PPS length (2 bytes, big-endian)
		// - PPS data

		const avcCSize = 1 + 1 + 1 + 1 + 1 + 1 + 2 + sps.length + 1 + 2 + pps.length;
		const avcC = new Uint8Array(avcCSize);
		let offset = 0;

		// configuration version
		avcC[offset++] = 1;

		// profile, compatibility, level from SPS
		avcC[offset++] = sps[1]; // AVCProfileIndication
		avcC[offset++] = sps[2]; // profile_compatibility
		avcC[offset++] = sps[3]; // AVCLevelIndication

		// lengthSizeMinusOne (0xFF = 4-byte NAL length)
		avcC[offset++] = 0xFF;

		// number of SPS (0xE1 = 0b11100001, top 3 bits reserved, lower 5 bits = 1)
		avcC[offset++] = 0xE1;

		// SPS length (2 bytes, big-endian)
		avcC[offset++] = (sps.length >> 8) & 0xFF;
		avcC[offset++] = sps.length & 0xFF;

		// SPS data
		avcC.set(sps, offset);
		offset += sps.length;

		// number of PPS
		avcC[offset++] = 1;

		// PPS length (2 bytes, big-endian)
		avcC[offset++] = (pps.length >> 8) & 0xFF;
		avcC[offset++] = pps.length & 0xFF;

		// PPS data
		avcC.set(pps, offset);

		// log avcC box
		const avcCHex = Array.from(avcC.slice(0, Math.min(50, avcC.length))).map(b => b.toString(16).padStart(2, '0')).join(' ');
		console.log(`mobiledeck: built avcC box, size=${avcC.length}, first 50 bytes: ${avcCHex}`);

		return avcC;
	}

	private async decodeFrame(nalUnit: NALUnit): Promise<void> {
		if (!this.decoder || !this.isConfigured || this.decoder.state === 'closed') {
			console.log(`mobiledeck: skipping decode - decoder=${!!this.decoder}, configured=${this.isConfigured}, state=${this.decoder?.state}`);
			return;
		}

		const isKeyFrame = nalUnit.type === 'idr';
		const timestamp = this.frameCount * 16666; // assume ~60fps (16.666ms per frame)

		console.log(`mobiledeck: decoding frame #${this.frameCount}, type=${isKeyFrame ? 'key' : 'delta'}, size=${nalUnit.data.length}, decoder.state=${this.decoder.state}`);

		try {
			// convert from Annex B to AVCC format (length-prefixed)
			// avcC config uses lengthSizeMinusOne=0xFF (4-byte length prefix)
			const avccData = new Uint8Array(4 + nalUnit.data.length);
			// write 4-byte length (big-endian)
			avccData[0] = (nalUnit.data.length >> 24) & 0xFF;
			avccData[1] = (nalUnit.data.length >> 16) & 0xFF;
			avccData[2] = (nalUnit.data.length >> 8) & 0xFF;
			avccData[3] = nalUnit.data.length & 0xFF;
			// copy NAL unit data
			avccData.set(nalUnit.data, 4);

			const chunk = new EncodedVideoChunk({
				type: isKeyFrame ? 'key' : 'delta',
				timestamp: timestamp,
				data: avccData
			});

			this.decoder.decode(chunk);
			this.frameCount++;
			console.log(`mobiledeck: frame #${this.frameCount - 1} queued for decoding, queue length=${this.decoder.decodeQueueSize}`);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			console.error('mobiledeck: error decoding frame:', err);
			console.error('mobiledeck: marking decoder as not configured due to decode error');
			this.isConfigured = false;
		}
	}

	private async processAvcStream(): Promise<void> {
		console.log('mobiledeck: starting avc stream');
		let processedBytes = 0;

		try {
			while (this.isActive) {
				const { done, value } = await this.reader.read();

				if (done) {
					console.log('mobiledeck: avc stream ended by server');
					break;
				}

				// append new data to buffer
				const newBuffer = new Uint8Array(this.buffer.length + value.length);
				newBuffer.set(this.buffer);
				newBuffer.set(value, this.buffer.length);
				this.buffer = newBuffer;

				// find all start codes to extract complete NAL units
				const startCodes: Array<{index: number, length: number}> = [];

				for (let i = 0; i < this.buffer.length - 3; i++) {
					if (this.buffer[i] === 0 && this.buffer[i + 1] === 0) {
						let startCodeLength = 0;

						// check for 0x00 0x00 0x00 0x01
						if (i < this.buffer.length - 4 && this.buffer[i + 2] === 0 && this.buffer[i + 3] === 1) {
							startCodeLength = 4;
						}
						// check for 0x00 0x00 0x01
						else if (this.buffer[i + 2] === 1) {
							startCodeLength = 3;
						}

						if (startCodeLength > 0) {
							startCodes.push({index: i, length: startCodeLength});
							i += startCodeLength - 1;
						}
					}
				}

				// process complete NAL units (we need at least 2 start codes to have a complete NAL unit)
				for (let i = 0; i < startCodes.length - 1; i++) {
					const start = startCodes[i].index + startCodes[i].length;
					const end = startCodes[i + 1].index;
					const nalData = this.buffer.slice(start, end);

					if (nalData.length > 0) {
						const nalUnit = this.parseNalUnit(nalData);

						// process NAL unit
						if (nalUnit.type === 'sps') {
							console.log('mobiledeck: received SPS, length:', nalUnit.data.length);
							this.sps = nalUnit.data;

							if (this.pps && !this.isConfigured) {
								this.configureDecoder();
							}
						} else if (nalUnit.type === 'pps') {
							console.log('mobiledeck: received PPS, length:', nalUnit.data.length);
							this.pps = nalUnit.data;

							if (this.sps && !this.isConfigured) {
								this.configureDecoder();
							}
						} else if (nalUnit.type === 'idr' || nalUnit.type === 'non-idr') {
							await this.decodeFrame(nalUnit);
						}
					}
				}

				// keep only data from the last start code onward (incomplete NAL unit)
				if (startCodes.length > 0) {
					const lastStartCode = startCodes[startCodes.length - 1];
					this.buffer = this.buffer.slice(lastStartCode.index);
				}

				// yield to event loop
				await new Promise(resolve => setTimeout(resolve, 0));
			}
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			if (err.name === 'AbortError') {
				console.log('mobiledeck: avc stream processing aborted');
			} else {
				console.error('mobiledeck: avc processing failed:', err);
				this.options.onError?.(err);
			}
		}
	}
}
