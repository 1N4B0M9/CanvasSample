import React, { useState, useEffect, useRef } from 'react'; 
import { addVideoData } from '../../../../firebase/firebaseReadWrite';
import {
	Box,
	Grid,
	FormControl,
	FormControlLabel,
	Checkbox,
	InputLabel,
	Select,
	MenuItem,
	TextField,
	Button,
	Divider,
} from '@mui/material';
import { TagsInput } from 'react-tag-input-component';
import './styles.css';
import Swal from 'sweetalert2';
import ReactPlayer from 'react-player/youtube';
import { inputStyle, multiLineInputStyle } from '../../ResumeBuilder/styles.js';
import { Colors } from '../../../../constants/Colors';

function YouTubeVideo() {
	// Database Values
	const [url, setUrl] = useState('');
	const [tags, setTags] = useState([]);
	const [operatingSystem, setOs] = useState('');
	const [category, setCategory] = useState('');
	const [messages, setMessage] = useState([
		{
			messages: '',
		},
	]);
	const [stopTimes, setStopTimes] = useState([
		{
			stopTimes: '',
		},
	]);

	// React-Player
	const playerRef = useRef(null);

	// Video Chapter Segmentation
	const [isChapterSegAvailable, setIsChapterSegAvailable] = useState(false);
	const [isChapterSegChecked, setIsChapterSegChecked] = useState(false);
	const handleChaperCheckboxChange = () => {
		setIsChapterSegChecked(!isChapterSegChecked);
	};

	// It's simpler to fetch all the chapters when we check if they are available
	const [chapterMessages, setChapterMessage] = useState([
		{
			messages: '',
		},
	]);
	const [chapterStopTimes, setChapterStopTimes] = useState([
		{
			stopTimes: '',
		},
	]);

	// whenever there is a new URL, fetch the chapters if it's a valid URL
	useEffect(() => {
		const fetchChapters = async () => {
		try {
			// check if the url is a valid youtube video and get the video id for the api
			const videoIdRegex =
			/(?:(?:https?:\/\/)?(?:www\.)?)?youtu(?:\.be\/|be.com\/(?:watch\?(?:.*&)?v=|(?:embed|v)\/))([\w'-]+)/i;
			const match = url.match(videoIdRegex);
			if (!match || !match[1]) {
				setUrl('');
				Swal.fire({
					width: '30rem',
					height: '20rem',
					icon: 'error',
					title: 'Oops...',
					text: '"Please enter a valid YouTube video URL."',
				});
			}

			// fetch the data from the youtube api
			const response = await fetch(
				`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${(match[1])}&key=${
					process.env.REACT_APP_YOUTUBE_API_KEY
				}`,
			);

			// parse the data for the chapters
			const data = await response.json();
			const video = data.items[0];

			const desc = video.snippet.description;
			const lines = desc.split('\n');
			const filteredLines = lines.filter((line) => /^\s*\d+:\d+/.test(line));

			// if there are chapter then setIsChapterSegAvailable true which will unhide the checkbox
			if (filteredLines.length > 0) {
				setIsChapterSegAvailable(true);

				const updatedStopTimes = filteredLines.map((line) => convertToSeconds(line.split(' ')[0]));
				updatedStopTimes.shift();
				const updatedMessages = filteredLines.map(() => 'Are you following along so far?');

				setChapterStopTimes(updatedStopTimes);
				setChapterMessage(updatedMessages);
			} else {
				setIsChapterSegAvailable(false);
			}
		} catch (error) {
			console.log(error);
			alert(error);
		}
	};
	if (url) {
		setIsChapterSegChecked(false);
		fetchChapters();
	}
	}, [url]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Form validation check
		const isValid = validateInputFields();

		if (!isValid) {
			return;
		}

		if (isChapterSegChecked) {
			e.preventDefault();
				try {
					await addVideoData('youtube-videos', {
						url,
						tags,
						operating_system: operatingSystem,
						category,
						stopTimes: chapterStopTimes,
						messages: chapterMessages,
					});

					setUrl('');
					setTags([]);
					setOs('');
					setCategory('');
					setStopTimes([{ stopTimes: '' }]);
					setMessage([{ message: '' }]);
					// set checked to false
					setIsChapterSegChecked(false);
					setIsChapterSegAvailable(false);

					Swal.fire({
						width: '30rem',
						// height: '10rem',
						text: 'Video added successfully!',
						icon: 'success',
					});
				} catch (error) {
				console.log('Error adding video:', error);
				alert(error);
			}
		} else {
			const isValid2 = validateInputFields2();

			if (!isValid2) {
				return;
			}

			sortStopTimes();


			e.preventDefault();

			// eslint-disable-next-line
			const urlRegex = /^(https?:\/\/)/i;

			try {
				await addVideoData('youtube-videos', {
					url,
					tags,
					operating_system: operatingSystem,
					category,
					stopTimes,
					messages,
				});

				setUrl('');
				setTags([]);
				setOs('');
				setCategory('');
				setStopTimes([{ stopTimes: '' }]);
				setMessage([{ message: '' }]);

				setIsChapterSegChecked(false);
				setIsChapterSegAvailable(false);

				const textField = document.getElementById(`stopTimeTextField_0`);
				if (textField) {
					textField.value = '';
				}
				const textField2 = document.getElementById(`confirmationTextField_0`);
				if (textField2) {
					textField2.value = '';
				}

				Swal.fire({
					width: '30rem',
					// height: '10rem',
					text: 'Video added successfully!',
					icon: 'success',
				});
			} catch (e) {
				console.log('Error adding video:', e);
			}
		}
	};

	const sortStopTimes= () => {
		// console.log("before stopTimes: " + stopTimes + "\nmessages: " + messages);
		for (let i = 0; i < messages.length - 1; i++) {
			for (let j = i + 1; j < messages.length; j++) {
				if (stopTimes[i] > stopTimes[j]) {
					// Swap elements if they are in the wrong order
					const temp = stopTimes[i];
					stopTimes[i] = stopTimes[j];
					stopTimes[j] = temp;
					const temp2 = messages[i];
					messages[i] = messages[j];
					messages[j] = temp2;
				}
			}
		}
		setStopTimes(stopTimes);
		setMessage(messages);
		// console.log("after stopTimes: " + stopTimes + "\nmessages: " + messages);
	}

	// added for tags validation
	const [tagInputValue, setTagInputValue] = useState('');
	const handleTagsKeyPress = (e) => {
		if (e.key !== 'Enter') {
			setTagInputValue(e.target.value);
		}
	};

	// Validate the necessary input fields.
	const validateInputFields = () => {
		// check youtube url field
		if (url === '') {
			Swal.fire({
				width: '30rem',
				title: 'Oops...',
				text: 'Please enter a Youtube video URL.',
				icon: 'error',
			});
			return false;
		}

		// check tags field
		const lastTag = tags[tags.length - 1];
		if (!(tags.length === 0 && tagInputValue === '')) {
			if ((!(tagInputValue === lastTag) && tagInputValue !== '') || tags.length === 0) {
				Swal.fire({
					width: '30rem',
					title: 'Oops...',
					text: 'Please press enter or delete your current tag.',
					icon: 'error',
				});
				return false;
			}
		}

		// check operating system
		if (operatingSystem === '') {
			Swal.fire({
				width: '30rem',
				title: 'Oops...',
				text: 'Please select an Operating System.',
				icon: 'error',
			});
			return false;
		}

		// check category
		if (category === '') {
			Swal.fire({
				width: '30rem',
				title: 'Oops...',
				text: 'Please select a video category.',
				icon: 'error',
			});
			return false;
		}

		return true;
	};

	const validateInputFields2 = () => {
		// Checks if a string is empty or contains only whitespace
		const isEmptyOrSpaces = (str) => {
			if (typeof str !== 'string') return true;
			return !str || str.trim() === '';
		};

		// Check if any confirmation message is empty or only contains whitespace

		const hasEmptyMessage = messages.some((msg) => isEmptyOrSpaces(msg));

		// console.log('messages size: ' + messages.length);
		// console.log('first message' + messages[0]);
		// console.log('has empty message?' + messages.some((msg) => isEmptyOrSpaces(msg)));

		if (hasEmptyMessage) {
			Swal.fire({
				icon: 'error',
				title: 'Oops...',
				text: 'Please ensure all confirmation messages are filled out.',
			});
			return false;
		}

		for (let i = 0; i < messages.length; i++) {
			const textField = document.getElementById(`stopTimeTextField_${i}`);
			if (textField) {
				const regex = /^[0-5]?[0-9]:[0-5][0-9]$/; // validate MM:SS or M:SSformat
				const temp = regex.test(textField.value);

				if (!temp) {
					Swal.fire({
						icon: 'error',
						title: 'Oops...',
						text: 'Please ensure all stop times are in a valid MM:SS format.',
					});
					return false;
				}
				// check that the min and seconds inputted are less than the max
				// console.log('stopTimes[' + i + ']: ' + stopTimes[i] + '\nduration: ' + duration);
				if (stopTimes[i] > playerRef.current.getDuration()) {
					Swal.fire({
						icon: 'error',
						title: 'Oops...',
						text: 'Please ensure all stop times are below the video length.',
					});
					return false;
				}
			}
		}
		return true;
	};

	const handleClickTime = (index) => {
		if (playerRef.current) {
			const currentTime = playerRef.current.getDuration();
			const formattedTime = `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, '0')}`;
			const reverseIndex = messages.length - index - 1;
			stopTimes[reverseIndex] = convertToSeconds(formattedTime);

			const textField = document.getElementById(`stopTimeTextField_${reverseIndex}`);
			if (textField) {
				textField.value = formattedTime;
			}
		}
	};

	const onAddBtnClick = () => {
		const newField = {
			messages: '',
			stopTimes: '',
		};
		// You have to be specific of which field of newField to solve the previous commenting messages issue.
		setMessage([...messages, newField.messages]);
		setStopTimes([...stopTimes, newField.stopTimes]);
	};

	const remove = (index) => {
		const messagedata = [...messages];
		messagedata.splice(index, 1);
		setMessage(messagedata);
		const stopdata = [...stopTimes];
		stopdata.splice(index, 1);
		setStopTimes(stopdata);

		for (let i = 0; i < messagedata.length; i++) {
			let textField = document.getElementById(`stopTimeTextField_${i}`);
			if (textField) {
				textField.value = `${Math.floor(stopdata[i] / 60)}:${String(stopdata[i] % 60).padStart(2, '0')}`;
			}
			textField = document.getElementById(`confirmationTextField_${i}`);
			if (textField) {
				textField.value = messagedata[i];
			}
		}
	};

	const convertToSeconds = (time) => {
		const [minutes, seconds] = time.split(':').map((num) => parseInt(num));
		return minutes * 60 + seconds;
	};

	const handleChange = (index, event) => {
		const stopTime = [...stopTimes];
		const message = [...messages];
		if (event.target.name === 'stopTimes') {
			stopTime[index] = convertToSeconds(event.target.value);
			// ("stopTime is: " + stopTime + "\nIndex is: " + index);
		} else if (event.target.name === 'messages') {
			message[index] = event.target.value;
			// alert("message is: " + message + "\nIndex is: " + index);
		}
		setStopTimes(stopTime);
		setMessage(message);
	};

	const messageInput = messages.map((input, index) => (
		<Box key={messages.length - index - 1}>
			<Grid
				container
				spacing={2}
				sx={{
					margin: 'auto',
					width: '97%',
					paddingRight: '0.5rem',
					marginTop: '1rem',
				}}
			>
				<Grid item md={6} sm={6} xs={12} order={{ xs: 1 }}>
					<Box
						sx={{
							width: '97%',
							margin: 'auto',
							color: Colors.primaryColor,
							fontWeight: '700',
						}}
					>
						Segment #{messages.length - index}
					</Box>
				</Grid>

				<Grid item md={6} sm={6} xs={12} order={{ xs: 1 }}>
					<Box
						sx={{
							color: Colors.primaryColor,
							fontSize: { sm: '1rem', xs: '0.8rem' },
							textAlign: 'right',
							paddingRight: '1rem',
							cursor: 'pointer',
						}}
						onClick={() => {
							remove(messages.length - index - 1);
						}}
					>
						- Remove Segment
					</Box>
				</Grid>
			</Grid>

			<Grid
				key={messages.length - index - 1}
				id={`experience-form-${messages.length - index - 1}`}
				container
				spacing={2}
				sx={{ margin: 'auto', width: '97%', paddingRight: '0.5rem' }}
			>
				<Grid container spacing={2} sx={{ margin: 'auto', width: '97%', paddingRight: '0.5rem' }}>
					<Grid item>
						<Box
							sx={{
								marginTop: '1.2rem',
								color: Colors.primaryColor,
								fontSize: '1rem',
								fontFamily: 'Inria Sans',
								fontWeight: '700',
								marginLeft: '0.5rem',
							}}
						>
							Stop Times:
						</Box>
					</Grid>
					<Grid item md={8} sm={6} xs={12}>
						<Box
							component="form"
							sx={{
								'& > :not(style)': { width: '100%' },
							}}
							autoComplete="off"
						>
							<TextField
								value={input.stopTime}
								// borderRadius=".375rem"
								sx={inputStyle}
								variant="filled"
								placeholder="Specify pause times for video in format min:sec, e.g. 0:30"
								focused
								onChange={(e) => {
									handleChange(messages.length - index - 1, e);
								}}
								name="stopTimes"
								InputProps={{
									id: `stopTimeTextField_${messages.length - index - 1}`,
									disableUnderline: true,
								}}
							/>
						</Box>
					</Grid>
					<Grid item md={2} sm={3} xs={12}>
						<button
							onClick={(e) => handleClickTime(index, e)}
							style={{
								width: '100%',
								height: '100%',
								fontSize: '16px',
								backgroundColor: Colors.primaryColor, 
								color: '#fff',
								cursor: 'pointer',
								fontWeight: 'bold', 
							}}
						>
							Get Timestamp
						</button>
					</Grid>
				</Grid>

				{/* Description row */}
				<Grid item xs={12}>
					<Grid item xs={12}>
						<Grid item>
							<Box
								sx={{
									marginTop: '1.2rem',
									color: Colors.primaryColor,
									fontSize: '1.1rem',
									fontFamily: 'Inria Sans',
									fontWeight: '700',
									marginLeft: '0.5rem',
									marginBottom: '0.5rem',
								}}
							>
								Confirmation Message:
							</Box>
						</Grid>
						<Box
							component="form"
							sx={{
								'& > :not(style)': { width: '100%' },
							}}
							autoComplete="off"
						>
							<TextField
								sx={multiLineInputStyle}
								variant="standard"
								multiline
								value={input.messages}
								name="messages"
								InputProps={{
									id: `confirmationTextField_${messages.length - index - 1}`,
									disableUnderline: true,
								}}
								onChange={(e) => {
									handleChange(messages.length - index - 1, e);
								}}
								rows={5}
							/>
						</Box>
					</Grid>
				</Grid>
			</Grid>
		</Box>
	));

	return (
		<>
			<Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						marginTop: '2rem',
						'@media screen and (min-width: 1444px)': {
							position: 'fixed',
							top: '50%',
							right: '0%',
							transform: 'translateY(-50%)',
							zIndex: 1000, // makes video float. may need to change so it is different with different resolutions
							boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
						},
					}}
				>
					<ReactPlayer
							ref={playerRef}
							className='react-player'
							url = {url}
							// width='100%'
							// height='100%'
							config={{
								youtube: {
									playerVars: {         
										controls: 1,
										showinfo: 1
									}
								}
							}}
					/>
				</Box>
				<Box
					sx={{
						backgroundColor: Colors.backgroundColor,
						height: 'auto',
						borderRadius: '1rem',
						boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
						margin: 'auto',
						marginTop: '2rem',
						paddingBottom: '2rem',
						width: '90%',
						'@media screen and (min-width: 1444px)': {
							display: 'flex',
							flexDirection: 'column', 
							justifyContent: 'flex-start', 
							alignItems: 'flex-start', 
							marginTop: '2rem',
							marginLeft: '2rem', 
							width: '53%', 
						},
					}}
				>
					<Grid container spacing={2} sx={{ margin: 'auto', width: '97%', paddingRight: '0.5rem' }}>
						<Grid item xs={1.6}>
							<Box
								sx={{
									marginTop: '1.2rem',
									color: Colors.primaryColor,
									fontSize: '1rem',
									fontFamily: 'Inria Sans',
									fontWeight: '700',
									marginLeft: '0.5rem',
								}}
							>
								Youtube Link:
							</Box>
						</Grid>
						<Grid item md={10} sm={10} xs={12}>
							<Box
								component="form"
								sx={{
									'& > :not(style)': { width: '100%', paddingBottom: '1rem' },
								}}
								autoComplete="off"
							>
								<TextField
									sx={inputStyle}
									variant="filled"
									value={url}
									placeholder="Input Youtube Video Url"
									InputProps={{
										disableUnderline: true,
									}}
									// onChange={handleUrlChange}
									onChange={(e) => setUrl(e.target.value)}
									focused
								/>
							</Box>
						</Grid>
					</Grid>
					<Grid container spacing={2} sx={{ margin: 'auto', width: '97%', paddingRight: '0.5rem' }}>
						<Grid item xs={1.6}>
							<Box
								sx={{
									marginTop: '1.2rem',
									color: Colors.primaryColor,
									fontSize: '1rem',
									fontFamily: 'Inria Sans',
									fontWeight: '700',
									marginLeft: '0.5rem',
								}}
							>
								Tags:
							</Box>
						</Grid>

						<Grid item md={10} sm={10} xs={12}>
							<Box
								component="form"
								sx={{
									'& > :not(style)': { width: 'auto', padding: '1rem' },
								}}
								autoComplete="off"
							>
								<TagsInput
									InputProps={{
										disableUnderline: true,
									}}
									type="text"
									variant="standard"
									id="search"
									value={tags}
									separators={['Enter']}
									onChange={setTags}
									placeHolder="To add tags, input the desired word and press Enter"
									onKeyUp={handleTagsKeyPress}
								/>
							</Box>
						</Grid>
					</Grid>
					<Grid container spacing={2} sx={{ margin: 'auto', width: '97%', paddingRight: '0.5rem' }}>
						<Grid item xs={1.6}>
							<Box
								sx={{
									marginTop: '2rem',
									color: Colors.primaryColor,
									fontSize: '1rem',
									fontFamily: 'Inria Sans',
									fontWeight: '700',
									marginLeft: '0.5rem',
								}}
							>
								Operating System:
							</Box>
						</Grid>
						<Grid item md={10} sm={10} xs={12}>
							<Box
								component="form"
								sx={{
									'& > :not(style)': { width: '100%' },
								}}
								autoComplete="off"
							>
								<FormControl fullWidth sx={{ marginTop: '1rem' }}>
									<InputLabel id="demo-simple-select-label">What kind of device is this for?</InputLabel>
									<Select
										labelId="demo-simple-select-label"
										id="demo-simple-select"
										label=" What kind of device is this for?"
										onChange={(e) => setOs(e.target.value)}
										value={operatingSystem}
									>
										<MenuItem disabled>Mobile Devices</MenuItem>
										<MenuItem value="iOS">iOS</MenuItem>
										<MenuItem value="Android">Android</MenuItem>
										<Divider />
										<MenuItem disabled>PC</MenuItem>
										<MenuItem value="Windows">Windows</MenuItem>
										<MenuItem value="Mac">Mac</MenuItem>
										<MenuItem value="Linux">Linux</MenuItem>
										<Divider />
										<MenuItem value="All">All</MenuItem>
									</Select>
								</FormControl>
							</Box>
						</Grid>
					</Grid>
					<Grid container spacing={2} sx={{ margin: 'auto', width: '97%', paddingRight: '0.5rem' }}>
						<Grid item xs={1.6}>
							<Box
								sx={{
									marginTop: '2rem',
									color: Colors.primaryColor,
									fontSize: '1rem',
									fontFamily: 'Inria Sans',
									fontWeight: '700',
									marginLeft: '0.5rem',
								}}
							>
								Video Category:
							</Box>
						</Grid>
						<Grid item md={10} sm={10} xs={12}>
							<Box
								component="form"
								sx={{
									'& > :not(style)': { width: '100%' },
								}}
								autoComplete="off"
							>
								<FormControl fullWidth sx={{ marginTop: '1rem' }}>
									<InputLabel id="demo-simple-select-label">What category is this video for?</InputLabel>
									<Select
										labelId="demo-simple-select-label"
										id="demo-simple-select"
										label=" What category is this video for?"
										onChange={(e) => setCategory(e.target.value)}
										value={category}
									>
										<MenuItem value="daily_life">Technology Use in Daily Life</MenuItem>
										<MenuItem value="safety_privacy">Technology Safety and Privacy</MenuItem>
										<MenuItem value="class_word">Technology use for Class and Word</MenuItem>
										<MenuItem value="finance">Financial Well Being and Management</MenuItem>
									</Select>
								</FormControl>
							</Box>
						</Grid>
					</Grid>
				</Box>
			</Box>

			{/* Altering this to have a checkbox that hides it -ben */}
			<Box
				sx={{
					backgroundColor: Colors.backgroundColor,
					height: 'auto',
					borderRadius: '1rem',
					boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
					margin: 'auto',
					paddingBottom: '2rem',
					width: '90%',
					marginTop: '2rem',
					'@media screen and (min-width: 1444px)': {
						display: 'flex',
						flexDirection: 'column', 
						justifyContent: 'flex-start', 
						alignItems: 'flex-start', 
						marginTop: '2rem',
						marginLeft: '2rem', 
						width: '53%', 
					},
				}}
			>
				<Grid container spacing={2} sx={{ margin: 'auto', width: '97%' }}>
					{isChapterSegAvailable && (
						<Grid item xs={6}>
							<FormControlLabel
								control={<Checkbox checked={isChapterSegChecked} onChange={handleChaperCheckboxChange} />}
								label="Use default segmentation from the video"
							/>
						</Grid>
					)}
					{!isChapterSegChecked && (
						<>
							<Grid item xs={isChapterSegAvailable ? 6 : 12} style={{ textAlign: 'end' }}>
								<Box
									sx={{
										color: Colors.primaryColor,
										fontSize: { sm: '1rem', xs: '0.8rem' },
										textAlign: 'end',
										marginTop: '1rem',
										paddingRight: '1rem',
										cursor: 'pointer',
									}}
									onClick={onAddBtnClick}
								>
									+ Add a Segment
								</Box>
							</Grid>
							<Grid item xs={12}>
								{messageInput}
							</Grid>
						</>
					)}
				</Grid>
			</Box>

			<Box
				sx={{
					height: 'auto',
					margin: 'auto',
					paddingBottom: '2rem',
					width: '90%',
				}}
			>
				<Button variant="contained" onClick={handleSubmit} sx={{ mt: 3, mb: 2, bgcolor: Colors.primaryColor }}>
					Submit
				</Button>
			</Box>
		</>
	);
}

export default YouTubeVideo;
