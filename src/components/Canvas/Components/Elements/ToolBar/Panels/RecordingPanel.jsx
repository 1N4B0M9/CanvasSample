import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { IoMic, IoStop, IoCheckmark, IoClose } from 'react-icons/io5';
import { ref as storageRef, uploadBytes, getStorage } from 'firebase/storage';
import { useAuth } from '../../../../../../firebase/AuthContext';
import { useCanvas } from '../../../../Utils/CanvasContext';

const RecordingPanel = forwardRef(({ onClose, onRecordingStart, onRecordingStop, onRecordingTimeUpdate }, ref) => {
	const { currentUser } = useAuth();
	const { canvasId } = useCanvas();
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const [audioBlob, setAudioBlob] = useState(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadSuccess, setUploadSuccess] = useState(false);
	const [error, setError] = useState('');

	const mediaRecorderRef = useRef(null);
	const audioChunksRef = useRef([]);
	const timerRef = useRef(null);
	const mimeTypeRef = useRef(null); // Store the MIME type used for recording

	// Security settings
	const MAX_RECORDING_DURATION = 300; // 5 minutes in seconds
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

	// Detect supported audio MIME type for cross-browser compatibility
	const getSupportedMimeType = () => {
		// Preferred MIME types in order (WebM for most browsers, MP4 for Safari/iOS)
		const types = [
			'audio/webm',
			'audio/webm;codecs=opus',
			'audio/mp4',
			'audio/ogg;codecs=opus',
			'audio/ogg',
		];

		// Find the first supported MIME type
		const supportedType = types.find((type) => MediaRecorder.isTypeSupported(type));

		// Return supported type or fallback to default
		return supportedType || 'audio/webm';
	};

	// Clean up on unmount
	useEffect(() => () => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
			mediaRecorderRef.current.stop();
		}
	}, []);

	// Format time as MM:SS
	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Start recording
	const startRecording = async () => {
		try {
			setError('');
			setAudioBlob(null);
			setUploadSuccess(false);

			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

			// Detect supported MIME type for this browser
			const mimeType = getSupportedMimeType();
			mimeTypeRef.current = mimeType;
			console.log('Using MIME type:', mimeType);

			// Create MediaRecorder instance with detected MIME type
			const mediaRecorder = new MediaRecorder(stream, { mimeType });
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			// Collect audio data
			mediaRecorder.addEventListener('dataavailable', (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			});

			// Handle recording stop
			mediaRecorder.addEventListener('stop', () => {
				// Use the same MIME type that was used for recording
				const recordedBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
				setAudioBlob(recordedBlob);

				// Stop all tracks to release microphone
				stream.getTracks().forEach((track) => track.stop());
			});

			// Start recording
			mediaRecorder.start();
			setIsRecording(true);
			setRecordingTime(0);

			// Notify parent that recording has started
			if (onRecordingStart) {
				onRecordingStart();
			}

			// Start timer
			timerRef.current = setInterval(() => {
				setRecordingTime((prev) => {
					const newTime = prev + 1;
					// Notify parent of time update
					if (onRecordingTimeUpdate) {
						onRecordingTimeUpdate(newTime);
					}
					// Auto-stop recording when max duration is reached
					if (newTime >= MAX_RECORDING_DURATION) {
						setTimeout(() => {
							if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
								mediaRecorderRef.current.stop();
								setIsRecording(false);
								if (timerRef.current) {
									clearInterval(timerRef.current);
									timerRef.current = null;
								}
								setError(`Recording auto-stopped: Maximum duration of ${MAX_RECORDING_DURATION / 60} minutes reached.`);
								// Notify parent that recording has stopped
								if (onRecordingStop) {
									onRecordingStop();
								}
							}
						}, 0);
					}
					return newTime;
				});
			}, 1000);
		} catch (err) {
			console.error('Error starting recording:', err);
			setError('Failed to access microphone. Please check your permissions.');
		}
	};

	// Stop recording
	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);

			// Clear timer
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}

			// Notify parent that recording has stopped
			if (onRecordingStop) {
				onRecordingStop();
			}
		}
	};

	// Expose stopRecording function to parent component
	useImperativeHandle(ref, () => ({
		stopRecording,
		recordingTime,
	}));

	// Upload to Firebase Storage
	const uploadToFirebase = async () => {
		if (!audioBlob || !currentUser) {
			setError('No recording or user not authenticated');
			return;
		}

		// Validate file size
		if (audioBlob.size > MAX_FILE_SIZE) {
			setError(`File too large: ${(audioBlob.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
			return;
		}

		try {
			setIsUploading(true);
			setError('');

			// Initialize Firebase Storage
			const storage = getStorage();

			// Determine file extension from MIME type
			const mimeType = mimeTypeRef.current || 'audio/webm';
			const fileExtension = mimeType.split('/')[1].split(';')[0]; // Extract 'webm', 'mp4', 'ogg', etc.

			// Create a unique filename with correct extension
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const fileName = `canvas-recordings/${currentUser.uid}/${canvasId}/${timestamp}.${fileExtension}`;

			// Create storage reference
			const fileRef = storageRef(storage, fileName);

			// Upload the audio blob
			console.log('Uploading audio to Firebase Storage...');
			await uploadBytes(fileRef, audioBlob);

			console.log('Audio uploaded successfully!');
			console.log('File path:', fileName);

			setUploadSuccess(true);
			setIsUploading(false);

			// Auto-close panel after 2 seconds
			setTimeout(() => {
				onClose();
			}, 2000);
		} catch (err) {
			console.error('Error uploading audio:', err);
			setError(`Upload failed: ${err.message}`);
			setIsUploading(false);
		}
	};

	// Discard recording
	const discardRecording = () => {
		setAudioBlob(null);
		setRecordingTime(0);
		setUploadSuccess(false);
		setError('');
	};

	// Don't render the panel when recording is active
	if (isRecording) {
		return null;
	}

	return (
		<div className="absolute left-1/2 top-20 -translate-x-1/2 z-50 bg-white border border-gray-300 rounded-xl shadow-lg p-6 w-96">
			{/* Header */}
			<div className="flex justify-between items-center mb-3">
				<h3 className="text-lg font-semibold text-gray-800">Story Telling</h3>
				<button
					type="button"
					onClick={onClose}
					className="text-gray-500 hover:text-gray-700 transition-colors"
					aria-label="Close"
				>
					<IoClose className="text-xl" />
				</button>
			</div>

			{/* Descriptive Text */}
			<div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
				<p className="text-sm text-gray-700 text-center">
					Share your stories and ideas when creating this vision board with us.
				</p>
			</div>

			{/* User Authentication Check */}
			{!currentUser && (
				<div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
					<p className="text-sm text-yellow-800">Please log in to use the recording feature.</p>
				</div>
			)}

			{/* Error Message */}
			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}

			{/* Success Message */}
			{uploadSuccess && (
				<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
					<IoCheckmark className="text-green-600 text-xl" />
					<p className="text-sm text-green-800">Recording uploaded successfully!</p>
				</div>
			)}

			{/* Recording Timer */}
			<div className="mb-6">
				<div className="text-center">
					<div className="text-4xl font-mono font-bold text-gray-800 mb-2">{formatTime(recordingTime)}</div>
					{isRecording && (
						<>
							<div className="flex items-center justify-center gap-2 mb-2">
								<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
								<span className="text-sm text-gray-600">Recording...</span>
							</div>
							<div className="text-xs text-gray-500">
								Max: {formatTime(MAX_RECORDING_DURATION)}
							</div>
						</>
					)}
				</div>
			</div>

			{/* Recording Controls */}
			<div className="space-y-3">
				{!isRecording && !audioBlob && (
					<button
						type="button"
						onClick={startRecording}
						disabled={!currentUser}
						className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
							currentUser
								? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
								: 'bg-gray-300 text-gray-500 cursor-not-allowed'
						}`}
					>
						<IoMic className="text-xl" />
						Start Recording
					</button>
				)}

				{isRecording && (
					<button
						type="button"
						onClick={stopRecording}
						className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-all active:scale-95"
					>
						<IoStop className="text-xl" />
						Stop Recording
					</button>
				)}

				{audioBlob && !uploadSuccess && (
					<div className="space-y-2">
						<button
							type="button"
							onClick={uploadToFirebase}
							disabled={isUploading}
							className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
								isUploading
									? 'bg-blue-300 text-white cursor-wait'
									: 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
							}`}
						>
							{isUploading ? (
								<>
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
									Uploading...
								</>
							) : (
								<>
									<IoCheckmark className="text-xl" />
									Done - Upload Recording
								</>
							)}
						</button>

						<button
							type="button"
							onClick={discardRecording}
							disabled={isUploading}
							className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<IoClose className="text-xl" />
							Discard & Record Again
						</button>
					</div>
				)}
			</div>

			{/* Info Section */}
			<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
				<p className="text-xs text-blue-800">
					<strong>How to use:</strong>
				</p>
				<ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
					<li>Click &quot;Start Recording&quot; to begin</li>
					<li>Click &quot;Stop Recording&quot; when done</li>
					<li>Click &quot;Done&quot; to upload to Firebase Storage</li>
					<li>Maximum duration: {MAX_RECORDING_DURATION / 60} minutes</li>
					<li>Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB</li>
				</ul>
			</div>
		</div>
	);
});

RecordingPanel.displayName = 'RecordingPanel';

RecordingPanel.propTypes = {
	onClose: PropTypes.func.isRequired,
	onRecordingStart: PropTypes.func,
	onRecordingStop: PropTypes.func,
	onRecordingTimeUpdate: PropTypes.func,
};

RecordingPanel.defaultProps = {
	onRecordingStart: null,
	onRecordingStop: null,
	onRecordingTimeUpdate: null,
};

export default RecordingPanel;
