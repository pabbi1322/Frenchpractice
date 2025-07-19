import React, { useState, useEffect } from 'react';
import { Download, Check, Loader2, AlertCircle } from 'lucide-react';
import FrenchDataService from '../../services/FrenchDataService';
import indexedDBService from '../../services/IndexedDBService';
import { useToast } from '../../contexts/ToastContext';

/**
 * ContentExportFix Component
 * 
 * A fixed version of the content export functionality that includes both
 * user-added content and predefined content without any filtering.
 */
const ContentExportFix = () => {
  // Context
  const { showToast } = useToast();
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    // Initialize IndexedDB
    const initializeDB = async () => {
      try {
        await indexedDBService.initialize();
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
      }
    };
    
    initializeDB();
  }, []);

  // Generate a filename with the current date
  const generateFilename = () => {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `french-learning-content-backup-${date}.json`;
  };
  
  // Get all content directly from IndexedDB without filtering
  const getAllContentFromDB = async () => {
    try {
      await indexedDBService.initialize();
      
      // Get all content directly from IndexedDB without filtering
      const words = await indexedDBService.getAllData('words');
      const verbs = await indexedDBService.getAllData('verbs');
      const sentences = await indexedDBService.getAllData('sentences');
      const numbers = await indexedDBService.getAllData('numbers');
      
      console.log(`ContentExportFix: Retrieved content - Words: ${words.length}, Verbs: ${verbs.length}, Sentences: ${sentences.length}, Numbers: ${numbers.length}`);
      
      return {
        words,
        verbs,
        sentences,
        numbers
      };
    } catch (error) {
      console.error('Error getting content from IndexedDB:', error);
      throw error;
    }
  };
  
  // Handle backup creation and download
  const handleCreateBackup = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      // Get all content
      const allContent = await getAllContentFromDB();
      
      // Create metadata
      const metadata = {
        exportDate: new Date().toISOString(),
        contentCounts: {
          words: allContent.words.length,
          verbs: allContent.verbs.length,
          sentences: allContent.sentences.length,
          numbers: allContent.numbers.length
        },
        totalItems: allContent.words.length + allContent.verbs.length + 
                    allContent.sentences.length + allContent.numbers.length,
        version: '1.0'
      };
      
      // Create the export data
      const exportData = {
        metadata,
        data: allContent
      };
      
      // Convert to JSON
      const jsonContent = JSON.stringify(exportData, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFilename();
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Update state
      setSuccess(true);
      setStats({
        words: allContent.words.length,
        verbs: allContent.verbs.length,
        sentences: allContent.sentences.length,
        numbers: allContent.numbers.length,
        total: metadata.totalItems
      });
      
      // Show toast notification
      showToast(`Content successfully downloaded (${metadata.totalItems} items)`, 'success');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error creating backup:', err);
      setError(err.message || 'Failed to create backup');
      showToast('Failed to create backup', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-100">Complete Content Backup (Fixed)</h2>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="bg-gray-800 p-4 rounded-md mb-4 text-sm">
          <h3 className="text-gray-300 font-semibold mb-2">Export Statistics</h3>
          <div className="grid grid-cols-5 gap-3 text-center">
            <div className="p-2 bg-gray-700 rounded">
              <div className="font-semibold text-blue-400">Words</div>
              <div className="text-white text-lg">{stats.words}</div>
            </div>
            <div className="p-2 bg-gray-700 rounded">
              <div className="font-semibold text-blue-400">Verbs</div>
              <div className="text-white text-lg">{stats.verbs}</div>
            </div>
            <div className="p-2 bg-gray-700 rounded">
              <div className="font-semibold text-blue-400">Sentences</div>
              <div className="text-white text-lg">{stats.sentences}</div>
            </div>
            <div className="p-2 bg-gray-700 rounded">
              <div className="font-semibold text-blue-400">Numbers</div>
              <div className="text-white text-lg">{stats.numbers}</div>
            </div>
            <div className="p-2 bg-gray-700 rounded">
              <div className="font-semibold text-green-400">Total</div>
              <div className="text-white text-lg font-bold">{stats.total}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-900 text-red-100 p-3 rounded mb-3 text-sm">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Backup Button */}
      <button
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-white ${
          loading ? 'bg-purple-700 cursor-not-allowed' : 
          success ? 'bg-green-600 hover:bg-green-700' : 
          'bg-purple-600 hover:bg-purple-700'
        }`}
        onClick={handleCreateBackup}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : success ? (
          <Check className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>
          {loading ? 'Creating Backup...' : 
           success ? 'Backup Downloaded!' : 
           'Create Complete Backup'}
        </span>
      </button>
      
      <p className="text-gray-400 text-xs mt-2">
        This creates a complete backup including <strong>all</strong> content in your database.
        This fixed version ensures both predefined and user-added content is included.
      </p>
    </div>
  );
};

export default ContentExportFix;