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

export const getPathMinimumDimensions = (width, height) => {
	const safeWidth = Math.max(Number(width) || 1, 1);
	const safeHeight = Math.max(Number(height) || 1, 1);
	const scale = Math.max(1, PATH_MIN_WIDTH / safeWidth, PATH_MIN_HEIGHT / safeHeight);

	return {
		width: Math.round(safeWidth * scale),
		height: Math.round(safeHeight * scale),
	};
};

export const getPathMinimumScale = (width, height) =>
	Math.max(0.2, PATH_MIN_WIDTH / (Number(width) || 1), PATH_MIN_HEIGHT / (Number(height) || 1));

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
