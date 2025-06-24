/**
 * Updated ImageSearch Component - Enhanced for Background Images
 *
 * This component now supports both regular image elements and background images
 * with appropriate UI adjustments for each mode.
 */

import React, { useState } from 'react';

// Unsplash API access key - replace with your own from https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = 'Iq-QrfOSfMi3CCClwVFJ83rXo8bHj_IT0ppEFum7cow';

const ImageSearch = ({ addImage, isBackgroundMode = false, title = 'Image Search' }) => {
	// Component state
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [page, setPage] = useState(1);

	/**
	 * Search for images on Unsplash with the given query
	 *
	 * @param {string} query - The search term
	 * @param {number} pageNum - The page number for pagination
	 */
	const searchImages = async (query, pageNum = 1) => {
		if (!query.trim()) return;

		setIsLoading(true);
		setError(null);

		try {
			// Add orientation filter for background images
			const orientation = isBackgroundMode ? '&orientation=landscape' : '';
			const response = await fetch(
				`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${pageNum}&per_page=20${orientation}`,
				{
					headers: {
						Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();

			const formattedResults = data.results.map((item) => ({
				id: item.id,
				url: item.urls.regular, // The main image URL
				thumbnailUrl: item.urls.thumb, // The thumbnail URL
				title: item.description || item.alt_description || 'Untitled image',
				downloadLink: item.links.download_location,
				photographer: item.user.name,
				photographerUrl: item.user.links.html,
			}));

			// Replace results on first page, append on subsequent pages
			setSearchResults((prev) => (pageNum === 1 ? formattedResults : [...prev, ...formattedResults]));

			setPage(pageNum);
		} catch (err) {
			console.error('Error searching images:', err);
			setError('Failed to load images. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Handle search form submission
	 *
	 * @param {Event} e - The form submit event
	 */
	const handleSubmit = (e) => {
		e.preventDefault();
		if (searchTerm.trim()) {
			searchImages(searchTerm);
		}
	};

	/**
	 * Load more results (next page)
	 */
	const loadMore = () => {
		if (searchTerm && !isLoading) {
			searchImages(searchTerm, page + 1);
		}
	};

	/**
	 * Handle image selection and add to canvas
	 *
	 * @param {Object} image - The selected image data
	 */
	const handleImageSelect = (image) => {
		console.log('Selected image:', image);

		// Record download with Unsplash API (required by Unsplash API guidelines)
		fetch(image.downloadLink, {
			headers: {
				Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
			},
		}).catch((err) => console.error('Error recording download:', err));

		// Add image to canvas or set as background
		addImage(
			{
				url: image.url,
				title: image.title,
				description: image.title,
				photographer: image.photographer,
				photographerUrl: image.photographerUrl,
				downloadLink: image.downloadLink,
			},
			UNSPLASH_ACCESS_KEY,
		);
	};

	// Get placeholder text based on mode
	const getPlaceholderText = () => {
		if (isBackgroundMode) {
			return 'Search background images...';
		}
		return 'Search for images...';
	};

	// Get suggested searches based on mode
	const getSuggestedSearches = () => {
		if (isBackgroundMode) {
			return ['nature', 'mountains', 'ocean', 'sunset', 'forest', 'sky', 'desert', 'cityscape'];
		}
		return ['success', 'goals', 'motivation', 'dreams', 'inspiration', 'achievement', 'happiness', 'growth'];
	};

	return (
		<div className="mt-4">
			<h3 className="text-lg font-semibold mb-2">{title}</h3>

			{/* Quick search suggestions */}
			<div className="mb-3">
				<div className="text-sm text-gray-400 mb-2">Popular searches:</div>
				<div className="flex flex-wrap gap-1">
					{getSuggestedSearches()
						.slice(0, 4)
						.map((suggestion) => (
							<button
								key={suggestion}
								onClick={() => {
									setSearchTerm(suggestion);
									searchImages(suggestion);
								}}
								className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs rounded transition-colors"
							>
								{suggestion}
							</button>
						))}
				</div>
			</div>

			{/* Search form */}
			<form onSubmit={handleSubmit} className="mb-4">
				<div className="flex flex-col space-y-2">
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder={getPlaceholderText()}
						className="p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						disabled={isLoading || !searchTerm.trim()}
						className={`p-2 rounded flex items-center justify-center ${
							isLoading || !searchTerm.trim() ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
						} text-white`}
					>
						{isLoading ? (
							<>
								<svg
									className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									/>
								</svg>
								Searching...
							</>
						) : (
							<>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 mr-2"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
								Search
							</>
						)}
					</button>
				</div>
			</form>

			{/* Error message */}
			{error && <div className="mb-4 p-2 bg-red-500 bg-opacity-30 text-red-100 rounded">{error}</div>}

			{/* Search results */}
			<div className="overflow-y-auto max-h-96 space-y-3">
				{searchResults.length > 0 ? (
					<>
						{searchResults.map((image) => (
							<div key={image.id} className="p-2 border border-gray-600 rounded hover:bg-gray-700 transition-colors">
								<div className="relative group">
									<img
										src={image.thumbnailUrl}
										alt={image.title}
										className="w-full h-24 object-cover rounded cursor-pointer"
										onClick={() => handleImageSelect(image)}
									/>

									{/* Image selection overlay */}
									<div
										className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity cursor-pointer rounded"
										onClick={() => handleImageSelect(image)}
									>
										<div className="opacity-0 group-hover:opacity-100 transition-opacity">
											<div className="bg-white text-gray-800 px-3 py-1 rounded font-medium">
												{isBackgroundMode ? 'Set Background' : 'Add to Canvas'}
											</div>
										</div>
									</div>
								</div>

								{/* Attribution */}
								<div className="mt-1 text-xs text-gray-300">
									Photo by{' '}
									<a
										href={image.photographerUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-400 hover:underline"
										onClick={(e) => e.stopPropagation()}
									>
										{image.photographer}
									</a>{' '}
									on{' '}
									<a
										href="https://unsplash.com"
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-400 hover:underline"
										onClick={(e) => e.stopPropagation()}
									>
										Unsplash
									</a>
								</div>
							</div>
						))}

						{/* Load more button */}
						{searchResults.length > 0 && (
							<button
								onClick={loadMore}
								disabled={isLoading}
								className={`w-full p-2 rounded ${
									isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'
								} text-white text-center flex items-center justify-center`}
							>
								{isLoading ? (
									<>
										<svg
											className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										Loading...
									</>
								) : (
									'Load More'
								)}
							</button>
						)}
					</>
				) : searchTerm.trim() && !isLoading ? (
					<div className="text-gray-300 text-center py-4">No images found. Try a different search term.</div>
				) : null}
			</div>
		</div>
	);
};

export default ImageSearch;
