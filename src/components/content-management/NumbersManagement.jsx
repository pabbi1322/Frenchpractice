// NumbersManagement.jsx
// Component for managing number entries
import React, { useState, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import NumbersList from './lists/NumbersList';
import NumberForm from './forms/NumberForm';
import { toast } from 'react-toastify';
import DuplicateContentDisplay from './DuplicateContentDisplay';

const NumbersManagement = () => {
  const { 
    numbers, 
    addNumber, 
    updateNumber, 
    deleteNumber,
    loadingStatus,
    error 
  } = useContent();
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter numbers based on search term
  const filteredNumbers = numbers.filter(
    number => 
      number.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (Array.isArray(number.french) ? 
        number.french.some(f => f.toLowerCase().includes(searchTerm.toLowerCase())) : 
        number.french.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Separate predefined and user-added numbers
  const userNumbers = filteredNumbers.filter(number => !number.isPredefined);
  const predefinedNumbers = filteredNumbers.filter(number => number.isPredefined);
  
  // Sort numbers numerically
  const sortedUserNumbers = [...userNumbers].sort((a, b) => {
    const numA = parseFloat(a.english);
    const numB = parseFloat(b.english);
    return numA - numB;
  });
  
  const sortedPredefinedNumbers = [...predefinedNumbers].sort((a, b) => {
    const numA = parseFloat(a.english);
    const numB = parseFloat(b.english);
    return numA - numB;
  });
  
  // Combined sorted array
  const sortedNumbers = [...sortedUserNumbers, ...sortedPredefinedNumbers];

  const handleAdd = () => {
    setEditingItem(null);
    setShowForm(true);
  };
  
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };
  
  const handleDelete = async (itemOrId) => {
    try {
      // Handle both cases: when passed an ID directly or when passed an item object
      const id = typeof itemOrId === 'object' ? itemOrId.id : itemOrId;
      
      console.log(`NumbersManagement: Attempting to delete number with ID: ${id}`);
      
      // Find the number to delete for debugging
      const numberToDelete = numbers.find(n => n.id === id);
      console.log(`NumbersManagement: Number to delete:`, numberToDelete);
      
      if (!numberToDelete) {
        console.error(`NumbersManagement: Cannot find number with ID ${id} to delete`);
        toast.error("Cannot find number to delete");
        return;
      }
      
      if (window.confirm(`Are you sure you want to delete the number ${numberToDelete.french}: ${numberToDelete.english}?`)) {
        console.log(`NumbersManagement: User confirmed deletion`);
        
        const result = await deleteNumber(id);
        console.log(`NumbersManagement: Delete result:`, result);
        
        if (result && result.success) {
          console.log(`NumbersManagement: Number deletion successful`);
          toast.success("Number deleted successfully");
          
          // Verify if the number was actually removed from state
          setTimeout(() => {
            const stillExists = numbers.some(n => n.id === id);
            if (stillExists) {
              console.warn(`NumbersManagement: Number with ID ${id} still exists in state after successful deletion`);
              // This is just a UI check, the actual data should have been deleted in DB
            } else {
              console.log(`NumbersManagement: Number confirmed deleted from state`);
            }
          }, 500);
        } else {
          console.error(`NumbersManagement: Delete failed with error:`, result ? result.error : 'Unknown error');
          toast.error(`Failed to delete number: ${result ? result.error : 'Unknown error'}`);
        }
      } else {
        console.log(`NumbersManagement: User cancelled deletion`);
      }
    } catch (error) {
      console.error("Error deleting number:", error);
      toast.error(`Error deleting number: ${error.message || 'Unknown error'}`);
    }
  };
  
  const handleSubmit = async (data) => {
    try {
      // Always set category to 'number' for this component
      data.category = 'number';
      
      let result;
      if (editingItem) {
        result = await updateNumber(editingItem.id, {...data});
        if (result && result.success) {
          toast.success("Number updated successfully");
          setShowForm(false);
          setEditingItem(null);
        } else {
          toast.error(`Failed to update number: ${result ? result.error : 'Unknown error'}`);
        }
      } else {
        result = await addNumber(data);
        if (result && result.success) {
          toast.success("Number added successfully");
          // Don't hide form - let user keep adding numbers
          // Focus reset is handled in the NumberForm component
        } else {
          toast.error(`Failed to add number: ${result ? result.error : 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Error saving number:", error);
      toast.error(`Error saving number: ${error.message || 'Unknown error'}`);
    }
  };
  
  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
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
    
    // If we're still loading numbers but database is initialized, show numbers-specific loading
    if (loadingStatus.numbers) {
      return (
        <div className="py-3 text-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-300">Loading numbers...</span>
          </div>
        </div>
      );
    }
    
    return null;
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading numbers: {error.message}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Numbers Management</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          disabled={loadingStatus.numbers}
        >
          Add New Number
        </button>
      </div>
      
      {/* Show loading state if necessary */}
      {renderLoadingState()}
      
      {/* Duplicate Content Display */}
      {!loadingStatus.initialLoad && <DuplicateContentDisplay contentType="numbers" onEdit={handleEdit} onDelete={handleDelete} />}
      
      {/* Search input */}
      {!loadingStatus.numbers && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
      )}
      
      {showForm && (
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">
            {editingItem ? "Edit Number" : "Add New Number"}
          </h3>
          <NumberForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={editingItem}
          />
        </div>
      )}
      
      {/* Skeleton loader for numbers */}
      {loadingStatus.numbers && !loadingStatus.initialLoad && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800 rounded p-4 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
            </div>
          ))}
        </div>
      )}
      
      {/* Show content only when not loading */}
      {!loadingStatus.numbers && (
        <>
          {filteredNumbers.length === 0 && !showForm && (
            <div className="text-center py-12 text-gray-400">
              {searchTerm ? "No matching numbers found" : "No numbers available yet"}
            </div>
          )}
          
          {/* User-added numbers */}
          {userNumbers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl text-gray-100 mb-4">Your Numbers</h3>
              <NumbersList
                numbers={sortedUserNumbers}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
          
          {/* Predefined numbers */}
          {predefinedNumbers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl text-gray-100 mb-4">System Numbers</h3>
              <NumbersList
                numbers={sortedPredefinedNumbers}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NumbersManagement;