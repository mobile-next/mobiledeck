import { DeviceDescriptor } from "./models";

interface DeviceSkinInsets {
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
		top: 70,
		left: 70,
		right: 70,
		bottom: 75,
	},
	borderRadius: 170,
};

// ipad skin (ipad devices)
export const iPadSkin: DeviceSkin = {
	imageFilename: 'iPad_Pro_11.png',
	insets: {
		top: 110,
		left: 115,
		right: 115,
		bottom: 110,
	},
	borderRadius: 35,
};

// allowed skin filenames
const ALLOWED_SKIN_FILES = [
	'iPhone_with_island.png',
	'iPhone_with_notch.png',
	'android.png',
	'iPad_Pro_11.png'
];

export const isSanitizedSkinOverlayUri = (uriPrefix: string): boolean => {
	// reject empty or undefined
	if (!uriPrefix || uriPrefix.trim() === '') {
		return false;
	}

	// reject path traversal attempts
	if (uriPrefix.includes('..')) {
		console.warn('rejected media skins uri with path traversal: ', uriPrefix);
		return false;
	}

	// reject absolute paths (starting with /)
	if (uriPrefix.startsWith('/')) {
		console.warn('rejected absolute path for media skins uri: ', uriPrefix);
		return false;
	}

	// reject backslashes (windows path traversal)
	if (uriPrefix.includes('\\')) {
		console.warn('rejected media skins uri with backslashes: ', uriPrefix);
		return false;
	}

	// only allow paths that start with "skins" or contain "skins" as a directory component
	// this ensures we're in a safe, local resource directory
	const normalizedPath = uriPrefix.replace(/\/+/g, '/').replace(/\/$/, '');
	if (!normalizedPath.startsWith('skins') && !normalizedPath.includes('/skins')) {
		console.warn('rejected media skins uri not in skins directory: ', uriPrefix);
		return false;
	}

	// check allowlist
	const parts = normalizedPath.split('/');
	const skinFile = parts[parts.length - 1];
	if (!ALLOWED_SKIN_FILES.includes(skinFile)) {
		console.warn('rejected media skins uri with non-allowed skin file: ', uriPrefix);
		return false;
	}

	// all checks passed
	return true;
};

export function getDeviceSkinForDevice(device: DeviceDescriptor): DeviceSkin {
	// android devices use android skin
	if (device.platform === 'android') {
		return AndroidDeviceSkin;
	}

	if (device.platform === 'ios') {

		// ipad devices use ipad skin
		if (device.name.includes('iPad')) {
			return iPadSkin;
		}

		// iphone x has notch (special case without numeric model)
		if (device.name.startsWith('iPhone X')) {
			return iPhoneWithNotchSkin;
		}

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
		}

		// fallthrough: we choose a device with a notch. this is a bug.
		// TODO: `xcrun simctl list devices -j | jq '.devices[][]'` lists deviceTypeIdentifier like "com.apple.CoreSimulator.SimDeviceType.iPad-mini-A17-Pro"
		return iPhoneWithNotchSkin;
	}

	// default: no skin
	return NoDeviceSkin;
}
