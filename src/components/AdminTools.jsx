import React, { useState } from 'react';
import DeletePredefinedDataButton from './ui/DeletePredefinedDataButton';

const AdminTools = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteResults, setDeleteResults] = useState({});

  const handleDeleteComplete = (type, results) => {
    setDeleteResults(prev => ({
      ...prev,
      [type]: results
    }));
  };

  return (
    <div className="admin-tools mt-6 p-4 border rounded-lg bg-white">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left font-medium flex justify-between items-center"
      >
        <span className="text-lg">Advanced Database Management</span>
        <span className="text-xl">{isExpanded ? '−' : '+'}</span>
      </button>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="bg-red-50 border border-red-300 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-red-800 mb-2">Warning: Danger Zone</h3>
            <p className="mb-4 text-sm">
              These actions will permanently remove predefined content from your database.
              This is useful if you want to work exclusively with your own custom content.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="font-semibold mb-2">Delete Individual Content Types</h4>
                <div className="space-y-2">
                  <DeletePredefinedDataButton 
                    dataType="words" 
                    buttonText="Delete Predefined Words" 
                    onComplete={(results) => handleDeleteComplete('words', results)}
                  />
                  
                  <DeletePredefinedDataButton 
                    dataType="sentences" 
                    buttonText="Delete Predefined Sentences" 
                    onComplete={(results) => handleDeleteComplete('sentences', results)}
                  />
                  
                  <DeletePredefinedDataButton 
                    dataType="numbers" 
                    buttonText="Delete Predefined Numbers" 
                    onComplete={(results) => handleDeleteComplete('numbers', results)}
                  />
                  
                  <DeletePredefinedDataButton 
                    dataType="verbs" 
                    buttonText="Delete Predefined Verbs" 
                    onComplete={(results) => handleDeleteComplete('verbs', results)}
                  />
                </div>
              </div>
              
              <div className="border-l pl-4 border-red-200">
                <h4 className="font-semibold mb-2">Delete All Content At Once</h4>
                <DeletePredefinedDataButton 
                  dataType="all" 
                  buttonText="Delete ALL Predefined Content" 
                  onComplete={(results) => handleDeleteComplete('all', results)}
                  className="bg-red-700 hover:bg-red-800"
                />
                
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Advanced Database Tools</h4>
                  <div className="flex flex-col space-y-2">
                    <a 
                      href="/db-debug-enhanced.html" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-800 hover:bg-gray-900 text-white py-2 px-3 rounded text-center text-sm"
                    >
                      Enhanced Word Cleaner
                    </a>
                    <a 
                      href="/db-debug.html" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-700 hover:bg-gray-800 text-white py-2 px-3 rounded text-center text-sm"
                    >
                      Database Inspector
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {Object.keys(deleteResults).length > 0 && (
              <div className="mt-4 p-3 bg-white rounded border">
                <h4 className="font-medium mb-2">Deletion Results:</h4>
                <ul className="text-sm">
                  {Object.entries(deleteResults).map(([type, result]) => (
                    <li key={type} className="mb-1">
                      <strong className="capitalize">{type}:</strong> {' '}
                      {result.error ? (
                        <span className="text-red-600">Error: {result.error}</span>
                      ) : (
                        <>
                          {type === 'all' ? (
                            <>
                              Words: {result.words.deleted}/{result.words.total} deleted, 
                              Sentences: {result.sentences.deleted}/{result.sentences.total} deleted, 
                              Numbers: {result.numbers.deleted}/{result.numbers.total} deleted, 
                              Verbs: {result.verbs.deleted}/{result.verbs.total} deleted
                            </>
                          ) : (
                            <>{result.deleted}/{result.total} items deleted</>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTools;