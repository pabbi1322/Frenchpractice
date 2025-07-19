import React, { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import FrenchDataService from '../../services/FrenchDataService';
import indexedDBService from '../../services/IndexedDBService';
import { useToast } from '../../contexts/ToastContext';

/**
 * DownloadContentButton Component
 * 
 * A component that allows users to download their content from IndexedDB
 * for backup purposes in either JSON or CSV format.
 */
const DownloadContentButton = () => {
  // Context
  const { showToast } = useToast();
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('json');
  const [selectedContent, setSelectedContent] = useState({
    words: true,
    verbs: true,
    sentences: true,
    numbers: true
  });
  const [showOptions, setShowOptions] = useState(false);

  // Generate a filename with the current date
  const generateFilename = (contentType, format) => {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `french-master-${contentType}-backup-${date}.${format}`;
  };

  // Convert array of objects to CSV string
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Handle special cases: french field is an array
    const processRow = (row) => {
      return headers.map(key => {
        let value = row[key];
        
        // Special handling for array values like french
        if (Array.isArray(value)) {
          value = value.join('|');
        }
        
        // Special handling for object values like conjugations
        if (value && typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        // Escape commas and quotes
        if (value === null || value === undefined) {
          return '';
        } else {
          value = String(value);
          // Escape quotes and wrap in quotes if contains commas or quotes
          if (value.includes(',') || value.includes('"')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
      }).join(',');
    };

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => processRow(row))
    ].join('\n');

    return csvContent;
  };

  // Handle download
  const handleDownload = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // Determine which content types to include
      const contentTypes = [];
      if (selectedContent.words) contentTypes.push('words');
      if (selectedContent.verbs) contentTypes.push('verbs');
      if (selectedContent.sentences) contentTypes.push('sentences');
      if (selectedContent.numbers) contentTypes.push('numbers');

      // Ensure IndexedDB is initialized
      await indexedDBService.initialize();

      // Collect all data
      const allData = {};
      const contentCounts = {};

      for (const type of contentTypes) {
        let data;
        switch (type) {
          case 'words':
            data = await FrenchDataService.getAllWords();
            break;
          case 'verbs':
            data = await FrenchDataService.getAllVerbs();
            break;
          case 'sentences':
            data = await FrenchDataService.getAllSentences();
            break;
          case 'numbers':
            data = await FrenchDataService.getAllNumbers();
            break;
          default:
            data = [];
        }
        allData[type] = data;
        contentCounts[type] = data.length;
      }

      // Create metadata
      const metadata = {
        exportDate: new Date().toISOString(),
        contentCounts,
        totalItems: Object.values(contentCounts).reduce((sum, count) => sum + count, 0),
        exportFormat: selectedFormat,
        version: '1.0'
      };

      // Prepare and download the data based on selected format
      if (selectedFormat === 'json') {
        // Create a JSON file with all data and metadata
        const exportData = {
          metadata,
          data: allData
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, generateFilename('content', 'json'));
      } else if (selectedFormat === 'csv') {
        // Create a separate CSV file for each content type
        for (const type of contentTypes) {
          if (allData[type] && allData[type].length > 0) {
            const csvContent = convertToCSV(allData[type]);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            downloadFile(url, generateFilename(type, 'csv'));
          }
        }

        // Also create a metadata file
        const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
        const metadataUrl = URL.createObjectURL(metadataBlob);
        downloadFile(metadataUrl, 'french-master-export-metadata.json');
      } else if (selectedFormat === 'both') {
        // Download both formats
        // JSON
        const exportData = {
          metadata,
          data: allData
        };
        const jsonContent = JSON.stringify(exportData, null, 2);
        const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        downloadFile(jsonUrl, generateFilename('content', 'json'));

        // CSV files
        for (const type of contentTypes) {
          if (allData[type] && allData[type].length > 0) {
            const csvContent = convertToCSV(allData[type]);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            downloadFile(url, generateFilename(type, 'csv'));
          }
        }
      }

      setSuccess(true);
      
      // Show toast notification
      showToast(`Content successfully downloaded (${Object.values(contentCounts).reduce((sum, count) => sum + count, 0)} items)`, 'success');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error downloading content:', err);
      setError(err.message || 'Failed to download content');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to trigger file download
  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Toggle content selection
  const toggleContentSelection = (contentType) => {
    setSelectedContent(prev => ({
      ...prev,
      [contentType]: !prev[contentType]
    }));
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-100">Content Backup</h2>
        {showOptions ? (
          <button 
            className="text-sm text-blue-400 hover:underline"
            onClick={() => setShowOptions(false)}
          >
            Hide Options
          </button>
        ) : (
          <button 
            className="text-sm text-blue-400 hover:underline"
            onClick={() => setShowOptions(true)}
          >
            Show Options
          </button>
        )}
      </div>

      {/* Options Panel */}
      {showOptions && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Select Content Types:</h3>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={selectedContent.words} 
                  onChange={() => toggleContentSelection('words')}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-600"
                />
                <span className="ml-2 text-gray-300">Words</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={selectedContent.verbs} 
                  onChange={() => toggleContentSelection('verbs')}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-600"
                />
                <span className="ml-2 text-gray-300">Verbs</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={selectedContent.sentences} 
                  onChange={() => toggleContentSelection('sentences')}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-600"
                />
                <span className="ml-2 text-gray-300">Sentences</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={selectedContent.numbers} 
                  onChange={() => toggleContentSelection('numbers')}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-600"
                />
                <span className="ml-2 text-gray-300">Numbers</span>
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Export Format:</h3>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="json" 
                  checked={selectedFormat === 'json'} 
                  onChange={() => setSelectedFormat('json')}
                  className="bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-600"
                />
                <span className="ml-2 text-gray-300">JSON (all content in one file)</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="csv" 
                  checked={selectedFormat === 'csv'} 
                  onChange={() => setSelectedFormat('csv')}
                  className="bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-600"
                />
                <span className="ml-2 text-gray-300">CSV (separate file for each content type)</span>
              </label>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  value="both" 
                  checked={selectedFormat === 'both'} 
                  onChange={() => setSelectedFormat('both')}
                  className="bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-600"
                />
                <span className="ml-2 text-gray-300">Both formats</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-900 text-red-100 p-3 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {/* Download Button */}
      <button
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-white ${
          loading ? 'bg-blue-700 cursor-not-allowed' : 
          success ? 'bg-green-600 hover:bg-green-700' : 
          'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={handleDownload}
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
          {loading ? 'Preparing Download...' : 
           success ? 'Downloaded Successfully!' : 
           'Download Content Backup'}
        </span>
      </button>
      
      <p className="text-gray-400 text-xs mt-2">
        Download your custom vocabulary, verbs, sentences, and numbers as a backup file.
        You can import this file later if your browser data gets lost.
      </p>
    </div>
  );
};

export default DownloadContentButton;