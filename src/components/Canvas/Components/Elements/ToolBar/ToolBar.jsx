import React, { useState, useRef } from 'react';
import { FaImages, FaShapes } from 'react-icons/fa6';
import ImageSearch from '../ImageSearch';
import { IoImage, IoLayers } from 'react-icons/io5';
import { PiSelectionBackgroundBold } from 'react-icons/pi';
import { TbFileExport } from 'react-icons/tb';
import { LuUserRound, LuUserRoundPlus } from 'react-icons/lu';
import { BsFileEarmarkFont } from 'react-icons/bs';
import { GrRedo, GrUndo } from 'react-icons/gr';
import { RiDeleteBin5Line } from 'react-icons/ri';

const ToolBar = ({
	handleAddText,
	handleAddMentor,
	addImage,
	handleBackgroundUpload,
	handleBackgroundFromSearch,
	removeBackgroundImage,
	backgroundImage,
	updateBackgroundScale,
	handleExport,
	apiBaseUrl = 'https://vision-board-api-v2.onrender.com', // Updated API base URL
}) => {
	const [activePanel, setActivePanel] = useState(null);
	const [backgroundScale, setBackgroundScale] = useState(100);

	// Handle background scale change
	const handleScaleChange = (newScale) => {
		setBackgroundScale(newScale);
		if (updateBackgroundScale) {
			updateBackgroundScale(newScale);
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
			Icon: PiSelectionBackgroundBold,
			label: 'Background',
			action: 'panel',
			panelType: 'background',
		},
		{
			Icon: TbFileExport,
			label: 'Export',
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
			handler: handleUndo,
			disabled: !handleUndo,
		},
		{
			Icon: GrRedo,
			label: 'Redo Action',
			action: 'direct',
			handler: handleRedo,
			disabled: !handleRedo,
		},
		{
			Icon: RiDeleteBin5Line,
			label: 'Delete Element',
			action: 'direct',
			handler: handleDelete,
			isDelete: true,
			disabled: !handleDelete,
		},
	];

	return (
		<div className="px-2 py-1 rounded-xl absolute left-4 top-18 mt-4 z-50 border border-1 border-gray-300 bg-white shadow flex flex-row">
			{/* Base Tool Row*/}
			<div className="flex flex-row gap-1 items-center">
				{BaseToolRegistry.map(({ Icon, label }, idx) => (
					<div
						key={label}
						className="group relative rounded-md p-2 transition-colors duration-150 cursor-pointer hover:bg-blue-100"
						title={label}
					>
						<Icon className="text-xl" />
						{/* Tooltip */}
						<span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
							{label}
						</span>
					</div>
				))}
			</div>
			<div className="mx-2 border-l border-gray-300 h-8 self-center" />
			<div className="flex flex-row items-center">
				{/* Additional Tool Row */}
				{UtilToolRegistry.map(({ Icon, label, isDelete }, idx) => (
					<div
						key={label}
						className={
							'group relative rounded-md p-2 transition-colors duration-150 cursor-pointer ' +
							(isDelete ? 'bg-white hover:bg-red-100' : 'hover:bg-blue-100')
						}
						title={label}
					>
						<Icon
							className={
								isDelete ? 'text-xl text-red-300 group-hover:text-red-600 transition-colors duration-150' : 'text-xl'
							}
						/>
						{/* Tooltip */}
						<span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
							{label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};

export default ToolBar;
