const MAX_IMAGE_WIDTH = 300;
const MAX_IMAGE_HEIGHT = 200;
const WIDTH_RATIO = 0.3;
const HEIGHT_RATIO = 0.3;
export const PATH_MIN_WIDTH = 300;
export const PATH_MIN_HEIGHT = 220;

export const getImageMaxDimensions = () => ({
	maxWidth: Math.min(MAX_IMAGE_WIDTH, window.innerWidth * WIDTH_RATIO),
	maxHeight: Math.min(MAX_IMAGE_HEIGHT, window.innerHeight * HEIGHT_RATIO),
});

export const getInitialImageDimensions = () => getImageMaxDimensions();

export const getPathMinimumDimensions = (width, height, aspectRatio) => {
	const safeWidth = Math.max(Number(width) || 1, 1);
	const safeHeight = Math.max(Number(height) || 1, 1);
	const ratio = Number(aspectRatio) > 0 ? Number(aspectRatio) : safeWidth / safeHeight;
	const baseHeight = safeWidth / ratio;
	const scale = Math.max(1, PATH_MIN_WIDTH / safeWidth, PATH_MIN_HEIGHT / baseHeight);

	return {
		width: Math.round(safeWidth * scale),
		height: Math.round(baseHeight * scale),
	};
};

export const getPathMinimumScale = (width, height) =>
	Math.max(0.2, PATH_MIN_WIDTH / (Number(width) || 1), PATH_MIN_HEIGHT / (Number(height) || 1));

export const getPathPreviewOffset = (depth, width, height, scale = 1) => {
	const elementScale = Math.max(Number(scale) || 1, 0.1);
	const footprintScale = Math.max(
		elementScale,
		(Number(width) || PATH_MIN_WIDTH) / PATH_MIN_WIDTH,
		(Number(height) || PATH_MIN_HEIGHT) / PATH_MIN_HEIGHT,
	);

	return (depth * 8 * Math.sqrt(footprintScale)) / elementScale;
};

export const fitImageDimensions = (naturalWidth, naturalHeight) => {
	const { maxWidth, maxHeight } = getImageMaxDimensions();

	if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth <= 0 || naturalHeight <= 0) {
		return { width: maxWidth, height: maxHeight };
	}

	const scale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);

	return {
		width: Math.max(1, Math.round(naturalWidth * scale)),
		height: Math.max(1, Math.round(naturalHeight * scale)),
	};
};
