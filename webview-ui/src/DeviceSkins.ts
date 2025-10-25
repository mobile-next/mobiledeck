import { markAsUncloneable } from "node:worker_threads";

export interface DeviceSkinInsets {
	top: number;
	left: number;
	right: number;
	bottom: number;
}

export interface DeviceSkin {
	imageFilename: string;
	insets: DeviceSkinInsets;
	borderRadius: number;
}

// null object pattern - no skin, all values are 0
export const NoDeviceSkin: DeviceSkin = {
	imageFilename: '',
	insets: {
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	borderRadius: 0,
};

// iphone with dynamic island (iphone 14 pro and newer)
export const iPhoneWithIslandSkin: DeviceSkin = {
	imageFilename: 'iPhone_with_island.png',
	insets: {
		top: 21,
		left: 22,
		right: 22,
		bottom: 23,
	},
	borderRadius: 49,
};

// iphone with notch (iphone x to iphone 13 pro max)
export const iPhoneWithNotchSkin: DeviceSkin = {
	imageFilename: 'iPhone_with_notch.png',
	insets: {
		top: 19,
		left: 24,
		right: 24,
		bottom: 18,
	},
	borderRadius: 49,
};

// android device skin (generic android devices)
export const AndroidDeviceSkin: DeviceSkin = {
	imageFilename: 'android.png',
	insets: {
		top: 17,
		left: 17,
		right: 13,
		bottom: 16,
	},
	borderRadius: 170,
};

export function getDeviceSkinForDevice(device: { platform: string; name: string }): DeviceSkin {
	// android devices use android skin
	if (device.platform === 'android') {
		return AndroidDeviceSkin;
	}

	// extract iphone model number
	const m = device.name.match(/iPhone (\d+)/);
	if (m) {
		const modelNumber = parseInt(m[1]);

		if (modelNumber >= 15) {
			// iphone 15+ have dynamic island
			return iPhoneWithIslandSkin;
		}

		if (modelNumber >= 12) {
			// iphone 12-14 have notch
			return iPhoneWithNotchSkin;
		}

		// fall through, older iphones have no skin
	}

	// iphone x has notch (special case without numeric model)
	if (device.name.startsWith('iPhone X')) {
		return iPhoneWithNotchSkin;
	}

	// default: no skin
	return NoDeviceSkin;
}
