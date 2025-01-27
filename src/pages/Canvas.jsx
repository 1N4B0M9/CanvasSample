import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Transformer } from 'react-konva';

function Canvas() {
	const [images, setImages] = useState([]);
	const [selectedImageId, setSelectedImageId] = useState(null);
	const stageRef = useRef(null);
	const transformerRef = useRef(null);
	const layerRef = useRef(null);

	// Function to handle image drop
	const handleDrop = (e) => {
		e.preventDefault();
		const stage = stageRef.current;
		const { x, y } = stage.getPointerPosition();

		const file = e.dataTransfer.files[0];
		const reader = new FileReader();
		reader.onload = function () {
			const img = new window.Image();
			img.src = reader.result;
			img.onload = function () {
				const newImage = {
					id: images.length.toString(),
					x,
					y,
					img,
					isDragging: false,
					rotation: 0,
					scaleX: 1,
					scaleY: 1,
				};
				setImages([...images, newImage]);
			};
		};
		reader.readAsDataURL(file);
	};

	// Function to handle dragging start
	const handleDragStart = (e) => {
		const id = e.target.id();
		setSelectedImageId(id);
		setImages(
			images.map((image) => ({
				...image,
				isDragging: image.id === id,
			})),
		);
	};
	//handle delete
	/*const handleDelete = (e) => {
		const id = e.target.id();
		setSelectedImageId(id);


	}*/

	// Function to handle dragging end
	const handleDragEnd = () => {
		setImages(
			images.map((image) => ({
				...image,
				isDragging: false,
			})),
		);
	};

	// Function to update image transformations (resize, rotate)
	const handleTransformEnd = (e) => {
		const node = e.target;
		const id = node.id();

		const updatedImages = images.map((img) => {
			if (img.id === id) {
				return {
					...img,
					x: node.x(),
					y: node.y(),
					rotation: node.rotation(),
					scaleX: node.scaleX(),
					scaleY: node.scaleY(),
				};
			}
			return img;
		});

		setImages(updatedImages);
	};

	// Attach the transformer to the selected image
	useEffect(() => {
		if (selectedImageId) {
			const selectedNode = layerRef.current.findOne(`#${selectedImageId}`);
			transformerRef.current.nodes([selectedNode]);
			transformerRef.current.getLayer().batchDraw();
		}
	}, [selectedImageId]);

	return (
		<div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} style={{ width: '100%', height: '100vh' }}>
			<Stage width={window.innerWidth} height={window.innerHeight} ref={stageRef}>
				<Layer ref={layerRef}>
					{images.map((image) => (
						<Image
							key={image.id}
							id={image.id}
							x={image.x}
							y={image.y}
							image={image.img}
							draggable
							rotation={image.rotation}
							scaleX={image.scaleX}
							scaleY={image.scaleY}
							onClick={() => setSelectedImageId(image.id)}
							onTap={() => setSelectedImageId(image.id)}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
							onTransformEnd={handleTransformEnd} // To handle resize/rotation end
						/>
					))}
					<Transformer
						ref={transformerRef}
						boundBoxFunc={(oldBox, newBox) => {
							// limit resize
							if (newBox.width < 30 || newBox.height < 30) {
								return oldBox;
							}
							return newBox;
						}}
					/>
				</Layer>
			</Stage>
		</div>
	);
}

export default Canvas;
