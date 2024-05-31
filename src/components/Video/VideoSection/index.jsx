import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player/youtube';
import { Box } from '@mui/material';
import Popup from '../Popup/Popup';

import { Colors } from '../../../constants/Colors';
import './youtubeVideoSection.css';
import '../../../Layouts/Main/AddVideo/youtubeVideo.css';

export default function YouTubeVideoSection({ videoValue, subtopicValue, tags, appliedFilterTags }) {
	// this is just a parameter to hide videos without a subtopic during testing
	const showSubtopicUndefinedVideos = true;

	const [videos, setVideos] = useState(videoValue || []);
	const [playerRefs, setPlayerRefs] = useState([]);
	const [popup, setPopup] = useState(null);

	useEffect(() => {
		// Combined filter operation
		const filteredVideos = videoValue.filter((video) => {
			// Filter by content type
			const contentTypeMatch = appliedFilterTags.includes(video.category);

			// Filter by operating system
			const osMatch =
				video.operating_system.includes('All') ||
				appliedFilterTags.includes(video.operating_system) ||
				(Array.isArray(video.operating_system) && video.operating_system.some((os) => appliedFilterTags.includes(os)));

			// Filter by subtopic
			const subtopicMatch =
				(showSubtopicUndefinedVideos && !video.subtopic) ||
				(video.subtopic && (subtopicValue.length === 0 || subtopicValue === video.subtopic));

			// Filter by tags
			const tagsMatch =
				tags.length === 0 || (Array.isArray(video.tags) && video.tags.some((tag) => tags.includes(tag)));

			return contentTypeMatch && osMatch && subtopicMatch && tagsMatch;
		});

		setPlayerRefs(filteredVideos.map((_) => React.createRef()));
		setVideos(filteredVideos);
	}, [tags, videoValue, subtopicValue, appliedFilterTags]);

	const handleProgress = (progress, video, playerRef) => {
		const currentTime = Math.floor(progress.playedSeconds);
		if (video.stopTimes && video.stopTimes.includes(currentTime)) {
			const playerState = playerRef.current.getInternalPlayer().getPlayerState();
			if (playerState === 1) {
				playerRef.current.getInternalPlayer().pauseVideo();
				if (document.fullscreenElement) {
					document.exitFullscreen();
				}
				const currentTimeIndex = video.stopTimes.indexOf(currentTime);
				const text = currentTimeIndex !== -1 ? video.messages[currentTimeIndex] : '';

				let prevSegmentTime = 0; // Default to null if there's no previous segment
				if (currentTimeIndex > 0 && video.stopTimes[currentTimeIndex - 1]) {
					prevSegmentTime = video.stopTimes[currentTimeIndex - 1];
				}
				setPopup({
					text,
					prevSegmentTime,
					visible: true,
					playerRef,
				});
			}
		}
	};

	if (videos && videos.length > 0) {
		return (
			<div className="h-full w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-screen-xl">
				{videos.map((video, index) => (
					<div key={video.key} className="h-72 w-full">
						<ReactPlayer
							key={video.key}
							ref={playerRefs[index]}
							className="react-player"
							url={video.url}
							width="100%"
							height="100%"
							onProgress={(progress) => handleProgress(progress, video, playerRefs[index])}
							config={{
								youtube: {
									playerVars: {
										controls: 1,
										showinfo: 1,
									},
								},
							}}
						/>
					</div>
				))}
				,
				{popup && popup.visible && (
					<Popup
						text={popup.text}
						handleResume={() => {
							popup.visible = false;
							setTimeout(() => setPopup(popup.visible), 1000); // prevents repeated popup
							popup.playerRef.current.getInternalPlayer().playVideo();
						}}
						handleRestart={() => {
							popup.visible = false;
							popup.playerRef.current.getInternalPlayer().seekTo(0);
							popup.playerRef.current.getInternalPlayer().playVideo();
						}}
						handleRestartFrom={() => {
							popup.visible = false;
							setTimeout(() => setPopup(popup.visible), 1000); // prevents repeated popup & prev segment popup
							popup.playerRef.current.getInternalPlayer().seekTo(popup.prevSegmentTime);
							popup.playerRef.current.getInternalPlayer().playVideo();
						}}
					/>
				)}
			</div>
		);
	}

	return (
		<Box
			sx={{
				fontFamily: 'Inria Sans',
				color: Colors.primaryColor,
				textAlign: 'center',
				fontWeight: '700',
				padding: '2rem',
				fontSize: {
					md: '2rem',
					sm: '2.25rem',
					xs: '1.25rem',
				},
				marginBottom: '10%',
			}}
		>
			No results found
		</Box>
	);
}

YouTubeVideoSection.propTypes = {
	videoValue: PropTypes.arrayOf(PropTypes.Obj).isRequired,
	subtopicValue: PropTypes.string.isRequired,
	tags: PropTypes.arrayOf(PropTypes.string).isRequired,
	appliedFilterTags: PropTypes.arrayOf(PropTypes.string).isRequired,
};
