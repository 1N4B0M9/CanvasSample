import React from 'react';
import { Link } from "react-router-dom";

export function Breadcrumb({ subtopicValue, handleResetSubtopic }) {
	return (
		<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
			<Link to="/">Home</Link>
			{subtopicValue.length > 0 ? (
				<>
					<span style={{ margin: '0 5px' }}> {'>'} </span>
					<button onClick={handleResetSubtopic}>{subtopicValue}</button>
				</>
			) : (
				<>
					<span style={{ margin: '0 5px' }}> {'>'} </span>
					<b>Subtopics</b>
				</>
			)}
			{subtopicValue.length > 0 && (
				<>
					<span style={{ margin: '0 5px' }}> {'>'} </span>
					<div>
						<b>Videos</b>
					</div>
				</>
			)}
		</div>
	);
}

export default Breadcrumb;