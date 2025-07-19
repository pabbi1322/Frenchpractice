import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FrenchDataService from '../services/FrenchDataService';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import CategoryFilter from './CategoryFilter';
import './FrenchPracticePage.css'; // We'll use this for any custom styles

function FrenchPracticePage() {
  // Get user ID from auth context for content tracking
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  
  // State for content type selection
  const [currentType, setCurrentType] = useState('words');
  
  // State for current content items and indices
  const [content, setContent] = useState({
    words: [],
    verbs: [],
    sentences: [],
    numbers: [],
    currentWordIndex: 0,
    currentVerbIndex: 0,
    currentSentenceIndex: 0,
    currentNumberIndex: 0
  });
  
  // State for showing answers
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Debug state
  const [debug, setDebug] = useState({
    visible: false,
    status: {},
    loading: false
  });
  
  // State for tracking background loading
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  
  // State for category filtering
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filteredWords, setFilteredWords] = useState([]);
  
  // Local storage key for saving category preferences
  const CATEGORY_PREFERENCES_KEY = 'french-learning-category-preferences';
  
  // Import ContentContext
  const { words, verbs, sentences, loadingStatus, loadAllContentData } = useContent();
  
  // Load saved category preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem(CATEGORY_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        if (Array.isArray(parsed)) {
          setSelectedCategories(parsed);
        }
      } catch (e) {
        console.error('Error parsing saved category preferences:', e);
        setSelectedCategories(['general', 'vocabulary']); // Default to standard categories
      }
    } else {
      // Default to all categories if no saved preferences
      setSelectedCategories(['general', 'vocabulary']);
    }
  }, []);
  
  // Initialize the practice page with the data from ContentContext on component mount
  useEffect(() => {
    console.log('FrenchPracticePage: Initializing with data from ContentContext');
    initializePracticeContent();
  }, [words, verbs, sentences]); // Re-run when content data changes
  
  // Filter words based on selected categories
  useEffect(() => {
    if (content.words && content.words.length > 0) {
      filterWordsByCategories();
    }
  }, [content.words, selectedCategories]);
  
  // Filter words by selected categories
  const filterWordsByCategories = () => {
    // If no categories selected, don't filter
    if (selectedCategories.length === 0) {
      setFilteredWords([]);
      return;
    }
    
    const filtered = content.words.filter(word => {
      // Include word if its category is in the selected categories
      return selectedCategories.includes(word.category || 'general');
    });
    
    setFilteredWords(filtered);
    console.log(`FrenchPracticePage: Filtered words - ${filtered.length} words match selected categories`);
    
    // Reset word index if the current word is no longer in the filtered set
    if (filtered.length > 0 && content.currentWordIndex >= filtered.length) {
      setContent(prev => ({
        ...prev,
        currentWordIndex: 0
      }));
    }
  };
  
  // Handle category filter changes
  const handleCategoryFilterChange = (newSelectedCategories) => {
    setSelectedCategories(newSelectedCategories);
    // Save preferences to localStorage
    localStorage.setItem(CATEGORY_PREFERENCES_KEY, JSON.stringify(newSelectedCategories));
  };
  
  // Function to initialize the content state with data from ContentContext
  const initializePracticeContent = () => {
    try {
      console.log('FrenchPracticePage: Setting up practice with ContentContext data:', {
        words: words.length,
        verbs: verbs.length,
        sentences: sentences.length
      });
      
      // Filter numbers from words array
      const wordsOnly = words.filter(w => w.category !== 'number');
      const numbersOnly = words.filter(w => w.category === 'number');
      
      // Update content state with data from ContentContext
      setContent(prev => ({
        ...prev,
        words: wordsOnly,
        verbs: verbs,
        sentences: sentences,
        numbers: numbersOnly
      }));
      
      // Get debug status
      const status = FrenchDataService.debugGetCacheStatus();
      setDebug(prev => ({ 
        ...prev, 
        status,
        loading: false 
      }));
      
      // Set background loading based on ContentContext loading status
      setBackgroundLoading(loadingStatus.anyLoading);
    } catch (error) {
      console.error('Error initializing practice content:', error);
      setDebug(prev => ({ ...prev, loading: false }));
    }
  };
  
  // This function is now handled by ContentContext's loadAllContentData
  // and our handleForceReload function
  
  // Function to move to the next item
  const nextItem = () => {
    setShowAnswer(false);
    
    // Update index based on current type
    switch(currentType) {
      case 'words':
        // If we're filtering by categories, use the filtered words
        if (selectedCategories.length > 0 && filteredWords.length > 0) {
          const nextWordIndex = (content.currentWordIndex + 1) % filteredWords.length;
          setContent(prev => ({ ...prev, currentWordIndex: nextWordIndex }));
          
          // Mark as seen for progress tracking
          const currentWord = filteredWords[content.currentWordIndex];
          FrenchDataService.markItemAsSeen('words', currentWord.id, userId);
        } else {
          // Otherwise use all words
          const nextWordIndex = (content.currentWordIndex + 1) % content.words.length;
          setContent(prev => ({ ...prev, currentWordIndex: nextWordIndex }));
          
          // Mark as seen for progress tracking
          if (content.words.length > 0) {
            const currentWord = content.words[content.currentWordIndex];
            FrenchDataService.markItemAsSeen('words', currentWord.id, userId);
          }
        }
        break;
        
      case 'verbs':
        const nextVerbIndex = (content.currentVerbIndex + 1) % content.verbs.length;
        setContent(prev => ({ ...prev, currentVerbIndex: nextVerbIndex }));
        
        // Mark as seen for progress tracking
        if (content.verbs.length > 0) {
          const currentVerb = content.verbs[content.currentVerbIndex];
          FrenchDataService.markItemAsSeen('verbs', currentVerb.id, userId);
        }
        break;
        
      case 'sentences':
        const nextSentenceIndex = (content.currentSentenceIndex + 1) % content.sentences.length;
        setContent(prev => ({ ...prev, currentSentenceIndex: nextSentenceIndex }));
        
        // Mark as seen for progress tracking
        if (content.sentences.length > 0) {
          const currentSentence = content.sentences[content.currentSentenceIndex];
          FrenchDataService.markItemAsSeen('sentences', currentSentence.id, userId);
        }
        break;
        
      case 'numbers':
        const nextNumberIndex = (content.currentNumberIndex + 1) % content.numbers.length;
        setContent(prev => ({ ...prev, currentNumberIndex: nextNumberIndex }));
        
        // Mark as seen for progress tracking
        if (content.numbers.length > 0) {
          const currentNumber = content.numbers[content.currentNumberIndex];
          FrenchDataService.markItemAsSeen('words', currentNumber.id, userId);
        }
        break;
        
      default:
        break;
    }
  };
  
  // Force reload content using ContentContext's loadAllContentData
  const handleForceReload = async () => {
    setDebug(prev => ({ ...prev, loading: true }));
    try {
      console.log('FrenchPracticePage: Manually reloading all content...');
      await loadAllContentData();
      
      // Re-initialize practice content with refreshed data
      initializePracticeContent();
      
      alert(`Content reloaded successfully!`);
    } catch (error) {
      console.error('Error during manual content reload:', error);
      alert('Error reloading content. See console for details.');
    } finally {
      setDebug(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Get current item based on type
  const getCurrentItem = () => {
    switch(currentType) {
      case 'words':
        // If we're filtering by categories, use the filtered words
        if (selectedCategories.length > 0 && filteredWords.length > 0) {
          return filteredWords.length > 0 ? filteredWords[content.currentWordIndex] : null;
        } else {
          return content.words.length > 0 ? content.words[content.currentWordIndex] : null;
        }
      case 'verbs':
        return content.verbs.length > 0 ? content.verbs[content.currentVerbIndex] : null;
      case 'sentences':
        return content.sentences.length > 0 ? content.sentences[content.currentSentenceIndex] : null;
      case 'numbers':
        return content.numbers.length > 0 ? content.numbers[content.currentNumberIndex] : null;
      default:
        return null;
    }
  };
  
  // Get current progress
  const getProgress = () => {
    switch(currentType) {
      case 'words':
        // If we're filtering by categories, use the filtered words for progress
        if (selectedCategories.length > 0 && filteredWords.length > 0) {
          return {
            current: content.currentWordIndex + 1,
            total: filteredWords.length,
            percentage: filteredWords.length > 0 
              ? ((content.currentWordIndex + 1) / filteredWords.length) * 100
              : 0
          };
        } else {
          return {
            current: content.currentWordIndex + 1,
            total: content.words.length,
            percentage: content.words.length > 0 
              ? ((content.currentWordIndex + 1) / content.words.length) * 100
              : 0
          };
        }
      case 'verbs':
        return {
          current: content.currentVerbIndex + 1,
          total: content.verbs.length,
          percentage: content.verbs.length > 0 
            ? ((content.currentVerbIndex + 1) / content.verbs.length) * 100
            : 0
        };
      case 'sentences':
        return {
          current: content.currentSentenceIndex + 1,
          total: content.sentences.length,
          percentage: content.sentences.length > 0 
            ? ((content.currentSentenceIndex + 1) / content.sentences.length) * 100
            : 0
        };
      case 'numbers':
        return {
          current: content.currentNumberIndex + 1,
          total: content.numbers.length,
          percentage: content.numbers.length > 0 
            ? ((content.currentNumberIndex + 1) / content.numbers.length) * 100
            : 0
        };
      default:
        return { current: 0, total: 0, percentage: 0 };
    }
  };
  
  // Render the current item
  const renderCurrentItem = () => {
    const currentItem = getCurrentItem();
    
    if (!currentItem) {
      return (
        <div className="alert alert-warning">
          No content available. Please try reloading.
        </div>
      );
    }
    
    switch(currentType) {
      case 'words':
        return (
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h4>Word Practice</h4>
            </div>
            <div className="card-body">
              <h5 className="card-title">{currentItem.english}</h5>
              
              {/* Hint removed as per user request */}
              
              {showAnswer && (
                <>
                  <hr />
                  <div className="answer-section">
                    <h5 className="text-success">French Translation:</h5>
                    <p className="french-text">{currentItem.french.join(', ')}</p>
                    
                    {/* Explanation removed as per user request */}
                  </div>
                </>
              )}
            </div>
          </div>
        );
        
      case 'verbs':
        return (
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h4>Verb Practice</h4>
            </div>
            <div className="card-body">
              <h5 className="card-title">{currentItem.infinitive} ({currentItem.english})</h5>
              <p className="text-muted">Tense: {currentItem.tense || 'present'}</p>
              
              {showAnswer && (
                <>
                  <hr />
                  <div className="answer-section">
                    <h5 className="text-success">Conjugations:</h5>
                    <div className="table-responsive">
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Conjugation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(currentItem.conjugations || {}).map(([subject, forms]) => (
                            <tr key={subject}>
                              <td>{subject}</td>
                              <td>{forms.join(', ')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
        
      case 'sentences':
        return (
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h4>Sentence Practice</h4>
            </div>
            <div className="card-body">
              <h5 className="card-title">{currentItem.english}</h5>
              
              {showAnswer && (
                <>
                  <hr />
                  <div className="answer-section">
                    <h5 className="text-success">French Translation:</h5>
                    <p className="french-text">{currentItem.french.join('\n')}</p>
                    
                    {/* Explanation removed as per user request */}
                  </div>
                </>
              )}
            </div>
          </div>
        );
        
      case 'numbers':
        return (
          <div className="card mb-4">
            <div className="card-header bg-warning text-dark">
              <h4>Number Practice</h4>
            </div>
            <div className="card-body">
              <h5 className="card-title">{currentItem.english}</h5>
              
              {showAnswer && (
                <>
                  <hr />
                  <div className="answer-section">
                    <h5 className="text-success">French Translation:</h5>
                    <p className="french-text">{currentItem.french.join(', ')}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  const progress = getProgress();
  
  return (
    <div className="container my-4">
      <h2 className="text-center mb-4">French Learning Practice</h2>
      
      {/* Content Loading Status with Background Loading Indicator */}
      <div className="alert alert-info mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong>Content Loading Status</strong>
          <div className="d-flex align-items-center">
            {backgroundLoading && (
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
            <button 
              className="btn btn-sm btn-outline-dark" 
              onClick={() => setDebug(prev => ({ ...prev, visible: !prev.visible }))}
            >
              {debug.visible ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-3">
            <small>Words loaded: {content.words.length} (Expected: 40)</small>
          </div>
          <div className="col-md-3">
            <small>Verbs loaded: {content.verbs.length} (Expected: 20)</small>
          </div>
          <div className="col-md-3">
            <small>Sentences loaded: {content.sentences.length} (Expected: 50)</small>
          </div>
          <div className="col-md-3">
            <small>Numbers loaded: {content.numbers.length} (Expected: 40)</small>
          </div>
        </div>
        
        {debug.visible && (
          <div className="mt-2 border-top pt-2">
            <h6>Cache Status:</h6>
            <pre className="bg-light p-2 small">
              {JSON.stringify(debug.status, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {/* Content Type Selector and Reload Button */}
      <div className="d-flex flex-wrap justify-content-between mb-4">
        <div className="btn-group">
          <button
            className={`btn ${currentType === 'words' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCurrentType('words')}
          >
            Words ({selectedCategories.length > 0 && filteredWords.length > 0 ? filteredWords.length : content.words.filter(w => w.category !== 'number').length || 0})
          </button>
          <button
            className={`btn ${currentType === 'verbs' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCurrentType('verbs')}
          >
            Verbs ({content.verbs.length || 0})
          </button>
          <button
            className={`btn ${currentType === 'sentences' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCurrentType('sentences')}
          >
            Sentences ({content.sentences.length || 0})
          </button>
          <button
            className={`btn ${currentType === 'numbers' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setCurrentType('numbers')}
          >
            Numbers ({content.numbers.length || 0})
          </button>
        </div>
        
        <button
          className="btn btn-warning d-flex align-items-center"
          onClick={handleForceReload}
          disabled={debug.loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          Force Reload Content
        </button>
      </div>
      
      {/* Display CategoryFilter only when in words mode */}
      {currentType === 'words' && (
        <div className="mb-4">
          <CategoryFilter
            onFilterChange={handleCategoryFilterChange}
            selectedCategories={selectedCategories}
          />
          
          {filteredWords.length > 0 && (
            <div className="alert alert-info">
              <small>
                Showing {filteredWords.length} words from selected categories
                {filteredWords.length !== content.words.length && 
                  ` (out of ${content.words.length} total words)`}
              </small>
            </div>
          )}
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="progress mb-4" style={{ height: '20px' }}>
        <div
          className="progress-bar"
          role="progressbar"
          style={{ width: `${progress.percentage}%` }}
          aria-valuenow={progress.current}
          aria-valuemin="0"
          aria-valuemax={progress.total}
        >
          {`${progress.current} / ${progress.total} (${Math.round(progress.percentage)}%)`}
        </div>
      </div>
      
      {/* Main Content Card */}
      {renderCurrentItem()}
      
      {/* Action Buttons */}
      <div className="d-flex justify-content-between">
        <button
          className="btn btn-secondary"
          onClick={() => setShowAnswer(!showAnswer)}
        >
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </button>
        
        <button
          className="btn btn-primary"
          onClick={nextItem}
        >
          Next {currentType === 'words' ? 'Word' : currentType === 'verbs' ? 'Verb' : 'Sentence'}
          <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
      
      {/* Back to Dashboard Link */}
      <div className="text-center mt-4">
        <Link to="/dashboard" className="btn btn-link">
          <i className="bi bi-arrow-left"></i> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default FrenchPracticePage;