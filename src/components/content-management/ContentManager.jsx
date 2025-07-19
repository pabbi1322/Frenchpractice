import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FrenchDataService from '../../services/FrenchDataService';
import { useToast } from '../../contexts/ToastContext';
import ContentExportFix from './ContentExportFix';
import ContentImportFix from './ContentImportFix';

const ContentManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [verbStats, setVerbStats] = useState(null);
  const [totalVerbs, setTotalVerbs] = useState(0);
  const { showToast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadVerbCount = async () => {
      try {
        const verbs = await FrenchDataService.getAllVerbs();
        setTotalVerbs(verbs.length);
      } catch (error) {
        console.error('Error loading verb count:', error);
      }
    };
    
    loadVerbCount();
  }, []);

  const handleFixVerbs = async () => {
    setIsLoading(true);
    try {
      const result = await FrenchDataService.fixVerbConjugations();
      setVerbStats(result);
      showToast('Verb conjugations fixed successfully', 'success');
      
      // Update total verbs after fix
      const verbs = await FrenchDataService.getAllVerbs();
      setTotalVerbs(verbs.length);
    } catch (error) {
      console.error('Error fixing verbs:', error);
      showToast('Error fixing verb conjugations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanPredefinedData = async () => {
    setIsLoading(true);
    try {
      const result = await FrenchDataService.cleanupPredefinedData();
      showToast(`Cleaned up ${result.cleanedWords} predefined words`, 'success');
    } catch (error) {
      console.error('Error cleaning predefined data:', error);
      showToast('Error cleaning predefined data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    setIsLoading(true);
    try {
      await FrenchDataService.forceRefresh();
      showToast('Data refreshed successfully', 'success');
      
      // Update total verbs after refresh
      const verbs = await FrenchDataService.getAllVerbs();
      setTotalVerbs(verbs.length);
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Error refreshing data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-blue-800 mb-6">Content Fixer</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Status</h2>
          <p className="text-gray-700 mb-2">Total Verbs in Database: <span className="font-semibold">{totalVerbs}</span></p>
          
          {verbStats && (
            <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Verb Fix Results</h3>
              <ul className="list-disc pl-5 text-gray-600">
                <li>Total verbs before: {verbStats.totalBefore}</li>
                <li>Total verbs after: {verbStats.totalAfter}</li>
                <li>Verbs fixed: {verbStats.fixed}</li>
                <li>Invalid verbs removed: {verbStats.deleted}</li>
                <li>Already valid verbs: {verbStats.alreadyValid}</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-4">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:bg-gray-400"
            onClick={handleFixVerbs}
            disabled={isLoading}
          >
            {isLoading ? 'Working...' : 'Fix Verb Conjugations'}
          </button>
          
          <button 
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:bg-gray-400"
            onClick={handleCleanPredefinedData}
            disabled={isLoading}
          >
            {isLoading ? 'Working...' : 'Remove Predefined Data'}
          </button>
          
          <button 
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:bg-gray-400"
            onClick={handleForceRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Working...' : 'Force Refresh Data'}
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Content Backup & Restore</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <ContentExportFix />
          </div>
          <div className="bg-gray-100 p-4 rounded-md mt-4">
            <ContentImportFix />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Management Help</h2>
        <div className="prose prose-sm max-w-none text-gray-600">
          <p className="mb-2">This utility helps fix common issues with the French learning data:</p>
          <ul className="list-disc pl-5">
            <li className="mb-1"><strong>Fix Verb Conjugations</strong> - Fixes and validates verb conjugation data</li>
            <li className="mb-1"><strong>Remove Predefined Data</strong> - Removes any predefined words from database</li>
            <li className="mb-1"><strong>Force Refresh Data</strong> - Reloads all data from the database</li>
          </ul>
          
          <p className="mt-4">For full content management, please visit the <Link to="/manage-content" className="text-blue-600 hover:text-blue-800">Content Management</Link> page.</p>
        </div>
      </div>
    </div>
  );
};

export default ContentManager;