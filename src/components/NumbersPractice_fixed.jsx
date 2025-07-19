import React, { useState, useEffect } from 'react';
import FrenchDataService from '../services/FrenchDataService';
import ScoreBoard from './ScoreBoard.jsx';

const NumbersPractice = () => {
  const [currentNumber, setCurrentNumber] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [explanation, setExplanation] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showingWrongAnswer, setShowingWrongAnswer] = useState(false);
  const [numbers, setNumbers] = useState([]);
  const [encouragingMessages] = useState([
    'Great job!', 'Excellent!', 'Well done!', 'Perfect!', 'Amazing!', 
    'Fantastic!', 'Brilliant!', 'Outstanding!', 'Superb!', 'Wonderful!'
  ]);

  // Initialize and load numbers
  useEffect(() => {
    // Ensure FrenchDataService is initialized and get numbers
    const loadNumbers = async () => {
      try {
        await FrenchDataService.initialize();
        const allNumbers = await FrenchDataService.getAllNumbers();
        setNumbers(allNumbers);
        
        if (allNumbers.length > 0) {
          getRandomNumber(allNumbers);
        } else {
          console.error("No numbers available in data service");
        }
      } catch (err) {
        console.error("Error loading numbers:", err);
      }
    };
    
    loadNumbers();
  }, []);

  // Function to get a random number from the list
  const getRandomNumber = (numbersArray) => {
    const randomIndex = Math.floor(Math.random() * numbersArray.length);
    setCurrentNumber({
      number: numbersArray[randomIndex].english,
      french: numbersArray[randomIndex].french,
      explanation: numbersArray[randomIndex].explanation || `${numbersArray[randomIndex].english} in French`
    });
  };

  // Function to remove accents from French text for comparison
  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
  };

  // Auto-focus input when component mounts or new number appears
  const inputRef = React.useRef(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentNumber]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentNumber) return;
    if (!userInput.trim()) return;

    // If showing wrong answer explanation, move to next number
    if (showingWrongAnswer) {
      setShowingWrongAnswer(false);
      setExplanation('');
      getRandomNumber(numbers);
      setUserInput('');
      return;
    }

    const userAnswer = removeAccents(userInput.trim().toLowerCase());
    const correctAnswers = currentNumber.french.map(answer => removeAccents(answer.toLowerCase()));
    const correct = correctAnswers.includes(userAnswer);

    setIsCorrect(correct);
    setScore(prev => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));

    if (correct) {
      // Set encouraging message and instantly show next number
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setExplanation(randomMessage);
      getRandomNumber(numbers);
      setUserInput('');
    } else {
      // Show mistake explanation, keep same number, wait for next Enter
      setExplanation(`Correct answer${currentNumber.french.length > 1 ? 's are' : ' is'}: ${currentNumber.french.join(' or ')}`);
      setShowingWrongAnswer(true);
      setUserInput('');
    }
  };

  if (!currentNumber) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Numbers Practice
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Translate numbers to French
        </p>
      </div>

      <ScoreBoard score={score} />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Translate this number:
          </h2>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {currentNumber.number}
          </div>
          {explanation && (
            <div className={`mt-4 p-3 rounded-lg text-lg font-medium ${
              isCorrect 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {explanation}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={showingWrongAnswer ? 'Press Enter to continue...' : 'Enter French number...'}
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!userInput.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Submit Answer
            </button>
            <button
              type="button"
              onClick={() => {
                getRandomNumber(numbers);
                setUserInput('');
                setExplanation('');
                setShowingWrongAnswer(false);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NumbersPractice;