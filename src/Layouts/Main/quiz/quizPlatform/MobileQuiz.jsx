import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import AnswerQuiz from '../answerQuiz/answerQuiz';
import Result from '../results';
import questions from '../quizData/questions';
import mobileIcon from '../../../../assets/quizImages/mobile.png';

export default function MobileQuiz() {
	const [result, setResult] = useState(null);

	return (
		<div className="max-w-lg mx-auto bg-white p-8 shadow-md rounded mt-8">
			<Box display="flex" alignItems="center" mb={2}>
				<Typography variant="h3" gutterBottom>
					Mobile Quiz
				</Typography>
				<img src={mobileIcon} alt="Quiz Logo" style={{ marginRight: 16, height: '10em' }} />
			</Box>

			{result && <Result result={result} setResult={setResult} />}
			{!result && <AnswerQuiz setResult={setResult} questions={questions.mobile} />}
		</div>
	);
}
