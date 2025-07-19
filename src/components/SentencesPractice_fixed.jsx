import React, { useState, useEffect } from 'react';
import ScoreBoard from './ScoreBoard.jsx';
import FrenchDataService from '../services/FrenchDataService';
import ProgressTracker from './dashboard/ProgressTracker';
import { useAuth } from '../contexts/AuthContext';

const SentencesPractice = () => {
  const [currentSentence, setCurrentSentence] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [explanation, setExplanation] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showingWrongAnswer, setShowingWrongAnswer] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [encouragingMessages] = useState([
    'Great job!', 'Excellent!', 'Well done!', 'Perfect!', 'Amazing!', 
    'Fantastic!', 'Brilliant!', 'Outstanding!', 'Superb!', 'Wonderful!'
  ]);

  // Get user ID from auth context
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // Function to remove accents from French text for comparison
  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
  };

  useEffect(() => {
    // Initialize FrenchDataService with user ID
    const loadSentences = async () => {
      try {
        await FrenchDataService.initialize(userId);
        
        // Load all sentences
        const sentences = await FrenchDataService.getAllSentences();
        console.log(`SentencesPractice - loaded ${sentences.length} sentences`);
        
        if (sentences.length > 0) {
          // Get the first sentence
          const sentence = FrenchDataService.getNextItem('sentences', userId);
          console.log("SentencesPractice - first sentence:", sentence);
          if (sentence) {
            setCurrentSentence(sentence);
          } else {
            console.error("Failed to load sentence from data service");
          }
        } else {
          console.error("No sentences available in data service");
        }
      } catch (err) {
        console.error("Error loading sentences:", err);
      }
    };
    
    loadSentences();
  }, [userId]);

  // Auto-focus input when component mounts or new sentence appears
  const inputRef = React.useRef(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentSentence]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!currentSentence) return;
    if (!userInput.trim()) return;

    // If showing wrong answer explanation, move to next sentence
    if (showingWrongAnswer) {
      setShowingWrongAnswer(false);
      setExplanation('');
      const nextSentence = FrenchDataService.getNextItem('sentences', userId);
      setCurrentSentence(nextSentence);
      setUserInput('');
      return;
    }

    const userAnswer = removeAccents(userInput.trim().toLowerCase());
    const correctAnswers = currentSentence.french.map(answer => removeAccents(answer.toLowerCase()));
    const correct = correctAnswers.includes(userAnswer);

    setIsCorrect(correct);
    setScore(prev => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));

    if (correct) {
      // Mark this sentence as seen when answered correctly
      FrenchDataService.markItemAsSeen('sentences', currentSentence.id, userId);
      
      // Set encouraging message and instantly show next sentence
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setExplanation(randomMessage);
      const nextSentence = FrenchDataService.getNextItem('sentences', userId);
      setCurrentSentence(nextSentence);
      setUserInput('');
      // Clear explanation after a short delay
      setTimeout(() => setExplanation(''), 1500);
    } else {
      // Show mistake explanation, keep same sentence, wait for next Enter
      setExplanation(`Correct answer${currentSentence.french.length > 1 ? 's are' : ' is'}: ${currentSentence.french.join(' or ')}`);
      setShowingWrongAnswer(true);
      setUserInput('');
    }
  };

  if (!currentSentence) {
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
          Sentences Practice
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Translate English sentences to French
        </p>
      </div>

      <div className="mb-6">
        <ScoreBoard score={score} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Translate this sentence:
          </h2>
          <div className="text-xl font-semibold text-blue-600 dark:text-blue-400 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            "{currentSentence.english}"
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

        <div className="space-y-4">
          <div>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={showingWrongAnswer ? 'Press Enter to continue...' : 'Enter French translation... (Press Enter to submit)'}
              rows="3"
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              autoFocus
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 text-center text-sm text-gray-500 dark:text-gray-400">
              Press Enter to submit • Use Shift+Enter for new line
            </div>
            <button
              type="button"
              onClick={() => {
                const nextSentence = FrenchDataService.getNextItem('sentences', userId);
                setCurrentSentence(nextSentence);
                setUserInput('');
                setExplanation('');
                setShowingWrongAnswer(false);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentencesPractice;