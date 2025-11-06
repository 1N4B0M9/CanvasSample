import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaImages, FaShapes } from 'react-icons/fa6';
import { IoImage, IoLayers, IoCloudUpload, IoMic, IoStop } from 'react-icons/io5';
import { PiSelectionBackgroundBold } from 'react-icons/pi';
import { TbFileExport } from 'react-icons/tb';
import { LuUserRound, LuUserRoundPlus } from 'react-icons/lu';
import { BsFileEarmarkFont } from 'react-icons/bs';
import { GrRedo, GrUndo } from 'react-icons/gr';
import { RiDeleteBin5Line } from 'react-icons/ri';
import { FaBook } from 'react-icons/fa';
import ImageSearch from '../ImageSearch';
import ImagePanel from './Panels/ImagePanel';
import BackgroundPanel from './Panels/BackgroundPanel';
import ExportPanel from './Panels/ExportPanel';
import ExtractPanel from './Panels/ExtractPanel';
import ImportPanel from './Panels/ImportPanel';
import RecordingPanel from './Panels/RecordingPanel';
import { useAuth } from '../../../../../firebase/AuthContext';
import MagazinePanel from './Panels/MagazinePanel';

const ToolBar = ({
	handleAddText,
	handleAddMentor,
	addImage,
	addImageElement,
	handleBackgroundUpload,
	handleBackgroundFromSearch,
	removeBackgroundImage,
	backgroundImage,
	updateBackgroundScale,
	handleExport,
	handleExportJSON,
	handleImport,
	apiBaseUrl = process.env.REACT_APP_API_BASE_URL, // Updated API base URL
}) => {
	const { currentUser } = useAuth();
	const [activePanel, setActivePanel] = useState(null);
	const [backgroundScale, setBackgroundScale] = useState(100);
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const recordingPanelRef = useRef(null);
	// Persist element bank state so it doesn't get cleared when panel closes
	const [magazineElementBank, setMagazineElementBank] = useState([]);

	// Handle background scale change
	const handleScaleChange = (newScale) => {
		setBackgroundScale(newScale);
		if (updateBackgroundScale) {
			updateBackgroundScale(newScale);
		}
	};

	// Close panel function
	const closePanel = () => {
		setActivePanel(null);
	};

	// Handle recording start
	const handleRecordingStart = () => {
		setIsRecording(true);
		setRecordingTime(0);
	};

	// Handle recording stop
	const handleRecordingStop = () => {
		setIsRecording(false);
		setRecordingTime(0);
	};

	// Handle recording time update
	const handleRecordingTimeUpdate = (time) => {
		setRecordingTime(time);
	};

	// Handle tool click, basically takes the tool action with the handler to process it
	const handleToolClick = (tool) => {
		if (tool.action === 'direct' && tool.handler) {
			tool.handler();
		} else if (tool.action === 'panel') {
			// Toggle panel - close if same panel is clicked, otherwise open new panel
			setActivePanel(activePanel === tool.panelType ? null : tool.panelType);
		}
	};

	// Main tool registry - tools that either work directly or open panels
	const BaseToolRegistry = [
		{
			Icon: LuUserRoundPlus,
			label: 'Add Mentor',
			action: 'direct',
			handler: handleAddMentor,
		},
		{
			Icon: BsFileEarmarkFont,
			label: 'Add Attribute',
			action: 'direct',
			handler: handleAddText,
		},
		{
			Icon: IoImage,
			label: 'Add Image',
			action: 'panel',
			panelType: 'image',
		},
		{
			Icon: IoLayers,
			label: 'Extract Images',
			action: 'panel',
			panelType: 'extract',
		},
		{
			Icon: FaBook,
			label: 'Magazine',
			action: 'panel',
			panelType: 'magazine',
		},
		{
			Icon: PiSelectionBackgroundBold,
			label: 'Background',
			action: 'panel',
			panelType: 'background',
		},
		{
			Icon: IoMic,
			label: 'Story Telling',
			action: 'panel',
			panelType: 'recording',
			disabled: !currentUser,
		},
		{
			Icon: IoCloudUpload,
			label: 'Import Canvas',
			action: 'panel',
			panelType: 'import',
		},
		{
			Icon: TbFileExport,
			label: 'Export Canvas',
			action: 'panel',
			panelType: 'export',
		},
	];

	// Utility tool registry for undo/redo/delete
	const UtilToolRegistry = [
		{
			Icon: GrUndo,
			label: 'Undo Action',
			action: 'direct',
			handler: () => { },
			disabled: () => { },
		},
		{
			Icon: GrRedo,
			label: 'Redo Action',
			action: 'direct',
			handler: () => { },
			disabled: () => { },
		},
		{
			Icon: RiDeleteBin5Line,
			label: 'Delete Element',
			action: 'direct',
			handler: () => { },
			disabled: () => { },
			isDelete: true,
		},
	];

	return (
		<>
			<div className="px-2 py-1 rounded-xl absolute left-1/2 top-4 -translate-x-1/2 z-50 border border-gray-300 bg-white shadow flex flex-row">
				{/* Base Tool Row */}
				<div className="flex flex-row gap-1 items-center">
					{BaseToolRegistry.map((tool, idx) => {
						const { Icon, label, disabled } = tool;
						const isActive = activePanel === tool.panelType;
						const isDisabled = disabled === true;

						return (
							<div
								key={label}
								className={`group relative rounded-md p-2 transition-colors duration-150 ${isDisabled
										? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${isActive ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-blue-100'}`
									}`}
								title={isDisabled ? `${label} (Login required)` : label}
								role="button"
								tabIndex={isDisabled ? -1 : 0}
								onClick={() => !isDisabled && handleToolClick(tool)}
								onKeyDown={(e) => {
									if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
										e.preventDefault();
										handleToolClick(tool);
									}
								}}
							>
								<Icon className={`text-xl ${isActive ? 'text-blue-700' : ''}`} />
								{/* Tooltip */}
								<span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
									{isDisabled ? `${label} (Login required)` : label}
								</span>
							</div>
						);
					})}
				</div>
				{/* Will Bring back additional util tools in the future if needed */}
				{/* <div className="mx-2 border-l border-gray-300 h-8 self-center" /> */}
				{/* <div className="flex flex-row items-center">
					{UtilToolRegistry.map((tool, idx) => {
						const { Icon, label, isDelete, disabled } = tool;

						return (
							<div
								key={label}
								className={`group relative rounded-md p-2 transition-colors duration-150 cursor-pointer ${
									disabled
										? 'opacity-50 cursor-not-allowed'
										: isDelete
											? 'bg-white hover:bg-red-100'
											: 'hover:bg-blue-100'
								}`}
								title={label}
								onClick={() => !disabled && handleToolClick(tool)}
							>
								<Icon
									className={
										isDelete
											? 'text-xl text-red-300 group-hover:text-red-600 transition-colors duration-150'
											: 'text-xl'
									}
								/>
								<span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
									{label}
								</span>
							</div>
						);
					})}
				</div> */}
			</div>

			{activePanel === 'image' && <ImagePanel addImage={addImage} onClose={closePanel} />}

			{activePanel === 'background' && (
				<BackgroundPanel
					handleBackgroundUpload={handleBackgroundUpload}
					handleBackgroundFromSearch={handleBackgroundFromSearch}
					removeBackgroundImage={removeBackgroundImage}
					backgroundImage={backgroundImage}
					backgroundScale={backgroundScale}
					onScaleChange={handleScaleChange}
					onClose={closePanel}
				/>
			)}

			{activePanel === 'import' && <ImportPanel handleImport={handleImport} onClose={closePanel} />}

			{activePanel === 'export' && (
				<ExportPanel handleExport={handleExport} handleExportJSON={handleExportJSON} onClose={closePanel} />
			)}

			{activePanel === 'extract' && <ExtractPanel addImage={addImage} apiBaseUrl={apiBaseUrl} onClose={closePanel} />}

			{activePanel === 'recording' && (
				<RecordingPanel
					ref={recordingPanelRef}
					onClose={closePanel}
					onRecordingStart={handleRecordingStart}
					onRecordingStop={handleRecordingStop}
					onRecordingTimeUpdate={handleRecordingTimeUpdate}
				/>
			)}

			{/* Compact Recording Indicator - shown on the right side of toolbar when recording */}
			{isRecording && (
				<div className="absolute right-4 top-4 z-50 bg-white border border-red-500 rounded-xl shadow-lg p-3 flex items-center gap-3">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
						<span className="text-sm font-mono font-semibold text-gray-800">
							{(() => {
								const mins = Math.floor(recordingTime / 60);
								const secs = recordingTime % 60;
								return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
							})()}
						</span>
					</div>
					<button
						type="button"
						onClick={() => recordingPanelRef.current?.stopRecording()}
						className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-all active:scale-95"
					>
						<IoStop className="text-base" />
						Stop
					</button>
				</div>
			)}
			{activePanel === 'magazine' && (
				<MagazinePanel
					addImageElement={addImageElement}
					onClose={closePanel}
					elementBank={magazineElementBank}
					setElementBank={setMagazineElementBank}
				/>
			)}
		</>
	);
};

ToolBar.propTypes = {
	handleAddText: PropTypes.func.isRequired,
	handleAddMentor: PropTypes.func.isRequired,
	addImage: PropTypes.func.isRequired,
	handleBackgroundUpload: PropTypes.func.isRequired,
	handleBackgroundFromSearch: PropTypes.func.isRequired,
	removeBackgroundImage: PropTypes.func.isRequired,
	backgroundImage: PropTypes.shape({
		url: PropTypes.string,
		name: PropTypes.string,
		type: PropTypes.string,
	}),
	updateBackgroundScale: PropTypes.func,
	handleExport: PropTypes.func.isRequired,
	handleExportJSON: PropTypes.func.isRequired,
	handleImport: PropTypes.func.isRequired,
	apiBaseUrl: PropTypes.string,
};

ToolBar.defaultProps = {
	backgroundImage: null,
	updateBackgroundScale: null,
	apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
};

export default ToolBar;
