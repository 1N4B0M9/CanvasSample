import React, { useState } from 'react';

const ImageElement = ({ element }) => {
	const [placeholder, setPlaceholder] = useState(false);

	return <img src={element.content} alt="canvas element" className="w-48 h-48 object-contain" draggable={false} />;
};

export default ImageElement;
