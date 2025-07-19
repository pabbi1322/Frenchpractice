import { useState } from 'react';
import indexedDBService from '../../services/IndexedDBService';
import FrenchDataService from '../../services/FrenchDataService';

/**
 * A button component that deletes predefined data from the database
 * Can be used in admin panels or debug screens
 */
const DeletePredefinedDataButton = ({ dataType = 'all', buttonText, onComplete, className }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState(null);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setResult(null);
    
    try {
      // Make sure IndexedDB is initialized
      if (!indexedDBService.isInitialized) {
        await indexedDBService.initialize();
      }
      
      const results = {
        words: { deleted: 0, total: 0 },
        sentences: { deleted: 0, total: 0 },
        numbers: { deleted: 0, total: 0 },
        verbs: { deleted: 0, total: 0 }
      };
      
      // Delete predefined words
      if (dataType === 'all' || dataType === 'words') {
        console.log('Deleting predefined words...');
        const words = await indexedDBService.getAllData('words');
        results.words.total = words.length;
        
        // Identify predefined words
        const predefinedWords = words.filter(word => 
          word.isPredefined === true || 
          (word.id && typeof word.id === 'string' && word.id.startsWith('word-'))
        );
        
        console.log(`Found ${predefinedWords.length} predefined words out of ${words.length} total words`);
        
        // Delete each predefined word
        for (const word of predefinedWords) {
          try {
            console.log(`Deleting word: ${word.id} - ${word.english}`);
            await indexedDBService.deleteData('words', word.id);
            results.words.deleted++;
          } catch (error) {
            console.error(`Error deleting word ${word.id}:`, error);
          }
        }
      }
      
      // Delete predefined sentences
      if (dataType === 'all' || dataType === 'sentences') {
        console.log('Deleting predefined sentences...');
        const sentences = await indexedDBService.getAllData('sentences');
        results.sentences.total = sentences.length;
        
        // Identify predefined sentences
        const predefinedSentences = sentences.filter(sentence => 
          sentence.isPredefined === true || 
          (sentence.id && typeof sentence.id === 'string' && sentence.id.startsWith('sentence-'))
        );
        
        console.log(`Found ${predefinedSentences.length} predefined sentences out of ${sentences.length} total sentences`);
        
        // Delete each predefined sentence
        for (const sentence of predefinedSentences) {
          try {
            console.log(`Deleting sentence: ${sentence.id} - ${sentence.english}`);
            await indexedDBService.deleteData('sentences', sentence.id);
            results.sentences.deleted++;
          } catch (error) {
            console.error(`Error deleting sentence ${sentence.id}:`, error);
          }
        }
      }
      
      // Delete predefined numbers
      if (dataType === 'all' || dataType === 'numbers') {
        console.log('Deleting predefined numbers...');
        const numbers = await indexedDBService.getAllData('numbers');
        results.numbers.total = numbers.length;
        
        // Identify predefined numbers
        const predefinedNumbers = numbers.filter(number => 
          number.isPredefined === true || 
          (number.id && typeof number.id === 'string' && number.id.startsWith('number-'))
        );
        
        console.log(`Found ${predefinedNumbers.length} predefined numbers out of ${numbers.length} total numbers`);
        
        // Delete each predefined number
        for (const number of predefinedNumbers) {
          try {
            console.log(`Deleting number: ${number.id} - ${number.english}`);
            await indexedDBService.deleteData('numbers', number.id);
            results.numbers.deleted++;
          } catch (error) {
            console.error(`Error deleting number ${number.id}:`, error);
          }
        }
      }
      
      // Delete predefined verbs
      if (dataType === 'all' || dataType === 'verbs') {
        console.log('Deleting predefined verbs...');
        const verbs = await indexedDBService.getAllData('verbs');
        results.verbs.total = verbs.length;
        
        // Identify predefined verbs
        const predefinedVerbs = verbs.filter(verb => 
          verb.isPredefined === true || 
          (verb.id && typeof verb.id === 'string' && verb.id.startsWith('verb-'))
        );
        
        console.log(`Found ${predefinedVerbs.length} predefined verbs out of ${verbs.length} total verbs`);
        
        // Delete each predefined verb
        for (const verb of predefinedVerbs) {
          try {
            console.log(`Deleting verb: ${verb.id} - ${verb.infinitive}`);
            await indexedDBService.deleteData('verbs', verb.id);
            results.verbs.deleted++;
          } catch (error) {
            console.error(`Error deleting verb ${verb.id}:`, error);
          }
        }
      }
      
      // Refresh FrenchDataService cache to ensure deleted items are no longer accessible
      await FrenchDataService.forceRefresh();
      
      // Set result for display
      setResult(results);
      
      // Call completion callback if provided
      if (onComplete) {
        onComplete(results);
      }
      
    } catch (error) {
      console.error('Error during deletion:', error);
      setResult({ error: error.message });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Create a summary of results if available
  const getResultSummary = () => {
    if (!result) return '';
    if (result.error) return `Error: ${result.error}`;
    
    const parts = [];
    if (dataType === 'all' || dataType === 'words') {
      parts.push(`Words: ${result.words.deleted}/${result.words.total} deleted`);
    }
    if (dataType === 'all' || dataType === 'sentences') {
      parts.push(`Sentences: ${result.sentences.deleted}/${result.sentences.total} deleted`);
    }
    if (dataType === 'all' || dataType === 'numbers') {
      parts.push(`Numbers: ${result.numbers.deleted}/${result.numbers.total} deleted`);
    }
    if (dataType === 'all' || dataType === 'verbs') {
      parts.push(`Verbs: ${result.verbs.deleted}/${result.verbs.total} deleted`);
    }
    
    return parts.join(' | ');
  };
  
  return (
    <div className="delete-predefined-container">
      <button 
        onClick={handleDelete} 
        disabled={isDeleting}
        className={`delete-predefined-button ${className || ''}`}
        style={{
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          opacity: isDeleting ? 0.7 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        {isDeleting ? 'Deleting...' : buttonText || 'Delete Predefined Data'}
      </button>
      
      {result && (
        <div className="delete-result" style={{ marginTop: '8px', fontSize: '0.9em' }}>
          {getResultSummary()}
        </div>
      )}
    </div>
  );
};

export default DeletePredefinedDataButton;