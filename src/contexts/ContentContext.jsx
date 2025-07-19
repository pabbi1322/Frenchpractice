// ContentContext.jsx
// Context for managing content state across components
import React, { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import FrenchDataService from '../services/FrenchDataService';
import indexedDBService from '../services/IndexedDBService';

// Import store constants from FrenchDataService
const STORE_WORDS = 'words';
const STORE_VERBS = 'verbs';
const STORE_SENTENCES = 'sentences';
const STORE_NUMBERS = 'numbers';
const STORE_USER_DATA = 'userData';

// Generate a unique ID without external dependencies
const generateUniqueId = () => {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

import { useAuth } from './AuthContext';

// Create context
const ContentContext = createContext();

// Custom hook to use the content context
export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

// Provider component
export const ContentProvider = ({ children }) => {
  const [words, setWords] = useState([]);
  const [sentences, setSentences] = useState([]);
  const [verbs, setVerbs] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState({
    initialLoad: true,
    words: true,
    sentences: true,
    verbs: true,
    numbers: true,
    anyLoading: true
  });
  const loading = loadingStatus.anyLoading; // For backwards compatibility
  const { user } = useAuth();

  useEffect(() => {
    // Function to update the loading status and check if any content is still loading
    const updateLoadingStatus = (type, isLoading) => {
      setLoadingStatus(prev => {
        const updated = { ...prev, [type]: isLoading };
        updated.anyLoading = updated.words || updated.sentences || updated.verbs || updated.numbers;
        return updated;
      });
    };

    // Initialize database connections and load ALL content on component mount
    const initDatabasesAndLoadAllContent = async () => {
      console.log('ContentContext: Starting database initialization and full content loading...');
      updateLoadingStatus('initialLoad', true);
      
      try {
        // Initialize databases
        console.log('ContentContext: Initializing IndexedDB directly');
        await indexedDBService.initialize();
        
        const userId = user?.email || null;
        console.log(`ContentContext: Initializing FrenchDataService with userId: ${userId}`);
        await FrenchDataService.initialize(userId);
        
        try {
          const dbStatus = await indexedDBService.getStatus();
          console.log('ContentContext: IndexedDB status:', dbStatus);
        } catch (statusError) {
          console.error('Failed to get IndexedDB status:', statusError);
        }
        
        // Load all content immediately instead of just samples
        console.log('ContentContext: Loading ALL content on app initialization');
        
        // Start loading words
        updateLoadingStatus('words', true);
        try {
          console.log('ContentContext: Loading all words');
          let wordsData = [];
          
          try {
            wordsData = await indexedDBService.getAllData('words');
            console.log(`ContentContext: Loaded ${wordsData.length} words from IndexedDB`);
          } catch (dbError) {
            console.error('Failed to load words directly from IndexedDB:', dbError);
            // Fall back to FrenchDataService
            try {
              console.log('ContentContext: Falling back to FrenchDataService.getAllWords()');
              wordsData = await FrenchDataService.getAllWords();
              console.log(`ContentContext: Loaded ${wordsData.length} words from FrenchDataService`);
            } catch (serviceError) {
              console.error('Failed to load words from FrenchDataService:', serviceError);
              wordsData = [];
            }
          }
          
          // Mark predefined data
          const markedWords = wordsData.map(word => ({ 
            ...word, 
            isPredefined: word.isPredefined !== undefined ? word.isPredefined : true 
          }));
          
          setWords(markedWords);
          console.log(`ContentContext: Set ${markedWords.length} words in state`);
        } catch (error) {
          console.error('Error loading words:', error);
          setWords([]);
        } finally {
          updateLoadingStatus('words', false);
        }
        
        // Load all sentences
        updateLoadingStatus('sentences', true);
        try {
          console.log('ContentContext: Loading all sentences');
          let sentencesData = [];
          try {
            sentencesData = await FrenchDataService.getAllSentences();
            console.log(`ContentContext: Loaded ${sentencesData.length} sentences`);
          } catch (error) {
            console.error('Failed to load sentences:', error);
            sentencesData = [];
          }
          
          // Mark predefined data
          const markedSentences = sentencesData.map(sentence => ({ 
            ...sentence, 
            isPredefined: sentence.isPredefined !== undefined ? sentence.isPredefined : true 
          }));
          
          setSentences(markedSentences);
          console.log(`ContentContext: Set ${markedSentences.length} sentences in state`);
        } catch (error) {
          console.error('Error loading sentences:', error);
          setSentences([]);
        } finally {
          updateLoadingStatus('sentences', false);
        }
        
        // Load all verbs
        updateLoadingStatus('verbs', true);
        try {
          console.log('ContentContext: Loading all verbs');
          let verbsData = [];
          try {
            verbsData = await FrenchDataService.getAllVerbs();
            console.log(`ContentContext: Loaded ${verbsData.length} verbs`);
          } catch (error) {
            console.error('Failed to load verbs:', error);
            verbsData = [];
          }
          
          // Mark predefined data
          const markedVerbs = verbsData.map(verb => ({ 
            ...verb, 
            isPredefined: verb.isPredefined !== undefined ? verb.isPredefined : true 
          }));
          
          setVerbs(markedVerbs);
          console.log(`ContentContext: Set ${markedVerbs.length} verbs in state`);
        } catch (error) {
          console.error('Error loading verbs:', error);
          setVerbs([]);
        } finally {
          updateLoadingStatus('verbs', false);
        }
        
        // Load all numbers
        updateLoadingStatus('numbers', true);
        try {
          console.log('ContentContext: Loading all numbers');
          let numbersData = [];
          try {
            numbersData = await FrenchDataService.getAllNumbers();
            console.log(`ContentContext: Loaded ${numbersData.length} numbers`);
          } catch (error) {
            console.error('Failed to load numbers:', error);
            numbersData = [];
          }
          
          // Mark predefined data
          const markedNumbers = numbersData.map(number => ({ 
            ...number, 
            isPredefined: number.isPredefined !== undefined ? number.isPredefined : true 
          }));
          
          setNumbers(markedNumbers);
          console.log(`ContentContext: Set ${markedNumbers.length} numbers in state`);
        } catch (error) {
          console.error('Error loading numbers:', error);
          setNumbers([]);
        } finally {
          updateLoadingStatus('numbers', false);
        }
        
      } catch (error) {
        console.error('Database initialization or content loading error:', error);
      } finally {
        updateLoadingStatus('initialLoad', false);
        console.log('ContentContext: Completed initial content loading');
      }
    };
    
    // Initialize databases and load all content on mount
    initDatabasesAndLoadAllContent();
    
    // Define the manual content reload function for the refresh button
    window.loadAllContent = async () => {
      console.log('ContentContext: Starting manual content reload...');
      updateLoadingStatus('initialLoad', true);
      
      // Load words
      updateLoadingStatus('words', true);
      try {
        console.log('ContentContext: Reloading all words');
        let wordsData = [];
        
        try {
          // Force refresh data first
          await FrenchDataService.forceRefresh();
          
          wordsData = await indexedDBService.getAllData('words');
          console.log(`ContentContext: Reloaded ${wordsData.length} words from IndexedDB`);
        } catch (dbError) {
          console.error('Failed to reload words directly from IndexedDB:', dbError);
          // Fall back to FrenchDataService
          try {
            console.log('ContentContext: Falling back to FrenchDataService.getAllWords()');
            wordsData = await FrenchDataService.getAllWords();
            console.log(`ContentContext: Reloaded ${wordsData.length} words from FrenchDataService`);
          } catch (serviceError) {
            console.error('Failed to reload words from FrenchDataService:', serviceError);
          }
        }
        
        // Mark predefined data
        const markedWords = wordsData.map(word => ({ 
          ...word, 
          isPredefined: word.isPredefined !== undefined ? word.isPredefined : true 
        }));
        
        setWords(markedWords);
      } catch (error) {
        console.error('Error reloading words:', error);
      } finally {
        updateLoadingStatus('words', false);
      }
      
      // Load sentences
      updateLoadingStatus('sentences', true);
      try {
        console.log('ContentContext: Reloading all sentences');
        let sentencesData = [];
        try {
          sentencesData = await FrenchDataService.getAllSentences();
          console.log(`ContentContext: Reloaded ${sentencesData.length} sentences`);
        } catch (error) {
          console.error('Failed to reload sentences:', error);
        }
        
        // Mark predefined data
        const markedSentences = sentencesData.map(sentence => ({ 
          ...sentence, 
          isPredefined: sentence.isPredefined !== undefined ? sentence.isPredefined : true 
        }));
        
        setSentences(markedSentences);
      } catch (error) {
        console.error('Error reloading sentences:', error);
      } finally {
        updateLoadingStatus('sentences', false);
      }
      
      // Load verbs
      updateLoadingStatus('verbs', true);
      try {
        console.log('ContentContext: Reloading all verbs');
        let verbsData = [];
        try {
          verbsData = await FrenchDataService.getAllVerbs();
          console.log(`ContentContext: Reloaded ${verbsData.length} verbs`);
        } catch (error) {
          console.error('Failed to reload verbs:', error);
        }
        
        // Mark predefined data
        const markedVerbs = verbsData.map(verb => ({ 
          ...verb, 
          isPredefined: verb.isPredefined !== undefined ? verb.isPredefined : true 
        }));
        
        setVerbs(markedVerbs);
      } catch (error) {
        console.error('Error reloading verbs:', error);
      } finally {
        updateLoadingStatus('verbs', false);
      }
      
      // Load numbers
      updateLoadingStatus('numbers', true);
      try {
        console.log('ContentContext: Reloading all numbers');
        let numbersData = [];
        try {
          numbersData = await FrenchDataService.getAllNumbers();
          console.log(`ContentContext: Reloaded ${numbersData.length} numbers`);
        } catch (error) {
          console.error('Failed to reload numbers:', error);
        }
        
        // Mark predefined data
        const markedNumbers = numbersData.map(number => ({ 
          ...number, 
          isPredefined: number.isPredefined !== undefined ? number.isPredefined : true 
        }));
        
        setNumbers(markedNumbers);
      } catch (error) {
        console.error('Error reloading numbers:', error);
      } finally {
        updateLoadingStatus('numbers', false);
      }
      
      // Mark overall loading as complete
      updateLoadingStatus('initialLoad', false);
      console.log('ContentContext: Manual content reload complete');
      
      return {
        wordCount: words.length,
        verbCount: verbs.length,
        sentenceCount: sentences.length,
        numberCount: numbers.length
      };
    };
    
    // No periodic refresh - only manual refresh will be allowed
    
    // Return empty cleanup function
    return () => {};
  }, [user]); // Only re-run when user changes

  // Helper to load user content from localStorage
  const loadUserContent = () => {
    if (!user) {
      return { words: [], sentences: [], verbs: [] };
    }
    
    try {
      const userContentKey = `french-learning-user-content-${user.email}`;
      const savedContent = localStorage.getItem(userContentKey);
      
      if (savedContent) {
        return JSON.parse(savedContent);
      }
    } catch (error) {
      console.error('Error loading user content from localStorage:', error);
    }
    
    return { words: [], sentences: [], verbs: [] };
  };

  // Helper to save user content to localStorage
  const saveUserContent = (newWords, newSentences, newVerbs) => {
    if (!user) {
      return;
    }
    
    try {
      // Filter out predefined content
      const userWords = newWords.filter(word => !word.isPredefined);
      const userSentences = newSentences.filter(sentence => !sentence.isPredefined);
      const userVerbs = newVerbs.filter(verb => !verb.isPredefined);
      
      const userContentKey = `french-learning-user-content-${user.email}`;
      const contentToSave = { words: userWords, sentences: userSentences, verbs: userVerbs };
      
      localStorage.setItem(userContentKey, JSON.stringify(contentToSave));
    } catch (error) {
      console.error('Error saving user content to localStorage:', error);
    }
  };

  // Create a timestamp string for new items
  const getCurrentTimestamp = () => {
    return new Date().toISOString();
  };

  // -------------------- Word Management --------------------
  const addWord = async (wordData) => {
    try {
      console.log('ContentContext: Adding word with data:', JSON.stringify(wordData));
      
      // Ensure wordData is valid
      if (!wordData) {
        console.error('ContentContext: wordData is null or undefined');
        return { success: false, error: 'Invalid word data: data is missing.' };
      }
      
      // Check required properties
      if (!wordData.french) {
        console.error('ContentContext: wordData.french is missing');
        return { success: false, error: 'Invalid word data: French word is required.' };
      }
      
      if (!wordData.english) {
        console.error('ContentContext: wordData.english is missing');
        return { success: false, error: 'Invalid word data: English translation is required.' };
      }
      
      // Check if word already exists, safely handling both string and array formats
      console.log('ContentContext: Checking for duplicate words...');
      const existingWord = words.find(w => {
        try {
          // Get French from wordData, which might be an array or string
          let newFrench = wordData.french;
          if (Array.isArray(newFrench)) {
            console.log('ContentContext: newFrench is an array:', newFrench);
            newFrench = newFrench[0] || '';
          }
          
          // Get French from existing word, which might be an array or string
          let existingFrench = w.french;
          if (Array.isArray(existingFrench)) {
            console.log('ContentContext: existingFrench is an array:', existingFrench);
            existingFrench = existingFrench[0] || '';
          } else if (typeof existingFrench !== 'string') {
            console.log('ContentContext: existingFrench is not a string or array:', typeof existingFrench);
            return false; // Skip invalid entries
          }
          
          const matches = existingFrench.toLowerCase() === newFrench.toLowerCase();
          if (matches) {
            console.log('ContentContext: Found duplicate word:', existingFrench);
          }
          return matches;
        } catch (err) {
          console.error("Error comparing French words:", err, { existing: w, new: wordData });
          return false;
        }
      });
      
      if (existingWord) {
        console.log('ContentContext: Duplicate word found:', existingWord);
        return { success: false, error: 'A word with this French spelling already exists.' };
      }
      
      // Create new word with ID and timestamps
      const timestamp = getCurrentTimestamp();
      const newWord = {
        ...wordData,
        id: generateUniqueId(),
        createdBy: user?.email || 'anonymous',
        createdAt: timestamp,
        updatedAt: timestamp,
        isPredefined: false
      };
      console.log('ContentContext: Prepared new word object:', JSON.stringify(newWord));
      
      // Initialize IndexedDB if it hasn't been already
      if (!indexedDBService.isInitialized) {
        console.log('ContentContext: Initializing IndexedDB before adding word');
        await indexedDBService.initialize();
      }
      
      // Use direct database access to ensure proper persistence
      console.log('ContentContext: Using direct IndexedDBService.addData call for reliable persistence');
      const addResult = await indexedDBService.addData('words', newWord);
      console.log('ContentContext: IndexedDBService.addData result:', addResult);
      
      // Then also call FrenchDataService to maintain cache consistency
      console.log('ContentContext: Also calling FrenchDataService.addUserWord for cache consistency');
      const fdsResult = await FrenchDataService.addUserWord(newWord);
      console.log('ContentContext: FrenchDataService.addUserWord result:', fdsResult);
      
      // Consider the operation successful if either method worked
      const success = !!addResult || fdsResult;
      
      if (success) {
        console.log('ContentContext: Successfully added word to database');
        
        // Update local state
        console.log('ContentContext: Updating local state with new word');
        setWords(prevWords => [...prevWords, newWord]);
        
        // Force refresh all data to ensure consistency
        console.log('ContentContext: Forcing cache refresh to ensure data consistency');
        setTimeout(() => {
          FrenchDataService.forceRefresh().then(() => {
            console.log('ContentContext: Data cache refreshed successfully');
          });
        }, 500); // Short delay to ensure transaction completes
        
        return { success: true };
      } else {
        console.error('ContentContext: Failed to save word to database');
        return { success: false, error: 'Failed to save word to database.' };
      }
    } catch (error) {
      console.error('ContentContext: Error adding word:', error);
      return { success: false, error: `Failed to add word: ${error.message || 'Unknown error'}` };
    }
  };

  const updateWord = async (id, wordData) => {
    try {
      // Find the word to update
      const wordToUpdate = words.find(w => w.id === id);
      
      if (!wordToUpdate) {
        return { success: false, error: 'Word not found.' };
      }
      
      if (wordToUpdate.isPredefined) {
        return { success: false, error: 'Predefined words cannot be updated.' };
      }
      
      // Check if updated French word conflicts with another word
      const existingWord = words.find(w => {
        try {
          // Get French from wordData, which might be an array or string
          let newFrench = wordData.french;
          if (Array.isArray(newFrench)) {
            newFrench = newFrench[0] || '';
          }
          
          // Get French from existing word, which might be an array or string
          let existingFrench = w.french;
          if (Array.isArray(existingFrench)) {
            existingFrench = existingFrench[0] || '';
          } else if (typeof existingFrench !== 'string') {
            return false; // Skip invalid entries
          }
          
          return existingFrench.toLowerCase() === newFrench.toLowerCase() && w.id !== id;
        } catch (err) {
          console.error("Error comparing French words:", err, { existing: w, new: wordData });
          return false;
        }
      });
      
      if (existingWord) {
        return { success: false, error: 'Another word with this French spelling already exists.' };
      }
      
      // Update the word
      const updatedWord = {
        ...wordToUpdate,
        ...wordData,
        updatedAt: getCurrentTimestamp()
      };
      
      // Save to IndexedDB
      const success = await FrenchDataService.updateData(STORE_WORDS, updatedWord);
      
      if (success) {
        // Update local state
        const updatedWords = words.map(w => w.id === id ? updatedWord : w);
        setWords(updatedWords);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update word in database.' };
      }
    } catch (error) {
      console.error('Error updating word:', error);
      return { success: false, error: error.message || 'Failed to update word.' };
    }
  };

  const deleteWord = async (id) => {
    try {
      console.log("deleteWord called with id:", id);
      
      // Find the word to delete
      const wordToDelete = words.find(w => w.id === id);
      
      console.log("Word to delete:", wordToDelete);
      
      if (!wordToDelete) {
        console.log("deleteWord failed: Word not found");
        return { success: false, error: 'Word not found.' };
      }
      
      if (wordToDelete.isPredefined) {
        console.log("deleteWord failed: Word is predefined");
        return { success: false, error: 'Predefined words cannot be deleted.' };
      }
      
      // Delete from IndexedDB
      console.log("Calling FrenchDataService.deleteData for word:", id);
      const success = await FrenchDataService.deleteData(STORE_WORDS, id);
      console.log("FrenchDataService.deleteData result:", success);
      
      if (success) {
        // Update local state
        console.log("Updating local state after word deletion");
        const updatedWords = words.filter(w => w.id !== id);
        setWords(updatedWords);
        return { success: true };
      } else {
        console.log("deleteWord failed: Database operation failed");
        return { success: false, error: 'Failed to delete word from database.' };
      }
    } catch (error) {
      console.error('Error deleting word:', error);
      return { success: false, error: error.message || 'Failed to delete word.' };
    }
  };

  // -------------------- Sentence Management --------------------
  const addSentence = async (sentenceData) => {
    try {
      // Check if sentence already exists
      const existingSentence = sentences.find(s => {
        try {
          // Get French from sentenceData, which might be an array or string
          let newFrench = sentenceData.french;
          if (Array.isArray(newFrench)) {
            newFrench = newFrench[0] || '';
          }
          
          // Get French from existing sentence, which might be an array or string
          let existingFrench = s.french;
          if (Array.isArray(existingFrench)) {
            existingFrench = existingFrench[0] || '';
          } else if (typeof existingFrench !== 'string') {
            return false; // Skip invalid entries
          }
          
          return existingFrench.toLowerCase() === newFrench.toLowerCase();
        } catch (err) {
          console.error("Error comparing French sentences:", err, { existing: s, new: sentenceData });
          return false;
        }
      });
      
      if (existingSentence) {
        return { success: false, error: 'A sentence with this French text already exists.' };
      }
      
      // Create new sentence with ID and timestamps
      const timestamp = getCurrentTimestamp();
      const newSentence = {
        ...sentenceData,
        id: generateUniqueId(),
        createdBy: user?.email || 'anonymous',
        createdAt: timestamp,
        updatedAt: timestamp,
        isPredefined: false
      };
      
      // Save to IndexedDB using FrenchDataService
      const success = await FrenchDataService.addUserSentence(newSentence);
      
      if (success) {
        // Update local state
        setSentences(prevSentences => [...prevSentences, newSentence]);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to save sentence to database.' };
      }
    } catch (error) {
      console.error('Error adding sentence:', error);
      return { success: false, error: error.message || 'Failed to add sentence.' };
    }
  };

  const updateSentence = async (id, sentenceData) => {
    try {
      // Find the sentence to update
      const sentenceToUpdate = sentences.find(s => s.id === id);
      
      if (!sentenceToUpdate) {
        return { success: false, error: 'Sentence not found.' };
      }
      
      if (sentenceToUpdate.isPredefined) {
        return { success: false, error: 'Predefined sentences cannot be updated.' };
      }
      
      // Check if updated French sentence conflicts with another sentence
      const existingSentence = sentences.find(s => {
        try {
          // Get French from sentenceData, which might be an array or string
          let newFrench = sentenceData.french;
          if (Array.isArray(newFrench)) {
            newFrench = newFrench[0] || '';
          }
          
          // Get French from existing sentence, which might be an array or string
          let existingFrench = s.french;
          if (Array.isArray(existingFrench)) {
            existingFrench = existingFrench[0] || '';
          } else if (typeof existingFrench !== 'string') {
            return false; // Skip invalid entries
          }
          
          return existingFrench.toLowerCase() === newFrench.toLowerCase() && s.id !== id;
        } catch (err) {
          console.error("Error comparing French sentences:", err, { existing: s, new: sentenceData });
          return false;
        }
      });
      
      if (existingSentence) {
        return { success: false, error: 'Another sentence with this French text already exists.' };
      }
      
      // Update the sentence
      const updatedSentence = {
        ...sentenceToUpdate,
        ...sentenceData,
        updatedAt: getCurrentTimestamp()
      };
      
      // Save to IndexedDB
      const success = await FrenchDataService.updateData(STORE_SENTENCES, updatedSentence);
      
      if (success) {
        // Update local state
        const updatedSentences = sentences.map(s => s.id === id ? updatedSentence : s);
        setSentences(updatedSentences);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update sentence in database.' };
      }
    } catch (error) {
      console.error('Error updating sentence:', error);
      return { success: false, error: error.message || 'Failed to update sentence.' };
    }
  };

  const deleteSentence = async (id) => {
    try {
      console.log("deleteSentence called with id:", id);
      
      // Find the sentence to delete
      const sentenceToDelete = sentences.find(s => s.id === id);
      
      console.log("Sentence to delete:", sentenceToDelete);
      
      if (!sentenceToDelete) {
        console.log("deleteSentence failed: Sentence not found");
        return { success: false, error: 'Sentence not found.' };
      }
      
      if (sentenceToDelete.isPredefined) {
        console.log("deleteSentence failed: Sentence is predefined");
        return { success: false, error: 'Predefined sentences cannot be deleted.' };
      }
      
      // Delete from IndexedDB
      console.log("Calling FrenchDataService.deleteData for sentence:", id);
      const success = await FrenchDataService.deleteData(STORE_SENTENCES, id);
      console.log("FrenchDataService.deleteData result:", success);
      
      if (success) {
        // Update local state
        console.log("Updating local state after sentence deletion");
        const updatedSentences = sentences.filter(s => s.id !== id);
        setSentences(updatedSentences);
        return { success: true };
      } else {
        console.log("deleteSentence failed: Database operation failed");
        return { success: false, error: 'Failed to delete sentence from database.' };
      }
    } catch (error) {
      console.error('Error deleting sentence:', error);
      return { success: false, error: error.message || 'Failed to delete sentence.' };
    }
  };

  // -------------------- Verb Management --------------------
  const addVerb = async (verbData) => {
    try {
      // Check if verb already exists (handle both property naming schemes)
      const existingVerb = verbs.find(v => {
        const existingInfinitive = v.infinitive || v.frenchInfinitive || '';
        const newInfinitive = verbData.infinitive || verbData.frenchInfinitive || '';
        return existingInfinitive.toLowerCase() === newInfinitive.toLowerCase();
      });
      
      if (existingVerb) {
        return { success: false, error: 'A verb with this French infinitive already exists.' };
      }
      
      // Create new verb with ID and timestamps
      const timestamp = getCurrentTimestamp();
      const newVerb = {
        ...verbData,
        id: generateUniqueId(),
        createdBy: user?.email || 'anonymous',
        createdAt: timestamp,
        updatedAt: timestamp,
        isPredefined: false
      };
      
      // Save to IndexedDB using FrenchDataService
      const success = await FrenchDataService.addUserVerb(newVerb);
      
      if (success) {
        // Update local state
        setVerbs(prevVerbs => [...prevVerbs, newVerb]);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to save verb to database.' };
      }
    } catch (error) {
      console.error('Error adding verb:', error);
      return { success: false, error: error.message || 'Failed to add verb.' };
    }
  };

  const updateVerb = async (id, verbData) => {
    try {
      console.log('ContentContext: updateVerb called with id:', id);
      console.log('ContentContext: verbData:', JSON.stringify(verbData));
      
      // Find the verb to update - create a deep clone to avoid mutation issues
      const verbToUpdate = verbs.find(v => v.id === id);
      
      if (!verbToUpdate) {
        console.error('ContentContext: Verb not found with ID:', id);
        return { success: false, error: 'Verb not found.' };
      }
      
      // Log original verb before any modifications
      console.log('ContentContext: Original verb object:', JSON.stringify(verbToUpdate));
      
      // Check if updated French verb conflicts with another verb
      const existingVerb = verbs.find(v => {
        const existingInfinitive = v.infinitive || v.frenchInfinitive || '';
        const newInfinitive = verbData.infinitive || verbData.frenchInfinitive || '';
        return existingInfinitive.toLowerCase() === newInfinitive.toLowerCase() && v.id !== id;
      });
      
      if (existingVerb) {
        console.error('ContentContext: Another verb with this French infinitive already exists:', verbData.infinitive);
        return { success: false, error: 'Another verb with this French infinitive already exists.' };
      }
      
      // Create a completely new object with explicit properties instead of using spreads
      // This avoids issues with nested objects and references
      const updatedVerb = {
        // Essential properties - copy directly from verbData
        id: id, // Ensure ID remains the same
        infinitive: verbData.infinitive,
        english: verbData.english,
        group: verbData.group || verbToUpdate.group || "1",
        
        // Handle the french property correctly (for compatibility with other parts of the app)
        french: Array.isArray(verbData.french) ? verbData.french : 
                (verbData.french ? [verbData.french] : 
                 (verbData.infinitive ? [verbData.infinitive] : [])),
        
        // Create a new conjugations object explicitly rather than spreading
        conjugations: {
          je: Array.isArray(verbData.conjugations?.je) ? [...verbData.conjugations.je] :
              (verbData.conjugations?.je ? [verbData.conjugations.je] : [""]),
          tu: Array.isArray(verbData.conjugations?.tu) ? [...verbData.conjugations.tu] :
              (verbData.conjugations?.tu ? [verbData.conjugations.tu] : [""]),
          il: Array.isArray(verbData.conjugations?.il) ? [...verbData.conjugations.il] :
              (verbData.conjugations?.il ? [verbData.conjugations.il] : [""]),
          nous: Array.isArray(verbData.conjugations?.nous) ? [...verbData.conjugations.nous] :
                (verbData.conjugations?.nous ? [verbData.conjugations.nous] : [""]),
          vous: Array.isArray(verbData.conjugations?.vous) ? [...verbData.conjugations.vous] :
                (verbData.conjugations?.vous ? [verbData.conjugations.vous] : [""]),
          ils: Array.isArray(verbData.conjugations?.ils) ? [...verbData.conjugations.ils] :
               (verbData.conjugations?.ils ? [verbData.conjugations.ils] : [""])
        },
        
        // Metadata
        createdBy: verbToUpdate.createdBy || verbData.createdBy || 'user',
        createdAt: verbToUpdate.createdAt || verbData.createdAt || getCurrentTimestamp(),
        isPredefined: verbToUpdate.isPredefined || false,
        updatedAt: getCurrentTimestamp() // Always use fresh timestamp
      };
      
      // Log the final object to be saved
      console.log('ContentContext: Final updatedVerb object to save:', JSON.stringify(updatedVerb));
      
      // Create a deep clone before saving to ensure no references
      const safeVerbData = JSON.parse(JSON.stringify(updatedVerb));
      
      // Save to IndexedDB
      const success = await FrenchDataService.updateData(STORE_VERBS, safeVerbData);
      console.log('ContentContext: FrenchDataService.updateData result:', success);
      
      if (success) {
        // Eliminate immediate state update to prevent race conditions
        // Instead, only refresh after a delay to get fresh data from DB
        console.log('ContentContext: Update successful, will refresh data in 100ms');
        
        // Force a single data refresh to ensure consistency across the app
        setTimeout(async () => {
          try {
            // Full refresh of verb data from IndexedDB
            console.log('ContentContext: Starting full verb refresh from IndexedDB');
            const refreshedVerbs = await FrenchDataService.getVerbs(true); // true to force refresh
            console.log('ContentContext: Got refreshed verbs after update:', refreshedVerbs.length);
            
            // Verify the updated verb is in the refreshed data
            const refreshedVerb = refreshedVerbs.find(v => v.id === id);
            console.log('ContentContext: Updated verb in refreshed data:', 
                        refreshedVerb ? JSON.stringify({
                          id: refreshedVerb.id,
                          infinitive: refreshedVerb.infinitive,
                          english: refreshedVerb.english
                        }) : 'NOT FOUND');
            
            // Set state with the fresh data
            setVerbs(refreshedVerbs);
            console.log('ContentContext: State updated with fresh data');
            
            // Also perform a general cache refresh
            await FrenchDataService.forceRefresh();
          } catch (error) {
            console.error('ContentContext: Error during data refresh after verb update:', error);
          }
        }, 100); // Reduced timeout for faster response
        
        return { success: true };
      } else {
        console.error('ContentContext: Failed to update verb in database');
        return { success: false, error: 'Failed to update verb in database.' };
      }
    } catch (error) {
      console.error('ContentContext: Error updating verb:', error);
      return { success: false, error: error.message || 'Failed to update verb.' };
    }
  };

  const deleteVerb = async (id) => {
    try {
      console.log("deleteVerb called with id:", id);
      
      // Find the verb to delete
      const verbToDelete = verbs.find(v => v.id === id);
      
      console.log("Verb to delete:", verbToDelete);
      
      if (!verbToDelete) {
        console.log("deleteVerb failed: Verb not found");
        return { success: false, error: 'Verb not found.' };
      }
      
      // Delete from IndexedDB
      console.log("Calling FrenchDataService.deleteData for verb:", id);
      const success = await FrenchDataService.deleteData(STORE_VERBS, id);
      console.log("FrenchDataService.deleteData result:", success);
      
      if (success) {
        // Update local state
        console.log("Updating local state after verb deletion");
        const updatedVerbs = verbs.filter(v => v.id !== id);
        setVerbs(updatedVerbs);
        return { success: true };
      } else {
        console.log("deleteVerb failed: Database operation failed");
        return { success: false, error: 'Failed to delete verb from database.' };
      }
    } catch (error) {
      console.error('Error deleting verb:', error);
      return { success: false, error: error.message || 'Failed to delete verb.' };
    }
  };

  // -------------------- Number Management --------------------
  const addNumber = async (numberData) => {
    try {
      console.log('ContentContext: Adding number with data:', JSON.stringify(numberData));
      
      // Ensure numberData is valid
      if (!numberData) {
        console.error('ContentContext: numberData is null or undefined');
        return { success: false, error: 'Invalid number data: data is missing.' };
      }
      
      // Check required properties
      if (!numberData.french) {
        console.error('ContentContext: numberData.french is missing');
        return { success: false, error: 'Invalid number data: French number is required.' };
      }
      
      if (!numberData.english) {
        console.error('ContentContext: numberData.english is missing');
        return { success: false, error: 'Invalid number data: English translation is required.' };
      }
      
      // Set category to 'number'
      numberData.category = 'number';
      
      // Check if number already exists, safely handling both string and array formats
      console.log('ContentContext: Checking for duplicate numbers...');
      const existingNumber = numbers.find(n => {
        try {
          // Get French from numberData, which might be an array or string
          let newFrench = numberData.french;
          if (Array.isArray(newFrench)) {
            console.log('ContentContext: newFrench is an array:', newFrench);
            newFrench = newFrench[0] || '';
          }
          
          // Get French from existing number, which might be an array or string
          let existingFrench = n.french;
          if (Array.isArray(existingFrench)) {
            console.log('ContentContext: existingFrench is an array:', existingFrench);
            existingFrench = existingFrench[0] || '';
          } else if (typeof existingFrench !== 'string') {
            console.log('ContentContext: existingFrench is not a string or array:', typeof existingFrench);
            return false; // Skip invalid entries
          }
          
          const matches = existingFrench.toLowerCase() === newFrench.toLowerCase();
          if (matches) {
            console.log('ContentContext: Found duplicate number:', existingFrench);
          }
          return matches;
        } catch (err) {
          console.error("Error comparing French numbers:", err, { existing: n, new: numberData });
          return false;
        }
      });
      
      if (existingNumber) {
        console.log('ContentContext: Duplicate number found:', existingNumber);
        return { success: false, error: 'A number with this French spelling already exists.' };
      }
      
      // Create new number with ID and timestamps
      const timestamp = getCurrentTimestamp();
      const newNumber = {
        ...numberData,
        id: generateUniqueId(),
        createdBy: user?.email || 'anonymous',
        createdAt: timestamp,
        updatedAt: timestamp,
        isPredefined: false
      };
      console.log('ContentContext: Prepared new number object:', JSON.stringify(newNumber));
      
      // Initialize IndexedDB if it hasn't been already
      if (!indexedDBService.isInitialized) {
        console.log('ContentContext: Initializing IndexedDB before adding number');
        await indexedDBService.initialize();
      }
      
      // Use direct database access to ensure proper persistence
      console.log('ContentContext: Using direct IndexedDBService.addData call for reliable persistence');
      const addResult = await indexedDBService.addData('numbers', newNumber);
      console.log('ContentContext: IndexedDBService.addData result:', addResult);
      
      if (addResult) {
        console.log('ContentContext: Successfully added number to database');
        
        // Update local state
        console.log('ContentContext: Updating local state with new number');
        setNumbers(prevNumbers => [...prevNumbers, newNumber]);
        
        // Force refresh all data to ensure consistency
        console.log('ContentContext: Forcing cache refresh to ensure data consistency');
        setTimeout(() => {
          FrenchDataService.forceRefresh().then(() => {
            console.log('ContentContext: Data cache refreshed successfully');
          });
        }, 500); // Short delay to ensure transaction completes
        
        return { success: true };
      } else {
        console.error('ContentContext: Failed to save number to database');
        return { success: false, error: 'Failed to save number to database.' };
      }
    } catch (error) {
      console.error('ContentContext: Error adding number:', error);
      return { success: false, error: `Failed to add number: ${error.message || 'Unknown error'}` };
    }
  };

  const updateNumber = async (id, numberData) => {
    try {
      // Find the number to update
      const numberToUpdate = numbers.find(n => n.id === id);
      
      if (!numberToUpdate) {
        return { success: false, error: 'Number not found.' };
      }
      
      if (numberToUpdate.isPredefined) {
        return { success: false, error: 'Predefined numbers cannot be updated.' };
      }
      
      // Check if updated French number conflicts with another number
      const existingNumber = numbers.find(n => {
        try {
          // Get French from numberData, which might be an array or string
          let newFrench = numberData.french;
          if (Array.isArray(newFrench)) {
            newFrench = newFrench[0] || '';
          }
          
          // Get French from existing number, which might be an array or string
          let existingFrench = n.french;
          if (Array.isArray(existingFrench)) {
            existingFrench = existingFrench[0] || '';
          } else if (typeof existingFrench !== 'string') {
            return false; // Skip invalid entries
          }
          
          return existingFrench.toLowerCase() === newFrench.toLowerCase() && n.id !== id;
        } catch (err) {
          console.error("Error comparing French numbers:", err, { existing: n, new: numberData });
          return false;
        }
      });
      
      if (existingNumber) {
        return { success: false, error: 'Another number with this French spelling already exists.' };
      }
      
      // Ensure category is set to 'number'
      numberData.category = 'number';
      
      // Update the number
      const updatedNumber = {
        ...numberToUpdate,
        ...numberData,
        updatedAt: getCurrentTimestamp()
      };
      
      // Save to IndexedDB
      const success = await FrenchDataService.updateData(STORE_NUMBERS, updatedNumber);
      
      if (success) {
        // Update local state
        const updatedNumbers = numbers.map(n => n.id === id ? updatedNumber : n);
        setNumbers(updatedNumbers);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update number in database.' };
      }
    } catch (error) {
      console.error('Error updating number:', error);
      return { success: false, error: error.message || 'Failed to update number.' };
    }
  };

  const deleteNumber = async (id) => {
    try {
      console.log("deleteNumber called with id:", id);
      
      // Find the number to delete
      const numberToDelete = numbers.find(n => n.id === id);
      
      console.log("Number to delete:", numberToDelete);
      
      if (!numberToDelete) {
        console.log("deleteNumber failed: Number not found");
        return { success: false, error: 'Number not found.' };
      }
      
      if (numberToDelete.isPredefined) {
        console.log("deleteNumber failed: Number is predefined");
        return { success: false, error: 'Predefined numbers cannot be deleted.' };
      }
      
      // Delete from IndexedDB
      console.log("Calling FrenchDataService.deleteData for number:", id);
      const success = await FrenchDataService.deleteData(STORE_NUMBERS, id);
      console.log("FrenchDataService.deleteData result for number:", success);
      
      if (success) {
        // Update local state
        console.log("Updating local state after number deletion");
        const updatedNumbers = numbers.filter(n => n.id !== id);
        setNumbers(updatedNumbers);
        return { success: true };
      } else {
        console.log("deleteNumber failed: Database operation failed");
        return { success: false, error: 'Failed to delete number from database.' };
      }
    } catch (error) {
      console.error('Error deleting number:', error);
      return { success: false, error: error.message || 'Failed to delete number.' };
    }
  };

  // Function to explicitly load all content data when requested by user
  const loadAllContentData = async () => {
    if (window.loadAllContent) {
      await window.loadAllContent();
      return true;
    }
    return false;
  };

  // Provide the context value
  const contextValue = {
    // Data
    words,
    sentences,
    verbs,
    numbers,
    loading, // Kept for backward compatibility
    loadingStatus, // Detailed loading status for progressive UI
    
    // Content loading function (explicit)
    loadAllContentData,
    
    // Word operations
    addWord,
    updateWord,
    deleteWord,
    
    // Sentence operations
    addSentence,
    updateSentence,
    deleteSentence,
    
    // Verb operations
    addVerb,
    updateVerb,
    deleteVerb,
    
    // Number operations
    addNumber,
    updateNumber,
    deleteNumber
  };

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
};

ContentProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default ContentContext;