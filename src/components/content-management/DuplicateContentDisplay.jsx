// DuplicateContentDisplay.jsx
// A component to display duplicate content items
import React, { useState, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import DuplicateDetectionService from '../../services/DuplicateDetectionService';

const DuplicateContentDisplay = ({ contentType, onEdit, onDelete }) => {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const loadDuplicates = async () => {
      setLoading(true);
      try {
        let duplicateData = [];
        
        switch (contentType) {
          case 'words':
            duplicateData = await DuplicateDetectionService.findDuplicateWords();
            break;
          case 'verbs':
            duplicateData = await DuplicateDetectionService.findDuplicateVerbs();
            break;
          case 'sentences':
            duplicateData = await DuplicateDetectionService.findDuplicateSentences();
            break;
          case 'numbers':
            duplicateData = await DuplicateDetectionService.findDuplicateNumbers();
            break;
          default:
            duplicateData = [];
        }
        
        setDuplicates(duplicateData);
      } catch (error) {
        console.error(`Error loading duplicate ${contentType}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDuplicates();
  }, [contentType]);
  
  const toggleExpand = (index) => {
    setExpanded(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  if (loading) {
    return (
      <div className="py-3 text-center text-gray-400">
        <span className="animate-pulse">Checking for duplicates...</span>
      </div>
    );
  }
  
  if (duplicates.length === 0) {
    return (
      <div className="py-3 text-center text-gray-400">
        No duplicates found in {contentType}.
      </div>
    );
  }
  
  // Render content based on type
  const renderContent = (item) => {
    switch (contentType) {
      case 'words':
        return (
          <div>
            <div className="font-medium">{Array.isArray(item.french) ? item.french.join(', ') : item.french}</div>
            <div className="text-sm text-gray-400">{item.english}</div>
          </div>
        );
      case 'verbs':
        return (
          <div>
            <div className="font-medium">{item.infinitive}</div>
            <div className="text-sm text-gray-400">{item.english}</div>
          </div>
        );
      case 'sentences':
        return (
          <div>
            <div className="font-medium">{Array.isArray(item.french) ? item.french.join(', ') : item.french}</div>
            <div className="text-sm text-gray-400">{item.english}</div>
          </div>
        );
      case 'numbers':
        return (
          <div>
            <div className="font-medium">{Array.isArray(item.french) ? item.french.join(', ') : item.french}</div>
            <div className="text-sm text-gray-400">{item.english}</div>
          </div>
        );
      default:
        return <div>Unknown content type</div>;
    }
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-lg text-yellow-400 mb-3">
        {duplicates.length} duplicate {contentType} found:
      </h3>
      
      <div className="space-y-4">
        {duplicates.map((group, index) => (
          <div 
            key={`duplicate-group-${index}`} 
            className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
          >
            <div 
              className="p-3 bg-gray-700 flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpand(index)}
            >
              <div>
                <span className="text-yellow-300 font-medium mr-2">
                  {group.type === 'infinitive' ? 'Duplicate verb:' : `Duplicate ${group.type}:`}
                </span>
                <span>{group.key}</span>
              </div>
              <div className="flex items-center">
                <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                  {group.items.length} duplicates
                </span>
                <svg 
                  className={`w-5 h-5 ml-2 transform transition-transform ${expanded[index] ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {expanded[index] && (
              <div className="p-3 border-t border-gray-700">
                <div className="space-y-2">
                  {group.items.map((item, itemIndex) => (
                    <div 
                      key={`item-${item.id || itemIndex}`}
                      className="flex justify-between items-center p-2 bg-gray-750 hover:bg-gray-700 rounded"
                    >
                      <div className="flex-1">
                        {renderContent(item)}
                        <div className="mt-1 text-xs text-gray-500">
                          ID: {item.id || 'Unknown'} 
                          {item.isPredefined && <span className="ml-2">(System)</span>}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-400 hover:text-blue-300 px-2 py-1 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-400 hover:text-red-300 px-2 py-1 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DuplicateContentDisplay;