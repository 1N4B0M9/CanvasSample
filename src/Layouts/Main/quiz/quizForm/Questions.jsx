import React, { useState } from 'react';
import Button from '@mui/material/Button';
import questions from '../quizData/questions';

function getQuestion(platform, difficulty) {
	const questionSet = questions[platform][difficulty];
	const randomIndex = Math.floor(Math.random() * questionSet.length);
	return questionSet[randomIndex];
}

const Question = ({ platform }) => {
	const [currentQuestion, setCurrentQuestion] = useState(getQuestion(platform, 'easy'));
	const [selectedOption, setSelectedOption] = useState(null);
	const [difficulty, setDifficulty] = useState('easy');

	const handleNext = () => {
		const correctOption = currentQuestion.options.find((option) => option.isCorrect);
		const isCorrect = selectedOption === correctOption.label;

		let nextDifficulty;
		if (isCorrect) {
			nextDifficulty = difficulty === 'moderate' ? 'hard' : 'moderate';
		} else {
			nextDifficulty = 'easy';
		}

		setCurrentQuestion(getQuestion(platform, nextDifficulty));
		setSelectedOption(null);
		setDifficulty(nextDifficulty);
	};

	return (
		<div className="max-w-lg mx-auto bg-white p-8 shadow-md rounded mt-8">
			<h2 className="text-2xl mb-4">Question</h2>
			<p className="mb-4">{currentQuestion.text}</p>
			{currentQuestion.options.map((option, index) => (
				<label key={index} className="block mb-4">
					<input
						type="radio"
						name="option"
						value={option.label}
						checked={selectedOption === option.label}
						onChange={() => setSelectedOption(option.label)}
						className="mr-2"
					/>
					{option.label}
					<img src={option.image} alt={option.label} className="w-16 h-16 ml-2" />
				</label>
			))}
			<Button
				variant="contained"
				color="primary"
				onClick={handleNext}
				disabled={!selectedOption}
				className="w-full py-3 rounded-lg transition duration-300 ease-in-out transform hover:bg-blue-600 hover:scale-105 mt-4"
			>
				Next
			</Button>
		</div>
	);
};

export default Question;
