import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import desktopImage from '../../../assets/quizImages/desktop.png';
import mobileImage from '../../../assets/quizImages/mobile.png';

export default function QuizLayout() {
	const [platform, setPlatform] = useState('');
	const navigate = useNavigate();
	const handleSubmit = (e) => {
		e.preventDefault();
		if (platform === 'desktop') {
			navigate('/quiz/desktop');
		} else if (platform === 'mobile') {
			navigate('/quiz/mobile');
		}
	};

	return (
		<>
			<div className="flex flex-col w-full bg-blue-500 py-8 text-center">
				<p className="text-2xl md:text-6xl mb-4">Don’t know where to start?</p>
				<p className="md:text-4xl">No worries! Take this quiz to get your personal suggestion!</p>
			</div>
			<div className="max-w-lg mx-auto bg-white p-8 shadow-md rounded mt-8">
				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<p className="block text-gray-700 font-bold mb-2 md:text-xl">Choose which platform you use more often:</p>
						<div className="flex justify-around">
							<label htmlFor="desktop" className="flex flex-col items-center">
								<input
									id="desktop"
									type="radio"
									name="platform"
									value="desktop"
									className="mb-2"
									onChange={() => setPlatform('desktop')}
								/>
								<img src={desktopImage} alt="Desktop" className="w-24 h-24 mb-2" />
								<p>Desktop</p>
							</label>
							<label htmlFor="mobile" className="flex flex-col items-center">
								<input
									id="mobile"
									type="radio"
									name="platform"
									value="mobile"
									className="mb-2"
									onChange={() => setPlatform('mobile')}
								/>
								<img src={mobileImage} alt="Mobile" className="w-24 h-24 mb-2" />
								<p>Mobile</p>
							</label>
						</div>
					</div>
					<Button
						variant="contained"
						color="primary"
						type="submit"
						className="w-full py-3 rounded-lg transition duration-300 ease-in-out transform hover:bg-blue-600 hover:scale-105"
					>
						Start
					</Button>
				</form>
			</div>
		</>
	);
}
