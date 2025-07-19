// NewVerbsManagement.jsx
// A completely new implementation of verb management that uses DirectVerbService
// to bypass problematic data chains and directly interact with IndexedDB
import React, { useState, useEffect } from 'react';
import * as DirectVerbService from '../../services/DirectVerbService';
import VerbEditor from './VerbEditor';

const NewVerbsManagement = () => {
  // State variables
  const [verbs, setVerbs] = useState([]);
  const [editingVerbId, setEditingVerbId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [debug, setDebug] = useState({
    lastOperation: null,
    lastResult: null,
    showPanel: false
  });

  // Load verbs when component mounts or refreshTrigger changes
  useEffect(() => {
    const loadVerbs = async () => {
      try {
        setLoading(true);
        const loadedVerbs = await DirectVerbService.getAllVerbs();
        console.log(`NewVerbsManagement: Loaded ${loadedVerbs.length} verbs`);
        setVerbs(loadedVerbs);
        setLoading(false);
      } catch (error) {
        console.error('NewVerbsManagement: Error loading verbs:', error);
        setNotification({
          type: 'error',
          message: `Failed to load verbs: ${error.message || 'Unknown error'}`
        });
        setLoading(false);
      }
    };
    
    loadVerbs();
  }, [refreshTrigger]);

  // Show notification message
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000); // Auto-dismiss after 3 seconds
  };

  // Handle edit button click
  const handleEditClick = (verb) => {
    setEditingVerbId(verb.id);
    setDebug(prev => ({
      ...prev,
      lastOperation: 'edit-start',
      lastResult: verb
    }));
  };

  // Handle delete button click
  const handleDeleteClick = async (verb) => {
    if (window.confirm(`Are you sure you want to delete the verb "${verb.infinitive}"?`)) {
      try {
        setDebug(prev => ({
          ...prev,
          lastOperation: 'delete-start',
          lastResult: verb
        }));
        
        const result = await DirectVerbService.deleteVerb(verb.id);
        
        setDebug(prev => ({
          ...prev,
          lastOperation: 'delete-complete',
          lastResult: result
        }));
        
        if (result.success) {
          showNotification('success', `Verb "${verb.infinitive}" deleted successfully!`);
          // Refresh verbs list
          setRefreshTrigger(prev => prev + 1);
        } else {
          showNotification('error', `Failed to delete verb: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('NewVerbsManagement: Error deleting verb:', error);
        showNotification('error', `Failed to delete verb: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingVerbId(null);
  };

  // Handle edit success
  const handleEditSuccess = (updatedVerb) => {
    setDebug(prev => ({
      ...prev,
      lastOperation: 'edit-success',
      lastResult: updatedVerb
    }));
    
    // Show notification
    showNotification('success', `Verb "${updatedVerb.infinitive}" updated successfully!`);
    
    // Refresh verbs list
    setRefreshTrigger(prev => prev + 1);
    
    // Close editor
    setEditingVerbId(null);
  };

  // Filter verbs based on search term and selected group
  const filteredVerbs = verbs.filter(verb => {
    // Filter by search term
    const matchesSearchTerm = searchTerm === '' || 
      (verb.infinitive && verb.infinitive.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (verb.english && verb.english.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by group
    const matchesGroup = selectedGroup === 'all' || verb.group === selectedGroup;
    
    return matchesSearchTerm && matchesGroup;
  });

  // Group verbs by group for display
  const groupVerbs = (verbsList) => {
    const grouped = {};
    
    verbsList.forEach(verb => {
      const group = verb.group || '4'; // Default to group 4 (irregular) if not specified
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(verb);
    });
    
    return grouped;
  };

  // Get group name
  const getGroupName = (groupId) => {
    switch (groupId) {
      case '1': return '1st Group (-er)';
      case '2': return '2nd Group (-ir)';
      case '3': return '3rd Group (-re)';
      case '4': return 'Irregular Verbs';
      default: return `Group ${groupId}`;
    }
  };

  // If editing a verb, show the VerbEditor
  if (editingVerbId) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-100">Edit Verb</h2>
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            onClick={handleEditCancel}
          >
            Back to Verbs List
          </button>
        </div>
        
        <VerbEditor
          verbId={editingVerbId}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">
          Verbs Management <span className="text-sm text-blue-400">(New Direct Implementation)</span>
        </h2>
        <div className="flex space-x-2">
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
            onClick={() => setDebug(prev => ({ ...prev, showPanel: !prev.showPanel }))}
          >
            {debug.showPanel ? 'Hide Debug' : 'Show Debug'}
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            disabled={loading}
          >
            Refresh Verbs
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      {debug.showPanel && (
        <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-700">
          <h3 className="text-sm text-gray-400 font-semibold mb-2">Debug Information</h3>
          <div className="text-xs font-mono overflow-x-auto whitespace-pre text-gray-300 max-h-40 overflow-y-auto">
            <div>Last Operation: {debug.lastOperation || 'None'}</div>
            <div>Last Result: {JSON.stringify(debug.lastResult, null, 2)}</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex space-x-2 mb-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-gray-400">Loading verbs...</p>
        </div>
      ) : (
        <>
          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            {/* Search input */}
            <div>
              <input
                type="text"
                placeholder="Search verbs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            
            {/* Group filter */}
            <div>
              <label className="block text-gray-400 mb-1">Filter by Group</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGroup('all')}
                  className={`px-3 py-1 rounded-full text-sm ${selectedGroup === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  All Groups
                </button>
                <button
                  onClick={() => setSelectedGroup('1')}
                  className={`px-3 py-1 rounded-full text-sm ${selectedGroup === '1' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  1st Group (-er)
                </button>
                <button
                  onClick={() => setSelectedGroup('2')}
                  className={`px-3 py-1 rounded-full text-sm ${selectedGroup === '2' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  2nd Group (-ir)
                </button>
                <button
                  onClick={() => setSelectedGroup('3')}
                  className={`px-3 py-1 rounded-full text-sm ${selectedGroup === '3' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  3rd Group (-re)
                </button>
                <button
                  onClick={() => setSelectedGroup('4')}
                  className={`px-3 py-1 rounded-full text-sm ${selectedGroup === '4' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  Irregular Verbs
                </button>
              </div>
            </div>
          </div>

          {/* Verbs List */}
          {filteredVerbs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {searchTerm || selectedGroup !== 'all' ? "No matching verbs found" : "No verbs available yet"}
            </div>
          ) : (
            <>
              <div className="mb-2 text-sm text-gray-400">
                Showing {filteredVerbs.length} verbs
              </div>
              
              {/* Group verbs and display by group */}
              {Object.entries(groupVerbs(filteredVerbs)).map(([groupId, groupVerbs]) => (
                <div key={groupId} className="mb-6">
                  <div className="bg-gray-800 px-4 py-2 rounded-t-md border-b border-gray-700 flex justify-between items-center">
                    <span className="bg-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      {getGroupName(groupId)}
                    </span>
                    <span className="text-gray-400 text-sm">{groupVerbs.length} verbs</span>
                  </div>
                  <div className="bg-gray-900 rounded-b-md divide-y divide-gray-800">
                    {groupVerbs.map((verb) => (
                      <div key={verb.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{verb.infinitive}</h3>
                            <p className="text-gray-400">{verb.english}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditClick(verb)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Edit
                            </button>
                            {!verb.isPredefined && (
                              <button
                                onClick={() => handleDeleteClick(verb)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Display conjugations */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {verb.conjugations && Object.entries(verb.conjugations).map(([subject, forms]) => (
                            <div key={subject} className="text-sm">
                              <span className="text-gray-500">{subject}:</span>{' '}
                              <span className="text-gray-300">{forms[0] || ''}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Display metadata */}
                        <div className="mt-2 text-xs text-gray-500">
                          {verb.isPredefined ? 'System Verb' : 'User Verb'} • 
                          Last updated: {new Date(verb.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default NewVerbsManagement;