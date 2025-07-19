// VerbGroupFilter.jsx
// A component for filtering verbs by group
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VERB_GROUPS = [
  { id: 'all', name: 'All Groups', count: 0 },
  { id: '1', name: '1st Group (-er)', count: 0 },
  { id: '2', name: '2nd Group (-ir)', count: 0 },
  { id: '3', name: '3rd Group (-re)', count: 0 },
  { id: '4', name: 'Irregular Verbs', count: 0 }
];

const VerbGroupFilter = ({ verbs = [], onFilterChange }) => {
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [groups, setGroups] = useState(VERB_GROUPS);
  
  // Update groups with counts whenever verbs change
  useEffect(() => {
    if (!verbs || verbs.length === 0) {
      const resetGroups = VERB_GROUPS.map(group => ({
        ...group,
        count: group.id === 'all' ? 0 : 0
      }));
      setGroups(resetGroups);
      return;
    }
    
    // Count verbs in each group
    const groupCounts = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0
    };
    
    verbs.forEach(verb => {
      const group = verb.group || '4'; // Default to irregular if no group specified
      if (groupCounts[group] !== undefined) {
        groupCounts[group]++;
      } else {
        groupCounts['4']++; // Count as irregular if unknown group
      }
    });
    
    // Update groups with new counts
    const updatedGroups = VERB_GROUPS.map(group => ({
      ...group,
      count: group.id === 'all' ? verbs.length : (groupCounts[group.id] || 0)
    }));
    
    setGroups(updatedGroups);
  }, [verbs]);
  
  // Handle group selection
  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);
    if (onFilterChange) {
      onFilterChange(groupId);
    }
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm text-gray-400">Filter by Group:</label>
      <div className="flex flex-wrap gap-2">
        {groups.map(group => (
          <button
            key={group.id}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedGroup === group.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => handleGroupSelect(group.id)}
          >
            {group.name} <span className="text-xs ml-1">({group.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

VerbGroupFilter.propTypes = {
  verbs: PropTypes.array,
  onFilterChange: PropTypes.func.isRequired
};

export default VerbGroupFilter;