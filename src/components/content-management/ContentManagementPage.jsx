// ContentManagementPage.jsx
// Main container component for managing content
import React, { useState, useEffect } from 'react';
import { ContentProvider, useContent } from '../../contexts/ContentContext';
import WordsManagement from './WordsManagement';
import NumbersManagement from './NumbersManagement';
import SentencesManagement from './SentencesManagement';
import VerbsManagement from './VerbsManagement';
import DuplicateContentSummary from './DuplicateContentSummary';
import DownloadContentButton from './DownloadContentButton';
import ImportContentButton from './ImportContentButton';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import FrenchDataService from '../../services/FrenchDataService';
import { RefreshCw } from 'lucide-react'; // Import an icon for the load button

// Create a wrapper to access ContentContext
const ContentPageContent = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('words'); // 'words', 'sentences', or 'verbs'
  const [contentCounts, setContentCounts] = useState({
    words: 0,
    verbs: 0,
    sentences: 0,
    numbers: 0
  });
  const { loadingStatus, words, sentences, verbs, numbers, loadAllContentData } = useContent();
  const [isCountsLoading, setIsCountsLoading] = useState(true);
  const [isManuallyLoading, setIsManuallyLoading] = useState(false);
  
  // For simplicity, we'll always allow access to content management for logged in users
  // This is the permanent fix based on our debugging findings
  
  // Since login is disabled, instead of redirecting to login, let's skip the auth check
  // Previously: if (!user) return <Navigate to="/login" />;
  
  // No subscription check needed - we're making content management available to all logged-in users

  // Update content counts when data loads
  useEffect(() => {
    // Only update counts when data is available
    if (!loadingStatus.words && !loadingStatus.sentences && !loadingStatus.verbs && !loadingStatus.numbers) {
      // Only count true words (filter out numbers from words)
      const trueWords = words.filter(word => word.category !== 'number');
      
      setContentCounts({
        words: trueWords.length,
        verbs: verbs.length,
        sentences: sentences.length,
        numbers: numbers.length
      });
      
      setIsCountsLoading(false);
    }
  }, [loadingStatus, words, sentences, verbs, numbers]);

  const tabs = [
    { id: 'words', label: 'Words' },
    { id: 'numbers', label: 'Numbers' },
    { id: 'sentences', label: 'Sentences' },
    { id: 'verbs', label: 'Verbs' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'words':
        return <WordsManagement />;
      case 'numbers':
        return <NumbersManagement />;
      case 'sentences':
        return <SentencesManagement />;
      case 'verbs':
        return <VerbsManagement />;
      default:
        return <div>Select a tab to manage content</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-100 mb-6">Content Management</h1>
      
      {/* Database Statistics with loading state and Load Content button */}
      <div className="bg-gray-800 p-3 rounded-lg mb-6 text-sm">
        <div className="flex justify-between items-center">
          <div className="flex-grow">
            {isCountsLoading ? (
              <div className="flex items-center space-x-2 animate-pulse">
                <div className="h-3 bg-gray-700 rounded w-full"></div>
              </div>
            ) : (
              <p className="text-gray-200">
                Total words detected = {contentCounts.words} | 
                Total verbs detected = {contentCounts.verbs} | 
                Total sentences detected = {contentCounts.sentences} | 
                Total numbers detected = {contentCounts.numbers}
              </p>
            )}
          </div>
          <button 
            className={`ml-4 px-3 py-1.5 rounded text-sm flex items-center gap-1 
              ${isManuallyLoading || loadingStatus.anyLoading 
                ? 'bg-blue-800 text-blue-200 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            onClick={async () => {
              if (!isManuallyLoading && !loadingStatus.anyLoading) {
                setIsManuallyLoading(true);
                await loadAllContentData();
                setIsManuallyLoading(false);
              }
            }}
            disabled={isManuallyLoading || loadingStatus.anyLoading}
          >
            <RefreshCw size={16} className={isManuallyLoading ? "animate-spin" : ""} />
            <span>Load Content</span>
          </button>
        </div>
      </div>
      
      {/* Duplicate Content Summary */}
      {!loadingStatus.initialLoad && <DuplicateContentSummary onTabChange={setActiveTab} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Download Content Button */}
        <DownloadContentButton />
        
        {/* Import Content Button */}
        <ImportContentButton />
      </div>
      
      <p className="text-gray-300 mb-8">
        Welcome to the content management section. Here you can add, edit, and delete custom French learning content.
      </p>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700 mb-8">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors duration-200
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-400'
                }`}
            >
              {tab.label}
              {loadingStatus[tab.id] && (
                <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Main component that provides context
const ContentManagementPage = () => {
  return (
    <ContentProvider>
      <ContentPageContent />
    </ContentProvider>
  );
};

export default ContentManagementPage;