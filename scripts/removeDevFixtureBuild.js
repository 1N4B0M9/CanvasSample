const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, '..', 'build');
const markers = ['dev-fixture-find-work', 'Example Organization', 'Development: load example plan'];
const removedFiles = new Set();

function collectFiles(directory) {
	if (!fs.existsSync(directory)) return [];

	return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = path.join(directory, entry.name);
		return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
	});
}

collectFiles(path.join(buildDir, 'static')).forEach((filePath) => {
	const contents = fs.readFileSync(filePath);
	if (markers.some((marker) => contents.includes(marker))) {
		fs.unlinkSync(filePath);
		removedFiles.add(path.relative(buildDir, filePath).replaceAll(path.sep, '/'));
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
	removedFiles.size
		? `Removed development-only goal fixture assets:\n${[...removedFiles].join('\n')}`
		: 'No development-only goal fixture assets found in the production build.',
);
