// src/components/debug/AuthDebugger.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import indexedDBService from '../../services/IndexedDBService';
import { clearAndResetIndexedDB, dumpDatabaseContent } from '../../utils/DebugUtils';
import { getDatabaseStats, getDatabaseSamples } from '../../utils/DatabaseStatsUtils';
import { forceLoadAllData, getDetailedDatabaseStats } from '../../utils/DataLoaderUtil';

const AuthDebugger = () => {
  const { user, dbStatus } = useAuth();
  const [dbContent, setDbContent] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [dbSamples, setDbSamples] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Dump database content and stats on component mount
    loadDbContent();
  }, []);

  const loadDbContent = async () => {
    setLoading(true);
    try {
      // Load database content
      const content = await dumpDatabaseContent();
      setDbContent(content);
      
      // Load database statistics
      const stats = await getDatabaseStats();
      setDbStats(stats);
      
      // Load sample data
      const samples = await getDatabaseSamples(2);
      setDbSamples(samples);
      
      // Load detailed stats
      const detailed = await getDetailedDatabaseStats();
      setDetailedStats(detailed);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load DB content:', error);
      setMessage(`Error loading DB content: ${error.message}`);
      setLoading(false);
    }
  };

  const handleResetDb = async () => {
    setLoading(true);
    setMessage('Resetting database...');
    try {
      await clearAndResetIndexedDB();
      setMessage('Database reset successful. Page will reload.');
    } catch (error) {
      console.error('Failed to reset DB:', error);
      setMessage(`Error resetting DB: ${error.message}`);
      setLoading(false);
    }
  };
  
  const handleForceLoadData = async () => {
    setLoading(true);
    setMessage('Force loading all data...');
    try {
      const result = await forceLoadAllData();
      setMessage(`${result.message}`);
      await loadDbContent(); // Reload data after force loading
      setLoading(false);
    } catch (error) {
      console.error('Failed to force load data:', error);
      setMessage(`Error force loading data: ${error.message}`);
      setLoading(false);
    }
  };

  // Helper function to fix mock user credentials
  const fixMockUsers = async () => {
    setLoading(true);
    setMessage('Adding mock users to database...');
    
    try {
      // Get all users
      const users = await indexedDBService.getAll('users');
      
      // Check if demo user exists
      const demoUser = users.find(u => u.email === 'demo@example.com');
      
      if (demoUser) {
        setMessage('Demo user already exists. No changes needed.');
      } else {
        // Add mock demo user
        await indexedDBService.add('users', {
          id: '2',
          email: 'demo@example.com',
          name: 'Demo User',
          password: 'demo123',
          stripeCustomerId: 'cus_mock_demo'
        });
        
        setMessage('Demo user added successfully. Try logging in with demo@example.com / demo123');
        
        // Reload database content
        await loadDbContent();
      }
    } catch (error) {
      console.error('Failed to fix mock users:', error);
      setMessage(`Error fixing mock users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Display any issues detected with the data
  const renderDataIssues = () => {
    if (!dbStats || !detailedStats) return null;
    
    const issues = [];
    
    // Check if IndexedDB counts are lower than expected
    if (detailedStats.dataFiles) {
      const { dataFiles, stores } = detailedStats;
      
      if (stores.words?.count < dataFiles.wordsInFile) {
        issues.push(`Words: ${stores.words?.count} in DB vs ${dataFiles.wordsInFile} in data file`);
      }
      
      if (stores.verbs?.count < dataFiles.verbsInFile) {
        issues.push(`Verbs: ${stores.verbs?.count} in DB vs ${dataFiles.verbsInFile} in data file`);
      }
      
      if (stores.sentences?.count < dataFiles.sentencesInFile) {
        issues.push(`Sentences: ${stores.sentences?.count} in DB vs ${dataFiles.sentencesInFile} in data file`);
      }
      
      if (stores.numbers?.count < dataFiles.numbersInFile) {
        issues.push(`Numbers: ${stores.numbers?.count} in DB vs ${dataFiles.numbersInFile} in data file`);
      }
    }
    
    if (issues.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h3 className="font-medium text-red-700 dark:text-red-300">Data Issues Detected</h3>
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-3 rounded">
          <ul className="list-disc pl-5">
            {issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm">
            Click "Force Load All Data" to fix these issues.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-red-300 rounded-md p-4 my-4 bg-red-50 dark:bg-red-900/10">
      <h2 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2">Auth Debugger</h2>
      
      <div className="mb-4">
        <h3 className="font-medium text-red-700 dark:text-red-300">Database Statistics</h3>
        {loading ? (
          <div className="text-sm">Loading statistics...</div>
        ) : dbStats ? (
          <div className="bg-white dark:bg-gray-800 p-2 rounded text-xs">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border px-2 py-1 text-left">Store</th>
                  <th className="border px-2 py-1 text-right">Count</th>
                  <th className="border px-2 py-1 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {dbStats.stores.map((store, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="border px-2 py-1">{store.name}</td>
                    <td className="border px-2 py-1 text-right">{store.count}</td>
                    <td className="border px-2 py-1 text-center">
                      {store.exists ? '✅' : '❌'}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100 dark:bg-gray-700">
                  <td className="border px-2 py-1">TOTAL</td>
                  <td className="border px-2 py-1 text-right">{dbStats.totalCount}</td>
                  <td className="border px-2 py-1"></td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2 text-gray-500 text-right text-xs italic">
              Last updated: {new Date(dbStats.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="text-sm">No statistics available</div>
        )}
        
        {renderDataIssues()}
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium text-red-700 dark:text-red-300">Database Status</h3>
        <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(dbStatus, null, 2)}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium text-red-700 dark:text-red-300">Current User</h3>
        <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
          {user ? JSON.stringify(user, null, 2) : 'Not logged in'}
        </pre>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium text-red-700 dark:text-red-300">Sample Content</h3>
        <div className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
          {loading ? (
            <div>Loading samples...</div>
          ) : dbSamples ? (
            <div>
              <div className="mb-2">
                <strong>Words:</strong> {dbSamples.words?.length || 0} samples
                {dbSamples.words?.length > 0 && (
                  <ul className="list-disc pl-5">
                    {dbSamples.words.map((item, idx) => (
                      <li key={idx}>{item.french || item.word}: {item.english}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-2">
                <strong>Verbs:</strong> {dbSamples.verbs?.length || 0} samples
                {dbSamples.verbs?.length > 0 && (
                  <ul className="list-disc pl-5">
                    {dbSamples.verbs.map((item, idx) => (
                      <li key={idx}>{item.infinitive}: {item.english}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-2">
                <strong>Sentences:</strong> {dbSamples.sentences?.length || 0} samples
                {dbSamples.sentences?.length > 0 && (
                  <ul className="list-disc pl-5">
                    {dbSamples.sentences.map((item, idx) => (
                      <li key={idx}>{item.french}: {item.english}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-2">
                <strong>Numbers:</strong> {dbSamples.numbers?.length || 0} samples
                {dbSamples.numbers?.length > 0 && (
                  <ul className="list-disc pl-5">
                    {dbSamples.numbers.map((item, idx) => (
                      <li key={idx}>{item.number}: {item.french}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div>No samples available</div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="font-medium text-red-700 dark:text-red-300">Database Content</h3>
        <pre className="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
          {loading ? 'Loading...' : dbContent ? JSON.stringify(dbContent, null, 2) : 'No data'}
        </pre>
      </div>
      
      {message && (
        <div className="my-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded">
          {message}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={loadDbContent}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Refresh DB Content
        </button>
        
        <button
          onClick={handleForceLoadData}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Force Load All Data
        </button>
        
        <button
          onClick={handleResetDb}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Reset Database
        </button>
        
        <button
          onClick={fixMockUsers}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          Fix Mock Users
        </button>
      </div>
    </div>
  );
};

export default AuthDebugger;