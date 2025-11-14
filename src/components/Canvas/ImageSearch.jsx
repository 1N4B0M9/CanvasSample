import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Transformer } from 'react-konva';

const UNSPLASH_ACCESS_KEY = 'Iq-QrfOSfMi3CCClwVFJ83rXo8bHj_IT0ppEFum7cow';

// Helper function to add UTM parameters to Unsplash URLs
const addUnsplashUTM = (url) => {
	if (!url) return url;
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}utm_source=strive-revamp&utm_medium=referral`;
};

const ImageSearch = ({ addImage }) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);
	const [images, setImages] = useState([]);
	const [selectedImageId, setSelectedImageId] = useState(null);
	const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

	const stageRef = useRef(null);
	const transformerRef = useRef(null);
	const layerRef = useRef(null);

	// Set canvas size dynamically
	useEffect(() => {
		const updateCanvasSize = () => {
			setCanvasSize({
				width: window.innerWidth - 256,
				height: window.innerHeight,
			});
		};
		updateCanvasSize();
		window.addEventListener('resize', updateCanvasSize);
		return () => window.removeEventListener('resize', updateCanvasSize);
	}, []);

	// Fetch images from Unsplash
	const searchImages = async (query, pageNum = 1) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch(
				`https://api.unsplash.com/search/photos?query=${query}&page=${pageNum}&per_page=20`,
				{
					headers: {
						Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
					},
				}
			);

			if (!response.ok) throw new Error('Failed to fetch images');

			const data = await response.json();
			const formattedResults = data.results.map((item) => ({
				id: item.id,
				url: item.urls.regular,
				downloadLink: item.links.download_location,
				title: item.description || item.alt_description || 'Untitled',
				thumbnail: item.urls.thumb,
				photographer: item.user.name,
				photographerUrl: item.user.links.html,
			}));

			setSearchResults((prev) => (pageNum === 1 ? formattedResults : [...prev, ...formattedResults]));
			setPage(pageNum);
		} catch (err) {
			setError('Error fetching images. Please try again.');
			console.error('Search error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const loadMore = () => {
		if (searchTerm && !isLoading) searchImages(searchTerm, page + 1);
	};





	return (
		<div className="flex">
			{/* Sidebar for Image Search */}
			<div className="w-64 h-screen text-white p-4 overflow-y-auto">
				<h2 className="text-lg font-bold mb-4">Image Search</h2>

				<div className=" flex flex-col items-center selection:space-x-2">
					<input
						type="text"
						placeholder="Search images..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyPress={(e) => e.key === 'Enter' && searchImages(searchTerm)}
						className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 focus:outline-none mb-2"
					/>
					<button onClick={() => searchImages(searchTerm)} disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded w-full">
						Search
					</button>
				</div>

				{error && <div className="text-red-500 mt-2">{error}</div>}

				<div className="mt-4 space-y-2">
					{searchResults.map((result) => (
						<div key={result.id} className="border border-gray-600 p-2 rounded cursor-pointer">
							<img
								src={result.thumbnail}
								alt={result.title}
								className="w-full h-20 object-cover rounded"
								onClick={() => addImage(result, UNSPLASH_ACCESS_KEY)}
							/>
							<div className="text-xs text-gray-300">
								Photo by{' '}
								<a href={addUnsplashUTM(result.photographerUrl)} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
									{result.photographer}
								</a>{' '}
								on{' '}
								<a href={addUnsplashUTM('https://unsplash.com')} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
									Unsplash
								</a>
							</div>
						</div>
					))}
					{searchResults.length > 0 && (
						<button onClick={loadMore} disabled={isLoading} className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded">
							{isLoading ? 'Loading...' : 'Load More'}
						</button>
					)}
				</div>
			</div>


		</div>
	);
}

export default ImageSearch;