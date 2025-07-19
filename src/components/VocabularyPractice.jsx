import React, { useState, useEffect } from 'react';
import ScoreBoard from './ScoreBoard.jsx';
import FrenchDataService from '../services/FrenchDataService';
import ProgressTracker from './dashboard/ProgressTracker';
import { useAuth } from '../contexts/AuthContext';
import CategoryFilter from './CategoryFilter';
import CategoryService from '../services/CategoryService';

const VocabularyPractice = () => {
  const [currentWord, setCurrentWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [explanation, setExplanation] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showingWrongAnswer, setShowingWrongAnswer] = useState(false);
  const [encouragingMessages] = useState([
    'Great job!', 'Excellent!', 'Well done!', 'Perfect!', 'Amazing!', 
    'Fantastic!', 'Brilliant!', 'Outstanding!', 'Superb!', 'Wonderful!'
  ]);

  const [showProgress, setShowProgress] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  
  // State for category filtering
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [allWords, setAllWords] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Local storage key for saving category preferences
  const CATEGORY_PREFERENCES_KEY = 'french-learning-category-preferences';

  // Function to remove accents from French text for comparison
  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
  };

  // Load saved category preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem(CATEGORY_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        if (Array.isArray(parsed)) {
          setSelectedCategories(parsed);
          
          // If we already have loaded words, filter them with these categories
          if (allWords.length > 0) {
            filterWordsByCategories(allWords, parsed);
          }
        }
      } catch (e) {
        console.error('Error parsing saved category preferences:', e);
      }
    } else {
      // If no preferences saved, default to all categories
      loadDefaultCategories();
    }
  }, [allWords.length]);

  // Load default categories for first-time users
  const loadDefaultCategories = async () => {
    try {
      const allCategories = await CategoryService.getAllCategories();
      const allCategoryIds = allCategories.map(category => category.id);
      setSelectedCategories(allCategoryIds);
      
      // If we already have loaded words, filter them with these categories
      if (allWords.length > 0) {
        filterWordsByCategories(allWords, allCategoryIds);
      }
    } catch (error) {
      console.error('Error loading default categories:', error);
      // Fallback to hard-coded defaults
      const defaultIds = ['general', 'vocabulary'];
      setSelectedCategories(defaultIds);
      
      // Apply the default filter to any loaded words
      if (allWords.length > 0) {
        filterWordsByCategories(allWords, defaultIds);
      }
    }
  };

  // Handle category filter changes
  const handleCategoryFilterChange = (newSelectedCategories) => {
    setSelectedCategories(newSelectedCategories);
    // Save preferences to localStorage
    localStorage.setItem(CATEGORY_PREFERENCES_KEY, JSON.stringify(newSelectedCategories));
    
    // Filter words based on new selection
    if (allWords.length > 0) {
      filterWordsByCategories(allWords, newSelectedCategories);
    }
  };

  // Filter words by selected categories
  const filterWordsByCategories = (words, categories) => {
    // If no categories selected, don't show any words
    if (categories.length === 0) {
      setFilteredWords([]);
      return;
    }
    
    const filtered = words.filter(word => {
      // Skip number words
      if (word.category === 'number') return false;
      
      // Include word if its category is in the selected categories
      return categories.includes(word.category);
    });
    
    setFilteredWords(filtered);
    console.log(`Filtered words: ${filtered.length} words match selected categories`);
  };

  useEffect(() => {
    async function loadData() {
      // Initialize FrenchDataService with user ID
      await FrenchDataService.initialize(userId);
      
      try {
        // Load all words
        const words = await FrenchDataService.getAllWords();
        const wordsExcludingNumbers = words.filter(word => word.category !== 'number');
        console.log(`VocabularyPractice - loaded ${wordsExcludingNumbers.length} words (excluding numbers)`);
        
        // Store all words for filtering
        setAllWords(wordsExcludingNumbers);
        
        // Apply filtering based on selected categories - force filtering even if categories is empty
        // This ensures we properly initialize filteredWords right away
        console.log(`Filtering ${wordsExcludingNumbers.length} words with ${selectedCategories.length} categories`);
        if (selectedCategories.length > 0) {
          filterWordsByCategories(wordsExcludingNumbers, selectedCategories);
        } else {
          // If no categories are selected yet (very rare case), wait for them to load
          console.log("No categories selected yet, will filter when categories load");
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading words:", error);
      }
    }
    
    loadData();
  }, [userId]);
  
  // Watch for changes in filtered words list to update the current word
  useEffect(() => {
    if (isInitialized && filteredWords.length > 0) {
      // Only load a new word if we don't have one or if the current one doesn't match our filter
      if (!currentWord || !filteredWords.some(w => w.id === currentWord.id)) {
        loadNextWord();
      }
    }
  }, [filteredWords, isInitialized]);

  // Auto-focus input when component mounts or new word appears
  const inputRef = React.useRef(null);
  
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWord]);

  // Load next word from filtered list
  const loadNextWord = async () => {
    if (filteredWords.length === 0) {
      console.log("No words available after filtering");
      setCurrentWord(null);
      return;
    }

    try {
      // Try to get a word from filtered list that user hasn't seen recently
      // Get seen items from localStorage
      const userSeenKey = `french-learning-words-seen-${userId}`;
      const seenItemsStr = localStorage.getItem(userSeenKey) || '{}';
      let seenItems = {};
      
      try {
        seenItems = JSON.parse(seenItemsStr);
      } catch (error) {
        console.error('Error parsing seen items, resetting:', error);
        seenItems = {};
      }
      
      // Find words user hasn't seen yet
      const unseenWords = filteredWords.filter(word => !seenItems[word.id]);
      
      let nextWord;
      if (unseenWords.length > 0) {
        // If there are unseen words, pick a random one
        const randomIndex = Math.floor(Math.random() * unseenWords.length);
        nextWord = unseenWords[randomIndex];
      } else {
        // Otherwise, pick the least recently seen word
        let oldestSeenTime = Date.now();
        let oldestSeenWord = filteredWords[0];
        
        filteredWords.forEach(word => {
          const lastSeen = seenItems[word.id] || 0;
          if (lastSeen < oldestSeenTime) {
            oldestSeenTime = lastSeen;
            oldestSeenWord = word;
          }
        });
        
        nextWord = oldestSeenWord;
      }
      
      console.log("Loading next word:", nextWord);
      setCurrentWord(nextWord);
    } catch (error) {
      console.error("Error loading next word:", error);
      
      // Fallback: pick a random word from filtered list
      if (filteredWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredWords.length);
        setCurrentWord(filteredWords[randomIndex]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentWord) return;
    if (!userInput.trim()) return;

    // If showing wrong answer explanation, move to next word
    if (showingWrongAnswer) {
      setShowingWrongAnswer(false);
      setExplanation('');
      loadNextWord();
      setUserInput('');
      return;
    }

    const userAnswer = removeAccents(userInput.trim().toLowerCase());
    const correctAnswers = currentWord.french.map(answer => removeAccents(answer.toLowerCase()));
    const correct = correctAnswers.includes(userAnswer);

    setIsCorrect(correct);
    setScore(prev => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));

    if (correct) {
      // Mark this word as seen when answered correctly
      FrenchDataService.markItemAsSeen('words', currentWord.id, userId);
      
      // Set encouraging message and instantly show next word
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setExplanation(randomMessage);
      loadNextWord();
      setUserInput('');
    } else {
      // Show mistake explanation, keep same word, wait for next Enter
      setExplanation(`Correct answer${currentWord.french.length > 1 ? 's are' : ' is'}: ${currentWord.french.join(' or ')}`);
      setShowingWrongAnswer(true);
      setUserInput('');
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }
  
  // Show a message if there are no words matching the filter criteria
  if (filteredWords.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Vocabulary Practice
          </h1>
        </div>
        
        <CategoryFilter 
          onFilterChange={handleCategoryFilterChange}
          selectedCategories={selectedCategories}
        />
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6 text-center">
          <h2 className="text-xl text-red-500 mb-4">No Words Available</h2>
          <p className="text-gray-600 dark:text-gray-400">
            There are no vocabulary words matching your selected categories.
            Please select at least one category or add words in these categories.
          </p>
        </div>
      </div>
    );
  }
  
  // Show a loading state if currentWord is null but we have filtered words
  if (!currentWord && filteredWords.length > 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading next word...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Vocabulary Practice
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Translate English words to French
        </p>
      </div>

      <CategoryFilter 
        onFilterChange={handleCategoryFilterChange}
        selectedCategories={selectedCategories}
      />

      <div className="mb-4">
        <ScoreBoard score={score} />
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        {currentWord && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
                Translate this word:
              </h2>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {currentWord.english}
              </div>
              {currentWord.category && (
                <div className="mt-2 text-sm text-gray-500">
                  Category: {currentWord.category}
                </div>
              )}
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
                  placeholder={showingWrongAnswer ? 'Press Enter to continue...' : 'Enter French translation...'}
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
                    loadNextWord();
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
          </>
        )}
      </div>
      
      <div className="text-center text-sm text-gray-500 mb-4">
        {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''} available with current filter
      </div>
    </div>
  );
};

export default VocabularyPractice;