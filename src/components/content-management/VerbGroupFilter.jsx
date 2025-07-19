// VerbGroupFilter.jsx
// Component for filtering verbs by group
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VerbGroupFilter = ({ onFilterChange }) => {
  const [verbGroups, setVerbGroups] = useState([
    { id: 'all', name: 'All Groups' },
    { id: '1', name: '1st Group (-er)' },
    { id: '2', name: '2nd Group (-ir)' },
    { id: '3', name: '3rd Group (-re)' },
    { id: '4', name: 'Irregular Verbs' }
  ]);
  const [selectedGroup, setSelectedGroup] = useState('all'); // 'all' is a special value for all groups
  
  // Handle group selection
  const handleGroupChange = (e) => {
    const newGroup = e.target.value;
    setSelectedGroup(newGroup);
    onFilterChange(newGroup);
  };
  
  return (
    <div className="flex items-center space-x-2 mb-4">
      <label htmlFor="group-filter" className="text-sm font-medium text-gray-300">
        Filter by group:
      </label>
      <select
        id="group-filter"
        value={selectedGroup}
        onChange={handleGroupChange}
        className="bg-gray-700 text-white border border-gray-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {verbGroups.map(group => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  );
};

VerbGroupFilter.propTypes = {
  onFilterChange: PropTypes.func.isRequired
};

export default VerbGroupFilter;