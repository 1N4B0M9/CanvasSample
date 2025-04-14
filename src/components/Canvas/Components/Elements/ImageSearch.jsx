/**
 * ImageSearch Component - Fixed for proper image integration
 *
 * This component provides an interface for searching and selecting images from Unsplash
 * to add to the canvas, with fixes to ensure images display correctly.
 *
 * Path: src/Components/Elements/ImageSearch.jsx
 */

import React, { useState } from 'react';

// Unsplash API access key - replace with your own from https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = 'Iq-QrfOSfMi3CCClwVFJ83rXo8bHj_IT0ppEFum7cow';

const ImageSearch = ({ addImage }) => {
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
			const response = await fetch(
				`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${pageNum}&per_page=20`,
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
				thumbnailUrl: item.urls.thumb, // The thumbnail URL (separate from the main URL)
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
		console.log('Selected image:', image); // Debug log

		// Record download with Unsplash API (required by Unsplash API guidelines)
		fetch(image.downloadLink, {
			headers: {
				Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
			},
		}).catch((err) => console.error('Error recording download:', err));

		// Add image to canvas with complete data - pass API key for proper attribution
		addImage(
			{
				url: image.url, // Make sure this URL is correct
				title: image.title,
				description: image.title, // Use title as description if needed
				photographer: image.photographer,
				photographerUrl: image.photographerUrl,
				downloadLink: image.downloadLink,
			},
			UNSPLASH_ACCESS_KEY,
		);
	};

	return (
		<div className="mt-4">
			<h3 className="text-lg font-semibold mb-2">Image Search</h3>

			{/* Search form */}
			<form onSubmit={handleSubmit} className="mb-4">
				<div className="flex flex-col space-y-2">
					<input
						type="text"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						placeholder="Search for images..."
						className="p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						disabled={isLoading || !searchTerm.trim()}
						className={`p-2 rounded ${
							isLoading || !searchTerm.trim() ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
						} text-white`}
					>
						{isLoading ? 'Searching...' : 'Search'}
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
								<div className="relative">
									<img
										src={image.thumbnailUrl}
										alt={image.title}
										className="w-full h-24 object-cover rounded cursor-pointer"
										onClick={() => handleImageSelect(image)}
									/>

									{/* Image selection overlay */}
									<div
										className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity cursor-pointer"
										onClick={() => handleImageSelect(image)}
									>
										<span className="text-white opacity-0 hover:opacity-100">Select</span>
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
						<button
							onClick={loadMore}
							disabled={isLoading}
							className={`w-full p-2 rounded ${
								isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'
							} text-white text-center`}
						>
							{isLoading ? 'Loading...' : 'Load More'}
						</button>
					</>
				) : searchTerm.trim() && !isLoading ? (
					<div className="text-gray-300 text-center py-4">No images found. Try a different search term.</div>
				) : null}
			</div>
		</div>
	);
};

export default ImageSearch;
