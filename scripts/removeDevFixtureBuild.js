const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, '..', 'build');
const markers = ['dev-fixture-find-work', 'Example Organization', 'Development: load example plan'];
const removedFiles = new Set();
const sanitizedSourceMaps = [];

function collectFiles(directory) {
	if (!fs.existsSync(directory)) return [];

	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
	});
}

const staticFiles = collectFiles(path.join(buildDir, 'static'));

staticFiles
	.filter((filePath) => !filePath.endsWith('.map'))
	.forEach((filePath) => {
		const contents = fs.readFileSync(filePath);
		if (markers.some((marker) => contents.includes(marker))) {
			fs.unlinkSync(filePath);
			removedFiles.add(path.relative(buildDir, filePath).replaceAll(path.sep, '/'));
		}
	});

staticFiles
	.filter(
		(filePath) =>
			filePath.endsWith('.js') && removedFiles.has(path.relative(buildDir, filePath).replaceAll(path.sep, '/')),
	)
	.map((filePath) => `${filePath}.map`)
	.filter((filePath) => fs.existsSync(filePath))
	.forEach((filePath) => {
		fs.unlinkSync(filePath);
		removedFiles.add(path.relative(buildDir, filePath).replaceAll(path.sep, '/'));
	});

staticFiles
	.filter((filePath) => filePath.endsWith('.map') && fs.existsSync(filePath))
	.forEach((filePath) => {
		const sourceMap = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		let changed = false;

		if (Array.isArray(sourceMap.sourcesContent)) {
			sourceMap.sourcesContent = sourceMap.sourcesContent.map((sourceContent) => {
				if (typeof sourceContent === 'string' && markers.some((marker) => sourceContent.includes(marker))) {
					changed = true;
					return '';
				}
				return sourceContent;
			});
		}

		if (changed) {
			fs.writeFileSync(filePath, `${JSON.stringify(sourceMap)}\n`);
			sanitizedSourceMaps.push(path.relative(buildDir, filePath).replaceAll(path.sep, '/'));
		}
	});

const manifestPath = path.join(buildDir, 'asset-manifest.json');
if (fs.existsSync(manifestPath)) {
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
	const isRemovedAsset = (value) => typeof value === 'string' && removedFiles.has(value);

	manifest.files = Object.fromEntries(
		Object.entries(manifest.files ?? {}).filter(([, value]) => !isRemovedAsset(value)),
	);
	manifest.entrypoints = (manifest.entrypoints ?? []).filter((value) => !isRemovedAsset(value));
	fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

// eslint-disable-next-line no-console
console.log(
	removedFiles.size || sanitizedSourceMaps.length
		? [
				removedFiles.size ? `Removed development-only goal assets:\n${[...removedFiles].join('\n')}` : null,
				sanitizedSourceMaps.length
					? `Sanitized fixture source content from source maps:\n${sanitizedSourceMaps.join('\n')}`
					: null,
			]
				.filter(Boolean)
				.join('\n')
		: 'No development-only goal fixture assets found in the production build.',
);
