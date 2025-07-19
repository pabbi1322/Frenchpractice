// VerbsManagement.jsx
// Component for managing verb entries
import React, { useState, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import VerbForm from './forms/VerbForm';
import VerbsList from './lists/VerbsList';
import DuplicateContentDisplay from './DuplicateContentDisplay';
import VerbGroupFilter from './VerbGroupFilter';
import { checkVerbIntegrity, repairVerb } from '../../services/VerbDebugService';

const VerbsManagement = () => {
  // Helper function to group verbs by group
  const groupVerbsByGroup = (verbsList) => {
    const groupedVerbs = [];
    const verbsByGroup = {};
    
    // Group verbs by their group
    verbsList.forEach(verb => {
      const groupId = verb.group || '4'; // Default to group 4 if not specified
      if (!verbsByGroup[groupId]) {
        verbsByGroup[groupId] = [];
      }
      verbsByGroup[groupId].push(verb);
    });
    
    // Convert to array structure with group info
    Object.entries(verbsByGroup).forEach(([groupId, verbs]) => {
      let groupName = "Unknown Group";
      
      // Map group IDs to names
      switch(groupId) {
        case '1': groupName = "1st Group (-er)"; break;
        case '2': groupName = "2nd Group (-ir)"; break;
        case '3': groupName = "3rd Group (-re)"; break;
        case '4': groupName = "Irregular Verbs"; break;
        default: groupName = `Group ${groupId}`;
      }
      
      groupedVerbs.push({
        group: {
          id: groupId,
          name: groupName,
          color: 'bg-gray-700'
        },
        verbs
      });
    });
    
    // Sort groups by name
    return groupedVerbs.sort((a, b) => a.group.id.localeCompare(b.group.id));
  };
  
  const { verbs, addVerb, updateVerb, deleteVerb, loadingStatus } = useContent();
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [editingVerb, setEditingVerb] = useState(null);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Show notification message
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000); // Auto-dismiss after 3 seconds
  };

  const handleAddClick = () => {
    setIsAddFormVisible(true);
    setEditingVerb(null);
  };

  const handleEditClick = (verb) => {
    setEditingVerb(verb);
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
    
    // If we're still loading verbs but database is initialized, show verbs-specific loading
    if (loadingStatus.verbs) {
      return (
        <div className="py-3 text-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-300">Loading verbs...</span>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const handleAddSubmit = async (verbData) => {
    try {
      const result = await addVerb(verbData);
      if (result && result.success) {
        showNotification('success', 'Verb added successfully!');
        // Don't hide form after adding - let user keep adding verbs
        // Focus reset is handled in the VerbForm component
      } else {
        showNotification('error', `Failed to add verb: ${result ? result.error : 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error adding verb:", error);
      showNotification('error', `Failed to add verb: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditSubmit = async (verbData) => {
    try {
      console.log(`VerbsManagement: Attempting to update verb with ID: ${editingVerb.id}`);
      console.log(`VerbsManagement: Form data submitted:`, verbData);
      
      // Create deep clone of original verb for comparison
      const originalVerb = JSON.parse(JSON.stringify(editingVerb));
      
      // Check original verb integrity - will be useful to diagnose issues
      const originalIntegrity = checkVerbIntegrity(originalVerb);
      console.log(`VerbsManagement: Original verb integrity check:`, 
                 originalIntegrity.valid ? 'VALID' : 'INVALID', 
                 originalIntegrity.issues || []);
      
      // Create a completely new object with explicit properties to avoid inheritance issues
      let transformedVerbData = {
        // Essential properties
        id: editingVerb.id,
        infinitive: verbData.frenchInfinitive,
        french: [verbData.frenchInfinitive], // Ensure french array is consistent with infinitive
        english: verbData.englishInfinitive,
        group: verbData.group || "1",
        
        // Create brand new conjugations object with explicit array values
        conjugations: {
          je: verbData.presentTense?.je ? [verbData.presentTense.je] : [""],
          tu: verbData.presentTense?.tu ? [verbData.presentTense.tu] : [""],
          il: verbData.presentTense?.il ? [verbData.presentTense.il] : [""],
          nous: verbData.presentTense?.nous ? [verbData.presentTense.nous] : [""],
          vous: verbData.presentTense?.vous ? [verbData.presentTense.vous] : [""],
          ils: verbData.presentTense?.ils ? [verbData.presentTense.ils] : [""]
        },
        
        // Add essential metadata
        createdAt: editingVerb.createdAt || new Date().toISOString(),
        createdBy: editingVerb.createdBy || 'user',
        isPredefined: editingVerb.isPredefined || false,
        updatedAt: new Date().toISOString()
      };
      
      // Check the transformed verb integrity before sending
      const transformedIntegrity = checkVerbIntegrity(transformedVerbData);
      console.log(`VerbsManagement: Transformed verb integrity check:`, 
                 transformedIntegrity.valid ? 'VALID' : 'INVALID', 
                 transformedIntegrity.issues || []);
      
      // If there are any integrity issues, repair the verb
      if (!transformedIntegrity.valid) {
        console.warn(`VerbsManagement: Integrity issues found in verb data, repairing...`);
        transformedVerbData = repairVerb(transformedVerbData);
        console.log(`VerbsManagement: Using repaired verb data instead:`, transformedVerbData);
      }
      
      console.log(`VerbsManagement: Conjugations before:`, JSON.stringify(originalVerb.conjugations));
      console.log(`VerbsManagement: Conjugations after:`, JSON.stringify(transformedVerbData.conjugations));
      
      // Make a deep clone to ensure no reference issues during transmission
      const safeVerbData = JSON.parse(JSON.stringify(transformedVerbData));
      console.log(`VerbsManagement: Final verb data being sent:`, safeVerbData);
      
      const result = await updateVerb(editingVerb.id, safeVerbData);
      console.log(`VerbsManagement: Update verb result:`, result);
      
      if (result && result.success) {
        console.log(`VerbsManagement: Verb update successful`);
        showNotification('success', 'Verb updated successfully!');
        setEditingVerb(null);
        
        // Reset verbs state to force re-fetch from database
        setTimeout(() => {
          // Check if our changes are reflected
          const updatedVerb = verbs.find(v => v.id === editingVerb.id);
          if (updatedVerb) {
            console.log(`VerbsManagement: Updated verb in state:`, updatedVerb);
            console.log(`VerbsManagement: Comparing update results:`, 
              JSON.stringify({
                originalInfinitive: originalVerb.infinitive,
                newInfinitive: updatedVerb.infinitive,
                sentInfinitive: safeVerbData.infinitive,
                originalEnglish: originalVerb.english,
                newEnglish: updatedVerb.english,
                sentEnglish: safeVerbData.english
              }));
            
            // Check if any key properties don't match what we sent
            if (updatedVerb.infinitive !== safeVerbData.infinitive || 
                updatedVerb.english !== safeVerbData.english) {
              console.warn(`VerbsManagement: Verb update may not have been applied correctly - forcing refresh`);
              // Force a reload of the page to get fresh data
              window.location.reload();
            } else {
              console.log(`VerbsManagement: Verb update confirmed in state`);
            }
          } else {
            console.error(`VerbsManagement: Updated verb not found in state after update!`);
          }
        }, 1000); // Increased timeout to ensure database operation completes
      } else {
        console.error(`VerbsManagement: Update verb failed with error:`, result ? result.error : 'Unknown error');
        showNotification('error', `Failed to update verb: ${result ? result.error : 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating verb:", error);
      showNotification('error', `Failed to update verb: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this verb?')) {
      try {
        console.log(`VerbsManagement: Attempting to delete verb with ID: ${id}`);
        
        // Find the verb we're about to delete for debugging
        const verbToDelete = verbs.find(v => v.id === id);
        console.log(`VerbsManagement: Verb to delete:`, verbToDelete);
        
        const result = await deleteVerb(id);
        console.log(`VerbsManagement: Delete verb result:`, result);
        
        if (result && result.success) {
          console.log(`VerbsManagement: Verb deletion successful`);
          showNotification('success', 'Verb deleted successfully!');
          
          // Check if the verb is really gone from the state
          setTimeout(() => {
            const stillExists = verbs.some(v => v.id === id);
            if (stillExists) {
              console.warn(`VerbsManagement: Verb with ID ${id} still exists in state after successful deletion`);
              // Force update the UI by filtering the verb out
              // This is just a UI fix, the actual data should have been deleted in the DB
              const updatedVerbs = verbs.filter(v => v.id !== id);
              console.log(`VerbsManagement: Forced UI update, removed verb with ID ${id}`);
            } else {
              console.log(`VerbsManagement: Verb confirmed deleted from state`);
            }
          }, 500);
        } else {
          console.error(`VerbsManagement: Delete verb failed with error:`, result ? result.error : 'Unknown error');
          showNotification('error', `Failed to delete verb: ${result ? result.error : 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Error deleting verb:", error);
        showNotification('error', `Failed to delete verb: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleCancel = () => {
    setIsAddFormVisible(false);
    setEditingVerb(null);
  };

  // Set up refresh interval to check for verb groups
  useEffect(() => {
    // Set up an interval to refresh the group list
    const refreshInterval = setInterval(() => {
      // We'll just force a re-render to show any new groups that might have been added
      setSelectedGroup(currentGroup => currentGroup);
    }, 5000); // Check every 5 seconds for consistency with category refresh
    
    // Clean up on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Filter verbs based on search term and selected group
  const filteredVerbs = verbs.filter(
    verb => {
      try {
        // First, check if the verb matches the search term
        let matchesSearchTerm = true;
        if (searchTerm.trim() !== '') {
          // Check infinitive match
          const infinitiveMatch = verb.infinitive && 
            verb.infinitive.toLowerCase().includes(searchTerm.toLowerCase());
          
          // Check english match
          const englishMatch = verb.english && 
            verb.english.toLowerCase().includes(searchTerm.toLowerCase());
          
          matchesSearchTerm = infinitiveMatch || englishMatch;
        }
        
        // Then, check if the verb belongs to the selected group
        let matchesSelectedGroup = true;
        if (selectedGroup !== 'all') {
          matchesSelectedGroup = verb.group === selectedGroup;
        }
        
        return matchesSearchTerm && matchesSelectedGroup;
      } catch (error) {
        console.error('Error filtering verb:', error, verb);
        return false;
      }
    }
  );

  // Filter out predefined verbs and user-added verbs
  const userVerbs = filteredVerbs.filter(verb => !verb.isPredefined);
  const predefinedVerbs = filteredVerbs.filter(verb => verb.isPredefined);
  
  // For backwards compatibility, if no group is specified, assign to group 4 (irregular)
  filteredVerbs.forEach(verb => {
    if (!verb.group) {
      if (verb.infinitive && verb.infinitive.endsWith('er')) {
        verb.group = '1';
      } else if (verb.infinitive && verb.infinitive.endsWith('ir')) {
        verb.group = '2';
      } else if (verb.infinitive && verb.infinitive.endsWith('re')) {
        verb.group = '3';
      } else {
        verb.group = '4'; // Irregular
      }
    }
  });
  
  // Transform any necessary verb data before it's displayed
  useEffect(() => {
    // Process any verbs that need transformation
    filteredVerbs.forEach(verb => {
      // Ensure conjugations object exists and has proper format
      if (!verb.conjugations) {
        verb.conjugations = {
          je: [""],
          tu: [""],
          il: [""],
          nous: [""],
          vous: [""],
          ils: [""]
        };
      }
      
      // Make sure all required properties exist
      if (!verb.infinitive) verb.infinitive = "";
      if (!verb.english) verb.english = "";
      
      // Ensure group is set
      if (!verb.group) {
        if (verb.infinitive.endsWith('er')) {
          verb.group = '1';
        } else if (verb.infinitive.endsWith('ir')) {
          verb.group = '2';
        } else if (verb.infinitive.endsWith('re')) {
          verb.group = '3';
        } else {
          verb.group = '4'; // Default to irregular
        }
      }
    });
  }, [filteredVerbs]);

  return (
    <div>
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded ${notification.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-100">Verbs Management</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-all duration-200"
          onClick={handleAddClick}
          disabled={loadingStatus.verbs}
        >
          Add New Verb
        </button>
      </div>

      {/* Show loading state if necessary */}
      {renderLoadingState()}

      {/* Duplicate Content Display */}
      {!loadingStatus.initialLoad && <DuplicateContentDisplay contentType="verbs" onEdit={handleEditClick} onDelete={handleDeleteClick} />}

      {/* Search and Filter Controls */}
      {!loadingStatus.verbs && (
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
            <VerbGroupFilter 
              verbs={verbs}
              onFilterChange={setSelectedGroup}
            />
          </div>
        </div>
      )}

      {/* Add Form */}
      {isAddFormVisible && (
        <div className="bg-gray-800 p-4 rounded-md mb-6 border border-gray-700">
          <h3 className="text-xl mb-4 text-gray-100">Add New Verb</h3>
          <VerbForm onSubmit={handleAddSubmit} onCancel={handleCancel} />
        </div>
      )}

      {/* Edit Form */}
      {editingVerb && (
        <div className="bg-gray-800 p-4 rounded-md mb-6 border border-gray-700">
          <h3 className="text-xl mb-4 text-gray-100">Edit Verb</h3>
          <VerbForm
            initialData={{
              frenchInfinitive: editingVerb.infinitive,
              englishInfinitive: editingVerb.english,
              group: editingVerb.group || "1",
              presentTense: {
                je: editingVerb.conjugations?.je?.[0] || "",
                tu: editingVerb.conjugations?.tu?.[0] || "",
                il: editingVerb.conjugations?.il?.[0] || "",
                nous: editingVerb.conjugations?.nous?.[0] || "",
                vous: editingVerb.conjugations?.vous?.[0] || "",
                ils: editingVerb.conjugations?.ils?.[0] || ""
              }
            }}
            onSubmit={handleEditSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Skeleton loader for verbs */}
      {loadingStatus.verbs && !loadingStatus.initialLoad && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800 rounded p-4 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Show content only when not loading */}
      {!loadingStatus.verbs && (
        <>
          {filteredVerbs.length === 0 && !isAddFormVisible && !editingVerb && (
            <div className="text-center py-12 text-gray-400">
              {searchTerm ? "No matching verbs found" : "No verbs available yet"}
            </div>
          )}

          {/* User Verbs by Group */}
          {userVerbs.length > 0 && (
            <>
              <h3 className="text-xl text-gray-100 mb-2 mt-8">Your Verbs</h3>
              
              {/* Group verbs by group */}
              {groupVerbsByGroup(userVerbs).map(({ group, verbs }) => (
                <div key={group.id} className="mb-6">
                  <div className="bg-gray-800 px-4 py-2 rounded-t-md border-b border-gray-700 flex justify-between items-center">
                    <span className={`${group.color} px-3 py-1 rounded-full text-sm font-medium`}>
                      {group.name}
                    </span>
                    <span className="text-gray-400 text-sm">{verbs.length} verbs</span>
                  </div>
                  <div className="bg-gray-900 rounded-b-md">
                    <VerbsList verbs={verbs} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Predefined Verbs by Group */}
          {predefinedVerbs.length > 0 && (
            <>
              <h3 className="text-xl text-gray-100 mb-2 mt-8">System Verbs</h3>
              
              {/* Group verbs by group */}
              {groupVerbsByGroup(predefinedVerbs).map(({ group, verbs }) => (
                <div key={group.id} className="mb-6">
                  <div className="bg-gray-800 px-4 py-2 rounded-t-md border-b border-gray-700 flex justify-between items-center">
                    <span className={`${group.color} px-3 py-1 rounded-full text-sm font-medium`}>
                      {group.name}
                    </span>
                    <span className="text-gray-400 text-sm">{verbs.length} verbs</span>
                  </div>
                  <div className="bg-gray-900 rounded-b-md">
                    <VerbsList verbs={verbs} onEdit={handleEditClick} onDelete={handleDeleteClick} />
                  </div>
                </div>
              ))}
            </>
          )}

          {verbs.length === 0 && searchTerm === '' && (
            <div className="py-6 text-center text-gray-400">
              No verbs available. Add some verbs to get started!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VerbsManagement;