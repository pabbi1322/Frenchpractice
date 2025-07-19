// WordsManagement.jsx
// Component for managing word entries
import React, { useState, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import WordForm from './forms/WordForm';
import WordsList from './lists/WordsList';
import DuplicateContentDisplay from './DuplicateContentDisplay';
import CategoryFilter from './CategoryFilter';
import CategoryService from '../../services/CategoryService';
import CategoryManager from './CategoryManager';

const WordsManagement = () => {
  // Helper function to group words by category
  const groupWordsByCategory = (wordsList) => {
    const categorizedWords = [];
    const wordsByCategory = {};
    
    // Group words by their category
    wordsList.forEach(word => {
      const categoryId = word.category || 'general';
      if (!wordsByCategory[categoryId]) {
        wordsByCategory[categoryId] = [];
      }
      wordsByCategory[categoryId].push(word);
    });
    
    // Convert to array structure with category info
    Object.entries(wordsByCategory).forEach(([categoryId, words]) => {
      const category = allCategories.find(c => c.id === categoryId) || {
        id: categoryId, 
        name: categoryId === 'general' ? 'General' : categoryId, 
        color: 'bg-gray-700'
      };
      
      categorizedWords.push({
        category,
        words
      });
    });
    
    // Sort categories by name
    return categorizedWords.sort((a, b) => a.category.name.localeCompare(b.category.name));
  };
  const { words, addWord, updateWord, deleteWord, loadingStatus } = useContent();
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' means no filter
  const [allCategories, setAllCategories] = useState([]);
  
  // Initialize CategoryService and load categories
  // Function to load categories that can be called at any time
  const loadCategoriesData = async () => {
    try {
      const categories = await CategoryService.getAllCategories();
      setAllCategories(categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  useEffect(() => {
    // Initial load
    loadCategoriesData();
    
    // Set up refresh interval to check for new categories
    const refreshInterval = setInterval(() => {
      loadCategoriesData();
    }, 3000); // Check every 3 seconds for new categories
    
    // Clean up on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Show notification message
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000); // Auto-dismiss after 3 seconds
  };

  const handleAddClick = () => {
    setIsAddFormVisible(true);
    setEditingWord(null);
  };

  const handleEditClick = (word) => {
    setEditingWord(word);
    setIsAddFormVisible(false);
  };

  const handleAddSubmit = async (wordData) => {
    try {
      console.log('WordsManagement: Attempting to add word with data:', wordData);
      const result = await addWord(wordData);
      console.log('WordsManagement: Add word result:', result);
      
      if (result.success) {
        console.log('WordsManagement: Word added successfully');
        showNotification('success', 'Word added successfully!');
        // Don't hide the form - let user keep adding words
        // Focus back to the first input field is handled in WordForm
      } else {
        console.error('WordsManagement: Failed to add word:', result.error);
        showNotification('error', `Failed to add word: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding word:", error);
      showNotification('error', `Failed to add word: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditSubmit = async (wordData) => {
    try {
      console.log(`WordsManagement: Attempting to update word with ID: ${editingWord.id}`);
      console.log(`WordsManagement: New word data:`, wordData);
      
      const result = await updateWord(editingWord.id, wordData);
      console.log(`WordsManagement: Update word result:`, result);
      
      if (result.success) {
        console.log(`WordsManagement: Word update successful`);
        showNotification('success', 'Word updated successfully!');
        setEditingWord(null);
        
        // Check if the word was actually updated in the state
        setTimeout(() => {
          const updatedWord = words.find(w => w.id === editingWord.id);
          if (updatedWord) {
            console.log(`WordsManagement: Word after update:`, updatedWord);
            // Compare with the data we tried to save
            const diff = {};
            Object.keys(wordData).forEach(key => {
              if (JSON.stringify(updatedWord[key]) !== JSON.stringify(wordData[key])) {
                diff[key] = {
                  old: updatedWord[key],
                  new: wordData[key]
                };
              }
            });
            if (Object.keys(diff).length > 0) {
              console.log(`WordsManagement: Differences detected after update:`, diff);
            } else {
              console.log(`WordsManagement: No differences detected, update appears successful`);
            }
          } else {
            console.error(`WordsManagement: Word not found after update!`);
          }
        }, 500); // Short delay to allow state to update
      } else {
        console.error(`WordsManagement: Update word failed with error:`, result.error);
        showNotification('error', `Failed to update word: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating word:", error);
      showNotification('error', `Failed to update word: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this word?')) {
      try {
        console.log(`WordsManagement: Attempting to delete word with ID: ${id}`);
        const result = await deleteWord(id);
        console.log(`WordsManagement: Delete word result:`, result);
        
        if (result.success) {
          console.log(`WordsManagement: Word deletion successful`);
          showNotification('success', 'Word deleted successfully!');
          // Force UI update if needed
          const updatedWord = words.find(w => w.id === id);
          if (updatedWord) {
            console.log(`WordsManagement: Word still exists in state, might need manual refresh`);
          }
        } else {
          console.error(`WordsManagement: Delete word failed with error:`, result.error);
          showNotification('error', `Failed to delete word: ${result.error}`);
        }
      } catch (error) {
        console.error("Error deleting word:", error);
        showNotification('error', `Failed to delete word: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCancel = () => {
    setIsAddFormVisible(false);
    setEditingWord(null);
  };

  // Show appropriate loading indicators
  const renderLoadingState = () => {
    // If we're in initial load, show a smaller loader
    if (loadingStatus.initialLoad) {
      return (
        <div className="py-2 px-4 bg-gray-800 rounded-md shadow mb-4">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-300">Initializing database...</span>
          </div>
        </div>
      );
    }
    
    // If we're still loading words but database is initialized, show words-specific loading
    if (loadingStatus.words) {
      return (
        <div className="py-3 text-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-300">Loading words...</span>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Filter words based on search term and selected category
  const filteredWords = words.filter(
    word => {
      try {
        // First, filter by search term
        let matchesSearchTerm = true;
        if (searchTerm.trim() !== '') {
          // Check English match - safely handle missing or non-string values
          const englishMatch = word.english && typeof word.english === 'string' && 
            word.english.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Check French match - handle both array and string formats safely
          let frenchMatch = false;
          if (Array.isArray(word.french)) {
            frenchMatch = word.french.some(f => 
              typeof f === 'string' && f.toLowerCase().includes(searchTerm.toLowerCase())
            );
          } else if (typeof word.french === 'string') {
            frenchMatch = word.french.toLowerCase().includes(searchTerm.toLowerCase());
          }
          
          matchesSearchTerm = englishMatch || frenchMatch;
        }
        
        // Then, filter by selected category
        let matchesSelectedCategory = true;
        if (selectedCategory && selectedCategory !== 'all') {
          // If word has no category or doesn't match the selected one, filter it out
          matchesSelectedCategory = word.category === selectedCategory;
        }
        
        return matchesSearchTerm && matchesSelectedCategory;
      } catch (error) {
        console.error('Error filtering word:', error, word);
        return false;
      }
    }
  );

  // Filter out predefined words and user-added words
  const userWords = filteredWords.filter(word => !word.isPredefined);
  const predefinedWords = filteredWords.filter(word => word.isPredefined);

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">Words Management</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-all duration-200"
          onClick={handleAddClick}
          disabled={loadingStatus.words}
        >
          Add New Word
        </button>
      </div>
      
      {/* Category Manager */}
      <CategoryManager onCategoryChange={loadCategoriesData} />

      {/* Show loading state if necessary */}
      {renderLoadingState()}

      {/* Duplicate Content Display */}
      {!loadingStatus.initialLoad && <DuplicateContentDisplay contentType="words" onEdit={handleEditClick} onDelete={handleDeleteClick} />}

      {/* Search and Filter Controls */}
      {!loadingStatus.words && (
        <div className="mb-6 space-y-4">
          {/* Search input */}
          <div>
            <input
              type="text"
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          
          {/* Category filter */}
          <div>
            <CategoryFilter 
              onFilterChange={setSelectedCategory}
            />
          </div>
        </div>
      )}

      {/* Add Form */}
      {isAddFormVisible && (
        <div className="bg-gray-800 p-4 rounded-md mb-6 border border-gray-700">
          <h3 className="text-xl mb-4 text-gray-100">Add New Word</h3>
          <WordForm onSubmit={handleAddSubmit} onCancel={handleCancel} />
        </div>
      )}

      {/* Edit Form */}
      {editingWord && (
        <div className="bg-gray-800 p-4 rounded-md mb-6 border border-gray-700">
          <h3 className="text-xl mb-4 text-gray-100">Edit Word</h3>
          <WordForm
            initialData={editingWord}
            onSubmit={handleEditSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Skeleton loader for words */}
      {loadingStatus.words && !loadingStatus.initialLoad && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-gray-800 rounded p-3 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Show content only when not loading */}
      {!loadingStatus.words && (
        <>
          {filteredWords.length === 0 && !isAddFormVisible && !editingWord && (
            <div className="text-center py-12 text-gray-400">
              {searchTerm ? "No matching words found" : "No words available yet"}
            </div>
          )}

          {/* User Words by Category */}
          {userWords.length > 0 && (
            <>
              <h3 className="text-xl text-gray-100 mb-2 mt-8">Your Words</h3>
              
              {/* Group words by category */}
              {groupWordsByCategory(userWords).map(({ category, words }) => (
                <div key={category.id} className="mb-6">
                  <div className="bg-gray-800 px-4 py-2 rounded-t-md border-b border-gray-700 flex justify-between items-center">
                    <span className={`${category.color} px-3 py-1 rounded-full text-sm font-medium`}>
                      {category.name}
                    </span>
                    <span className="text-gray-400 text-sm">{words.length} words</span>
                  </div>
                  <div className="bg-gray-900 rounded-b-md">
                    <WordsList words={words} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Predefined Words by Category */}
          {predefinedWords.length > 0 && (
            <>
              <h3 className="text-xl text-gray-100 mb-2 mt-8">System Words</h3>
              
              {/* Group words by category */}
              {groupWordsByCategory(predefinedWords).map(({ category, words }) => (
                <div key={category.id} className="mb-6">
                  <div className="bg-gray-800 px-4 py-2 rounded-t-md border-b border-gray-700 flex justify-between items-center">
                    <span className={`${category.color} px-3 py-1 rounded-full text-sm font-medium`}>
                      {category.name}
                    </span>
                    <span className="text-gray-400 text-sm">{words.length} words</span>
                  </div>
                  <div className="bg-gray-900 rounded-b-md">
                    <WordsList words={words} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                  </div>
                </div>
              ))}
            </>
          )}

          {words.length === 0 && searchTerm === '' && (
            <div className="py-6 text-center text-gray-400">
              No words available. Add some words to get started!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WordsManagement;