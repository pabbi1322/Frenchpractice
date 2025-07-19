import React, { useState, useEffect, useRef, useCallback } from 'react';
import ScoreBoard from './ScoreBoard.jsx';
import FrenchDataService from '../services/FrenchDataService';
import ProgressTracker from './dashboard/ProgressTracker';
import { useAuth } from '../contexts/AuthContext';
import VerbGroupFilterWithCheckboxes from './content-management/VerbGroupFilterWithCheckboxes';

const VerbsPractice = () => {
  const [currentVerb, setCurrentVerb] = useState(null);
  const [conjugations, setConjugations] = useState({
    je: '',
    tu: '',
    il: '',
    nous: '',
    vous: '',
    ils: ''
  });
  const [currentFocus, setCurrentFocus] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [feedback, setFeedback] = useState(null);
  const [showingResults, setShowingResults] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showFrench, setShowFrench] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [allVerbs, setAllVerbs] = useState([]);
  const [filteredVerbs, setFilteredVerbs] = useState([]);
  
  // Local storage key for saving verb group preferences
  const VERB_GROUP_PREFERENCES_KEY = 'french-learning-verb-group-preferences';

  // Get user ID from auth context for content tracking
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const pronouns = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
  const pronounLabels = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'];

  // Function to remove accents from French text for comparison
  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
  };

  // Filter verbs by selected groups
  const filterVerbsByGroups = useCallback((verbs, groups) => {
    if (!groups || groups.length === 0) {
      return []; // If no groups selected, return empty array (consistent with CategoryFilter behavior)
    }
    
    return verbs.filter(verb => groups.includes(verb.group || '4')); // Default to group 4 (irregular) if not specified
  }, []);
  
  // Handle group selection change
  const handleGroupsChange = (groups) => {
    setSelectedGroups(groups);
    
    // Save preferences to localStorage
    localStorage.setItem('french-learning-verb-group-preferences', JSON.stringify(groups));
    
    const filtered = filterVerbsByGroups(allVerbs, groups);
    setFilteredVerbs(filtered);
    
    // Reset the current verb if it's not in the filtered set
    if (currentVerb && filtered.length > 0) {
      const isCurrentVerbInFiltered = filtered.some(v => v.id === currentVerb.id);
      if (!isCurrentVerbInFiltered) {
        // Pick a random verb from the filtered list
        const randomIndex = Math.floor(Math.random() * filtered.length);
        setCurrentVerb(filtered[randomIndex]);
        resetConjugationForm();
      }
    }
  };
  
  // Reset conjugation form
  const resetConjugationForm = () => {
    setConjugations({
      je: '',
      tu: '',
      il: '',
      nous: '',
      vous: '',
      ils: ''
    });
    setFeedback(null);
    setShowingResults(false);
    setCurrentFocus(0);
  };

  // Load saved verb group preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem(VERB_GROUP_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        if (Array.isArray(parsed)) {
          setSelectedGroups(parsed);
          
          // If we already have loaded verbs, filter them with these groups
          if (allVerbs.length > 0) {
            const filtered = filterVerbsByGroups(allVerbs, parsed);
            setFilteredVerbs(filtered);
          }
        }
      } catch (e) {
        console.error('Error parsing saved verb group preferences:', e);
        // Default to all groups
        loadDefaultGroups();
      }
    } else {
      // If no preferences saved, default to all groups
      loadDefaultGroups();
    }
  }, [allVerbs.length, filterVerbsByGroups]);

  // Load default groups for first-time users
  const loadDefaultGroups = () => {
    const defaultGroups = ['1', '2', '3', '4']; // All verb groups
    setSelectedGroups(defaultGroups);
    
    // Apply filtering if verbs are loaded
    if (allVerbs.length > 0) {
      const filtered = filterVerbsByGroups(allVerbs, defaultGroups);
      setFilteredVerbs(filtered);
    }
  };

  useEffect(() => {
    const loadVerbs = async () => {
      try {
        // Initialize FrenchDataService with user ID
        await FrenchDataService.initialize(userId);
        
        // Force a refresh of the data cache
        await FrenchDataService.forceRefresh();
        
        // Wait a moment to ensure data is fully loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Load all verbs directly from the import
        const allVerbsRaw = await FrenchDataService.getAllVerbs();
        console.log(`VerbsPractice - loaded ${allVerbsRaw.length} verbs`);        
        console.log('FrenchDataService debug status:', FrenchDataService.debugGetCacheStatus());
        console.log('FrenchDataService verbs count report:', FrenchDataService.debugGetCacheStatus().verbCount);
        
        // EMERGENCY FALLBACK REMOVED: We now rely on proper data loading from JSON files and database
        if (allVerbsRaw.length < 1) {
          console.log('No verbs found in the data service. Please add verbs through the content manager.');
        }
        
        // Log detailed information about each verb to diagnose issues
        if (allVerbsRaw.length > 0) {
          console.log('Sample verbs (first 5):', allVerbsRaw.slice(0, 5));
          
          // Detailed check of each verb type
          let placeholderCount = 0;
          let validCount = 0;
          let missingEnglishCount = 0;
          let missingInfinitiveCount = 0;
          
          allVerbsRaw.forEach(verb => {
            // Check if this verb has placeholder values or actual content
            const hasPlaceholder = verb.english?.includes('verb') && !verb.english.includes('to ');
            const hasValidEnglish = typeof verb.english === 'string' && verb.english.includes('to ');
            const hasValidInfinitive = typeof verb.infinitive === 'string' && verb.infinitive.length > 1;
            
            if (hasPlaceholder) placeholderCount++;
            if (hasValidEnglish && hasValidInfinitive) validCount++;
            if (!hasValidEnglish) missingEnglishCount++;
            if (!hasValidInfinitive) missingInfinitiveCount++;
            
            // Log problematic verbs
            if (hasPlaceholder || !hasValidEnglish || !hasValidInfinitive) {
              console.log(`Problematic verb - ID: ${verb.id}, Infinitive: ${verb.infinitive}, English: ${verb.english}`);
              
              // Attempt to fix the verb inline
              if (!hasValidEnglish && verb.infinitive) {
                verb.english = `to ${verb.infinitive}`;
                console.log(`Fixed English for verb ${verb.id} to: ${verb.english}`);
              }
            }
          });
          
          console.log(`Verb analysis: Total=${allVerbsRaw.length}, Valid=${validCount}, Placeholders=${placeholderCount}, Missing English=${missingEnglishCount}, Missing Infinitive=${missingInfinitiveCount}`);
          
          // Store all verbs in state
          setAllVerbs(allVerbsRaw);
          setFilteredVerbs(allVerbsRaw);
        }
        
        if (allVerbsRaw.length > 0) {
          // Get the first verb from the data service
          let verb = FrenchDataService.getNextItem('verbs', userId);
          
          console.log("VerbsPractice - first verb:", verb);
          if (verb) {
            // Make sure verb has proper English translation
            if (!verb.english || !verb.english.startsWith('to ')) {
              verb.english = `to ${verb.infinitive || 'unknown'}`;
              console.log(`Fixed verb English translation to: ${verb.english}`);
            }
            
            // Log the verb structure before setting it
            console.log('Setting current verb with structure:', {
              id: verb.id,
              infinitive: verb.infinitive,
              english: verb.english,
              group: verb.group || '4',
              tense: verb.tense
            });
            
            setCurrentVerb(verb);
          } else {
            console.error("Failed to load verb from data service");
          }
        } else {
          console.error("No verbs available in data service");
        }
      } catch (err) {
        console.error("Error loading verbs:", err);
      }
    };
    
    loadVerbs();
  }, [userId, filterVerbsByGroups]);

  // Auto-focus current input
  const inputRefs = {
    je: React.useRef(null),
    tu: React.useRef(null),
    il: React.useRef(null),
    nous: React.useRef(null),
    vous: React.useRef(null),
    ils: React.useRef(null)
  };

  useEffect(() => {
    if (currentFocus < pronouns.length && inputRefs[pronouns[currentFocus]].current) {
      inputRefs[pronouns[currentFocus]].current.focus();
    }
  }, [currentFocus, pronouns]);

  const handleInputChange = (pronoun, value) => {
    setConjugations(prev => ({
      ...prev,
      [pronoun]: value
    }));
  };

  const handleKeyPress = (e, pronoun) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (showingResults) {
        // Move to next verb
        moveToNextVerb();
        return;
      }

      const currentIndex = pronouns.indexOf(pronoun);
      
      if (currentIndex < pronouns.length - 1) {
        // Copy current value to next input and move focus
        const nextPronoun = pronouns[currentIndex + 1];
        setConjugations(prev => ({
          ...prev,
          [nextPronoun]: conjugations[pronoun]
        }));
        setCurrentFocus(currentIndex + 1);
      } else {
        // Last input, submit the form
        handleSubmit();
      }
    }
  };

  // Add global keypress listener for Enter when showing results
  useEffect(() => {
    const handleGlobalKeyPress = (e) => {
      if (e.key === 'Enter' && showingResults) {
        e.preventDefault();
        moveToNextVerb();
      }
    };

    if (showingResults) {
      document.addEventListener('keydown', handleGlobalKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [showingResults]);

  const moveToNextVerb = () => {
    // Check if we have filtered verbs
    if (filteredVerbs.length === 0) {
      console.log("No filtered verbs available");
      return;
    }
    
    let nextVerb;
    
    // If filtered verbs are available, get a verb from the filtered list
    if (filteredVerbs.length > 0) {
      // Get a random verb from the filtered list
      const randomIndex = Math.floor(Math.random() * filteredVerbs.length);
      nextVerb = filteredVerbs[randomIndex];
      console.log(`Selected random verb from filtered group: ${nextVerb.infinitive} (Group: ${nextVerb.group || '4'})`);
    } else {
      // No filtered verbs, get next verb from FrenchDataService
      nextVerb = FrenchDataService.getNextItem('verbs', userId);
    }
    
    // Fix English translation if needed
    if (nextVerb && (!nextVerb.english || !nextVerb.english.startsWith('to '))) {
      console.log(`Fixing English for verb: ${nextVerb.id} - ${nextVerb.infinitive}`);
      nextVerb.english = `to ${nextVerb.infinitive || 'unknown'}`;
    }
    
    // Log the verb we're setting
    if (nextVerb) {
      console.log('Setting next verb:', {
        id: nextVerb.id,
        infinitive: nextVerb.infinitive,
        english: nextVerb.english,
        group: nextVerb.group || '4',
        tense: nextVerb.tense
      });
    }
    
    setCurrentVerb(nextVerb);
    
    // Reset all state
    setConjugations({
      je: '',
      tu: '',
      il: '',
      nous: '',
      vous: '',
      ils: ''
    });
    setCurrentFocus(0);
    setFeedback(null);
    setShowingResults(false);
  };

  const handleSubmit = () => {
    // No validation required - allow submission with empty fields
    if (!currentVerb) return;

    // Check each conjugation if provided
    const results = {};
    let correctCount = 0;
    let attemptedCount = 0;
    
    pronouns.forEach(pronoun => {
      const userAnswer = conjugations[pronoun].trim();
      
      // Skip empty fields
      if (!userAnswer) {
        results[pronoun] = {
          skipped: true,
          correctAnswers: currentVerb.conjugations[pronoun]
        };
        return;
      }
      
      attemptedCount++;
      const normalizedUserAnswer = removeAccents(userAnswer.toLowerCase());
      const correctAnswers = currentVerb.conjugations[pronoun].map(answer => removeAccents(answer.toLowerCase()));
      const isCorrect = correctAnswers.includes(normalizedUserAnswer);
      
      results[pronoun] = {
        isCorrect,
        userAnswer,
        correctAnswers: currentVerb.conjugations[pronoun],
        skipped: false
      };
      
      if (isCorrect) correctCount++;
    });

    // Mark this verb as seen in the progress tracking system
    if (currentVerb && currentVerb.id) {
      FrenchDataService.markItemAsSeen('verbs', currentVerb.id, userId);
    }

    setFeedback(results);
    
    // Only count as correct if all attempted answers were correct
    const allCorrect = correctCount === attemptedCount && attemptedCount > 0;
    
    setScore(prev => ({
      correct: prev.correct + (allCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    
    setShowingResults(true);
  };

  if (!currentVerb) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Verbs Practice
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Conjugate French verbs in all forms
        </p>
      </div>

      <ScoreBoard score={score} />
      
      {/* Verb Group Filter with Checkboxes */}
      <div className="mb-4">
        <VerbGroupFilterWithCheckboxes 
          onFilterChange={handleGroupsChange}
          selectedGroups={selectedGroups}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
            Conjugate this verb:
          </h2>
          <div className="flex items-center justify-center mb-2">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {(() => {
                // Make sure we have an English translation starting with 'to '
                const englishTrans = typeof currentVerb.english === 'string' && 
                  currentVerb.english.startsWith('to ') ? 
                  currentVerb.english : 
                  `to ${currentVerb.infinitive || 'unknown'}`;
                
                // Store the fixed value back to the verb object
                if (currentVerb.english !== englishTrans) {
                  currentVerb.english = englishTrans;
                }
                
                return (
                  <>
                    {englishTrans}
                    {showFrench && (
                      <> — {currentVerb.infinitive}</>
                    )}
                  </>
                );
              })()}
            </div>
            <button 
              onClick={() => setShowFrench(!showFrench)}
              className="ml-3 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors duration-200"
            >
              {showFrench ? 'Hide French' : 'Show French'}
            </button>
          </div>
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Tense: {currentVerb.tense}
          </div>
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">
            You can leave fields blank and still submit your answers.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {pronouns.map((pronoun, index) => (
            <div key={pronoun} className="flex items-center space-x-4">
              <div className="w-20 text-right font-semibold text-gray-700 dark:text-gray-300">
                {pronounLabels[index]}
              </div>
              <div className="flex-1 relative">
                <input
                  ref={inputRefs[pronoun]}
                  type="text"
                  value={conjugations[pronoun]}
                  onChange={(e) => handleInputChange(pronoun, e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, pronoun)}
                  placeholder={showingResults ? 'Press Enter to continue...' : 'Enter conjugation...'}
                  className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    feedback && feedback[pronoun] && !feedback[pronoun].skipped 
                      ? feedback[pronoun].isCorrect 
                        ? 'border-green-500 dark:border-green-400' 
                        : 'border-red-500 dark:border-red-400'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={showingResults}
                />
                {feedback && feedback[pronoun] && (
                  <div className={`mt-2 text-sm ${
                    feedback[pronoun].skipped
                      ? 'text-gray-500 dark:text-gray-400'
                      : feedback[pronoun].isCorrect 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {feedback[pronoun].skipped 
                      ? `Correct: ${feedback[pronoun].correctAnswers.join(' or ')}`
                      : feedback[pronoun].isCorrect 
                        ? '✓ Correct!' 
                        : `✗ Correct: ${feedback[pronoun].correctAnswers.join(' or ')}`
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="flex gap-4 justify-center">
            <button
              onClick={showingResults ? moveToNextVerb : handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              {showingResults ? 'Next Verb' : 'Submit Conjugations'}
            </button>
            <button
              type="button"
              onClick={moveToNextVerb}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => setShowProgress(!showProgress)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {showProgress ? 'Hide Progress' : 'Show Progress'}
            </button>
          </div>
        </div>

        {showingResults && (
          <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
            Press Enter in any field or click Next Verb to get a new verb
          </div>
        )}
      </div>

      {showProgress && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 text-center">
            Your Verb Learning Progress
          </h2>
          <div className="mb-4">
            <VerbProgressTracker userId={userId} />
          </div>
        </div>
      )}
    </div>
  );
};

// Custom component to display verb learning progress
const VerbProgressTracker = ({ userId }) => {
  const [progress, setProgress] = useState({ seen: 0, total: 0, percentage: 0 });
  
  useEffect(() => {
    const loadProgress = async () => {
      // Get total number of verbs available
      const verbs = await FrenchDataService.getAllVerbs();
      const totalVerbs = verbs.length;
      
      // Get the seen verbs from local storage
      try {
        const seenKey = `user_${userId}_french-learning-verbs-seen`;
        const storedIds = localStorage.getItem(seenKey);
        const seenCount = storedIds ? JSON.parse(storedIds).length : 0;
        const percentage = totalVerbs > 0 ? Math.round((seenCount / totalVerbs) * 100) : 0;
        
        setProgress({
          seen: seenCount,
          total: totalVerbs,
          percentage
        });
      } catch (e) {
        console.error('Error calculating verb progress', e);
      }
    };
    
    loadProgress();
  }, [userId]);
  
  return (
    <div className="text-center">
      <div className="text-4xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">
        {progress.percentage}%
      </div>
      <div className="text-lg text-gray-700 dark:text-gray-300 mb-4">
        You've learned <span className="font-bold text-indigo-600 dark:text-indigo-400">{progress.seen}</span> out of <span className="font-bold">{progress.total}</span> verbs
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6">
        <div 
          className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress.percentage}%` }}
        ></div>
      </div>
      {progress.percentage === 100 && (
        <div className="text-green-600 dark:text-green-400 font-bold text-lg">
          Congratulations! You've learned all available verbs!
        </div>
      )}
    </div>
  );
};

export default VerbsPractice;