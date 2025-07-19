// ContentManagerWithDirectVerbs.jsx
// Modified Content Manager that uses our new direct verb management implementation
import React, { useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import WordsManagement from './WordsManagement';
import SentencesManagement from './SentencesManagement';
import NumbersManagement from './NumbersManagement';
import ContentExportFix from './ContentExportFix';
import ContentImportFix from './ContentImportFix';
import NewVerbsManagement from './NewVerbsManagement'; // Use our new implementation

const ContentManagerWithDirectVerbs = () => {
  const [activeTab, setActiveTab] = useState('verbs'); // Always start with verbs tab
  const { loadingStatus } = useContent();
  
  const renderContent = () => {
    switch (activeTab) {
      case 'words':
        return <WordsManagement />;
      case 'verbs':
        return <NewVerbsManagement />; // Use the new direct implementation
      case 'sentences':
        return <SentencesManagement />;
      case 'numbers':
        return <NumbersManagement />;
      case 'import-export':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Content Backup & Restore</h2>
              <div className="bg-gray-700 p-4 rounded-md mb-4">
                <ContentExportFix />
              </div>
              <div className="bg-gray-700 p-4 rounded-md">
                <ContentImportFix />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">
        Content Manager <span className="text-blue-400 text-sm">with Direct Verb Implementation</span>
      </h1>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex overflow-x-auto pb-2">
          <button 
            onClick={() => setActiveTab('words')}
            className={`px-4 py-2 font-medium text-sm rounded-t-md mr-1 ${
              activeTab === 'words' ? 'bg-gray-800 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Words
          </button>
          <button 
            onClick={() => setActiveTab('verbs')}
            className={`px-4 py-2 font-medium text-sm rounded-t-md mr-1 ${
              activeTab === 'verbs' ? 'bg-gray-800 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Verbs
          </button>
          <button 
            onClick={() => setActiveTab('sentences')}
            className={`px-4 py-2 font-medium text-sm rounded-t-md mr-1 ${
              activeTab === 'sentences' ? 'bg-gray-800 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Sentences
          </button>
          <button 
            onClick={() => setActiveTab('numbers')}
            className={`px-4 py-2 font-medium text-sm rounded-t-md mr-1 ${
              activeTab === 'numbers' ? 'bg-gray-800 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Numbers
          </button>
          <button 
            onClick={() => setActiveTab('import-export')}
            className={`px-4 py-2 font-medium text-sm rounded-t-md ${
              activeTab === 'import-export' ? 'bg-gray-800 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Import/Export
          </button>
        </nav>
      </div>
      
      {/* Content Area */}
      <div className="bg-gray-800 rounded-md p-4 shadow-lg min-h-96">
        {loadingStatus.initialLoad ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-400">Loading database...</div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default ContentManagerWithDirectVerbs;