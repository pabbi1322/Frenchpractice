// VerbGroupFilterWithCheckboxes.jsx
// Component for filtering verbs by group using checkboxes
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VerbGroupFilterWithCheckboxes = ({ onFilterChange, selectedGroups = [] }) => {
  const [groups, setGroups] = useState([
    { id: '1', name: '1st Group (-er)' },
    { id: '2', name: '2nd Group (-ir)' },
    { id: '3', name: '3rd Group (-re)' },
    { id: '4', name: 'Irregular Verbs' }
  ]);

  // Toggle a group selection
  const toggleGroup = (groupId) => {
    let newSelectedGroups;
    
    if (selectedGroups.includes(groupId)) {
      // Remove group if already selected
      newSelectedGroups = selectedGroups.filter(id => id !== groupId);
    } else {
      // Add group if not selected
      newSelectedGroups = [...selectedGroups, groupId];
    }
    
    // Call the parent component's callback with the updated selection
    onFilterChange(newSelectedGroups);
  };

  // Select all groups
  const selectAllGroups = () => {
    const allGroupIds = groups.map(group => group.id);
    onFilterChange(allGroupIds);
  };

  // Deselect all groups
  const deselectAllGroups = () => {
    onFilterChange([]);
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4 mb-4 bg-gray-800">
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-medium text-gray-300">Filter by verb group:</label>
        <div className="flex space-x-2">
          <button 
            onClick={selectAllGroups}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
          >
            Select All
          </button>
          <button 
            onClick={deselectAllGroups}
            className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
          >
            Deselect All
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {groups.map(group => {
          const isSelected = selectedGroups.includes(group.id);
          // Use neutral colors for consistency
          const baseClass = "flex items-center border rounded-md px-3 py-1 cursor-pointer transition-colors";
          
          return (
            <div
              key={group.id}
              className={`${baseClass} ${isSelected ? 'bg-gray-600 text-white' : 'bg-gray-700 bg-opacity-50 text-gray-300'}`}
              onClick={() => toggleGroup(group.id)}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}} // Handled by parent div onClick
                className="mr-2"
              />
              <span>{group.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

VerbGroupFilterWithCheckboxes.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  selectedGroups: PropTypes.array
};

export default VerbGroupFilterWithCheckboxes;