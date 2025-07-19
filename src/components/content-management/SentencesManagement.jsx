// SentencesManagement.jsx
// Component for managing sentence entries
import React, { useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import SentenceForm from './forms/SentenceForm';
import SentencesList from './lists/SentencesList';
import DuplicateContentDisplay from './DuplicateContentDisplay';

const SentencesManagement = () => {
  const { sentences, addSentence, updateSentence, deleteSentence, loadingStatus } = useContent();
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [editingSentence, setEditingSentence] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Show notification message
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000); // Auto-dismiss after 3 seconds
  };

  const handleAddClick = () => {
    setIsAddFormVisible(true);
    setEditingSentence(null);
  };

  const handleEditClick = (sentence) => {
    setEditingSentence(sentence);
    setIsAddFormVisible(false);
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
    
    // If we're still loading sentences but database is initialized, show sentences-specific loading
    if (loadingStatus.sentences) {
      return (
        <div className="py-3 text-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-300">Loading sentences...</span>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const handleAddSubmit = async (sentenceData) => {
    try {
      const result = await addSentence(sentenceData);
      if (result && result.success) {
        showNotification('success', 'Sentence added successfully!');
        // Don't hide form after adding - let user keep adding sentences
        // Focus reset is handled in the SentenceForm component
      } else {
        showNotification('error', `Failed to add sentence: ${result ? result.error : 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error adding sentence:", error);
      showNotification('error', `Failed to add sentence: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditSubmit = async (sentenceData) => {
    try {
      console.log(`SentencesManagement: Attempting to update sentence with ID: ${editingSentence.id}`);
      console.log(`SentencesManagement: Form data submitted:`, sentenceData);
      
      // Ensure we have the proper format for update
      const updatedData = {
        ...sentenceData,
        // If french is provided as string, ensure it's consistent with expected format
        french: typeof sentenceData.french === 'string' 
          ? sentenceData.french 
          : Array.isArray(sentenceData.french) 
            ? sentenceData.french 
            : editingSentence.french
      };
      
      console.log(`SentencesManagement: Processed data for update:`, updatedData);
      
      const result = await updateSentence(editingSentence.id, updatedData);
      console.log(`SentencesManagement: Update sentence result:`, result);
      
      if (result && result.success) {
        console.log(`SentencesManagement: Sentence update successful`);
        showNotification('success', 'Sentence updated successfully!');
        setEditingSentence(null);
        
        // Check if the update was applied in the state
        setTimeout(() => {
          const updatedSentence = sentences.find(s => s.id === editingSentence.id);
          if (updatedSentence) {
            console.log(`SentencesManagement: Updated sentence in state:`, updatedSentence);
            
            // Check if key properties match what we sent
            if ((typeof updatedSentence.french === 'string' && updatedSentence.french !== updatedData.french) ||
                (Array.isArray(updatedSentence.french) && JSON.stringify(updatedSentence.french) !== JSON.stringify(updatedData.french)) ||
                updatedSentence.english !== updatedData.english) {
              console.warn(`SentencesManagement: Sentence update may not have been applied correctly`);
              console.log(`Expected:`, updatedData);
              console.log(`Actual:`, updatedSentence);
            } else {
              console.log(`SentencesManagement: Sentence update confirmed in state`);
            }
          } else {
            console.error(`SentencesManagement: Updated sentence not found in state after update!`);
          }
        }, 500);
      } else {
        console.error(`SentencesManagement: Update sentence failed with error:`, result ? result.error : 'Unknown error');
        showNotification('error', `Failed to update sentence: ${result ? result.error : 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating sentence:", error);
      showNotification('error', `Failed to update sentence: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this sentence?')) {
      try {
        console.log(`SentencesManagement: Attempting to delete sentence with ID: ${id}`);
        
        // Find the sentence we're about to delete for debugging
        const sentenceToDelete = sentences.find(s => s.id === id);
        console.log(`SentencesManagement: Sentence to delete:`, sentenceToDelete);
        
        const result = await deleteSentence(id);
        console.log(`SentencesManagement: Delete sentence result:`, result);
        
        if (result && result.success) {
          console.log(`SentencesManagement: Sentence deletion successful`);
          showNotification('success', 'Sentence deleted successfully!');
          
          // Check if the sentence is really gone from the state
          setTimeout(() => {
            const stillExists = sentences.some(s => s.id === id);
            if (stillExists) {
              console.warn(`SentencesManagement: Sentence with ID ${id} still exists in state after successful deletion`);
              // Force update the UI by filtering the sentence out manually
              const updatedSentences = sentences.filter(s => s.id !== id);
              console.log(`SentencesManagement: Would need to force UI update to remove sentence with ID ${id}`);
            } else {
              console.log(`SentencesManagement: Sentence confirmed deleted from state`);
            }
          }, 500);
        } else {
          console.error(`SentencesManagement: Delete sentence failed with error:`, result ? result.error : 'Unknown error');
          showNotification('error', `Failed to delete sentence: ${result ? result.error : 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Error deleting sentence:", error);
        showNotification('error', `Failed to delete sentence: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCancel = () => {
    setIsAddFormVisible(false);
    setEditingSentence(null);
  };

  // Filter sentences based on search term
  const filteredSentences = searchTerm.trim() === '' ? sentences : sentences.filter(
    sentence => {
      try {
        const englishMatch = sentence.english && sentence.english.toLowerCase().includes(searchTerm.toLowerCase());
        let frenchMatch = false;
        if (Array.isArray(sentence.french)) {
          frenchMatch = sentence.french.some(f => 
            typeof f === 'string' && f.toLowerCase().includes(searchTerm.toLowerCase())
          );
        } else if (typeof sentence.french === 'string') {
          frenchMatch = sentence.french.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return englishMatch || frenchMatch;
      } catch (error) {
        console.error('Error filtering sentence:', error, sentence);
        return false;
      }
    }
  );

  // Filter out predefined sentences and user-added sentences
  const userSentences = filteredSentences.filter(sentence => !sentence.isPredefined);
  const predefinedSentences = filteredSentences.filter(sentence => sentence.isPredefined);

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">Sentences Management</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-all duration-200"
          onClick={handleAddClick}
          disabled={loadingStatus.sentences}
        >
          Add New Sentence
        </button>
      </div>
      
      {/* Show loading state if necessary */}
      {renderLoadingState()}

      {/* Duplicate Content Display */}
      {!loadingStatus.initialLoad && <DuplicateContentDisplay contentType="sentences" onEdit={handleEditClick} onDelete={handleDeleteClick} />}

      {/* Search input */}
      {!loadingStatus.sentences && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search sentences..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      )}

      {/* Add Form */}
      {isAddFormVisible && (
        <div className="bg-gray-800 p-4 rounded-md mb-6 border border-gray-700">
          <h3 className="text-xl mb-4 text-gray-100">Add New Sentence</h3>
          <SentenceForm onSubmit={handleAddSubmit} onCancel={handleCancel} />
        </div>
      )}

      {/* Edit Form */}
      {editingSentence && (
        <div className="bg-gray-800 p-4 rounded-md mb-6 border border-gray-700">
          <h3 className="text-xl mb-4 text-gray-100">Edit Sentence</h3>
          <SentenceForm
            initialData={editingSentence}
            onSubmit={handleEditSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Skeleton loader for sentences */}
      {loadingStatus.sentences && !loadingStatus.initialLoad && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800 rounded p-4 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Show content only when not loading */}
      {!loadingStatus.sentences && (
        <>
          {filteredSentences.length === 0 && !isAddFormVisible && !editingSentence && (
            <div className="text-center py-12 text-gray-400">
              {searchTerm ? "No matching sentences found" : "No sentences available yet"}
            </div>
          )}
          
          {/* User Sentences List */}
          {userSentences.length > 0 && (
            <>
              <h3 className="text-xl text-gray-100 mb-2 mt-8">Your Sentences</h3>
              <SentencesList sentences={userSentences} onEdit={handleEditClick} onDelete={handleDeleteClick} />
            </>
          )}

          {/* Predefined Sentences List */}
          {predefinedSentences.length > 0 && (
            <>
              <h3 className="text-xl text-gray-100 mb-2 mt-8">System Sentences</h3>
              <SentencesList sentences={predefinedSentences} onEdit={handleEditClick} onDelete={handleDeleteClick} />
            </>
          )}

          {sentences.length === 0 && searchTerm === '' && (
            <div className="py-6 text-center text-gray-400">
              No sentences available. Add some sentences to get started!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SentencesManagement;