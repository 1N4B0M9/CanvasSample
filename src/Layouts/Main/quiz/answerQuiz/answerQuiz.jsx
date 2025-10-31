import React, { useEffect, useState } from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import zoom from '../img/zoom.png';
import sty from './answerQuiz.module.css';

export default function AnswerQuiz({ questions, setResult }) {
	const nav = useNavigate();
	const [previewSrc, setPreviewSrc] = useState(null);
	const [curIndex, setCurIndex] = useState(1);
	const [currentQuestion, setCurrentQuestion] = useState(null);
	const [checked, setChecked] = useState('');
	const [answeredQuestions, setAnsweredQuestions] = useState({ easy: [], moderate: [], hard: [] });
	const [difficulty, setDifficulty] = useState('easy');
	const [answerRecords, setAnswerRecords] = useState([]);
	useEffect(() => {
		const initialQuestion = getRandomQuestion(difficulty);
		setCurrentQuestion(initialQuestion);
	}, []);

	const handleChange = (event) => {
		setChecked(event.target.value);
	};

	const getRandomQuestion = (difficulty, answeredQues) => {
		const needAnsweredQues = answeredQues || answeredQuestions;
		console.log('needAnsweredQues = ', needAnsweredQues);
		const availableQuestions = questions[difficulty].filter((q) => !needAnsweredQues[difficulty].includes(q.id));
		if (availableQuestions.length === 0) return null;
		const randomIndex = Math.floor(Math.random() * availableQuestions.length);
		return availableQuestions[randomIndex];
	};

	const handleNext = () => {
		if (!checked) {
			alert('Please choose an option!');
			return;
		}

		const answer = currentQuestion.options.filter((v) => v.isCorrect)[0].label;
		// console.log('currentQuestion = ', currentQuestion);
		// console.log('checked = ', checked);
		const isCorrect = answer == checked;

		const deepAnswerRecords = [...answerRecords];
		deepAnswerRecords.push({
			isCorrect,
			question: currentQuestion,
		});
		setAnswerRecords(deepAnswerRecords);

		const deepNewAnsweredQuestions = {
			...answeredQuestions,
			[difficulty]: [...answeredQuestions[difficulty], currentQuestion.id],
		};
		setAnsweredQuestions(deepNewAnsweredQuestions);

		if (curIndex == 5) {
			// console.log('deepAnswerRecords = ', deepAnswerRecords);
			setResult(deepAnswerRecords);
			return;
		}
		let nextDifficulty;
		if (isCorrect) {
			if (difficulty === 'easy') {
				nextDifficulty = 'moderate';
			} else if (difficulty === 'moderate') {
				nextDifficulty = 'hard';
			} else if (difficulty === 'hard') {
				nextDifficulty = 'hard';
			}
		} else if (difficulty === 'moderate') {
				nextDifficulty = 'easy';
			} else if (difficulty === 'hard') {
				nextDifficulty = 'moderate';
			} else if (difficulty === 'easy') {
				nextDifficulty = 'easy';
			}
		setDifficulty(nextDifficulty);
		const nextQuestion = getRandomQuestion(nextDifficulty, deepNewAnsweredQuestions);
		console.log('currentQuestion2 = ', currentQuestion);
		console.log('nextQuestion = ', nextQuestion);
		setCurrentQuestion(nextQuestion);
		setCurIndex(curIndex + 1);
		setChecked('');
	};
	console.log('currentQuestion1 = ', currentQuestion);
	return (
		<div>
			{previewSrc && (
				<div
					onClick={() => {
						document.body.style.overflow = 'auto';
						setPreviewSrc(null);
					}}
					className={sty.modalBox}
				>
					<img src={previewSrc} />
				</div>
			)}

			<Typography variant="h4" gutterBottom>
				Question {curIndex}/5
			</Typography>
			<Typography variant="h6" gutterBottom>
				{currentQuestion?.text}
			</Typography>
			<div>
				<FormControl>
					<RadioGroup value={checked} onChange={handleChange}>
						{currentQuestion?.options?.map((v, i) => (
								<div>
									<FormControlLabel key={i} value={v.label} control={<Radio />} label={v.label} />
									<div className={sty.imgBox}>
										{v.image.map((imgItem) => (
												<div
													onClick={() => {
														document.body.style.overflow = 'hidden';
														setPreviewSrc(imgItem);
													}}
													style={{
														cursor: `url(${zoom}), auto`,
														// cursor: 'pointer',
													}}
													className={sty.imgItem}
												>
													<img className={sty.img} src={imgItem} />
												</div>
											))}
									</div>
								</div>
							))}
					</RadioGroup>
				</FormControl>
			</div>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'flex-end',
				}}
			>
				<Button disabled={!checked} onClick={handleNext} variant="contained">
					{curIndex == 5 ? 'Submit' : 'Next'}
				</Button>
			</Box>
		</div>
	);
}
