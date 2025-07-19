// src/components/AuthDebug.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkAuthState, isIndexedDBAvailable } from '../utils/authUtils';

const AuthDebug = () => {
  const { user, subscription, loading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const [authState, setAuthState] = useState(null);
  const [indexedDBStatus, setIndexedDBStatus] = useState(null);
  
  useEffect(() => {
    // Check IndexedDB availability
    setIndexedDBStatus(isIndexedDBAvailable());
    
    // Get current auth state from localStorage
    setAuthState(checkAuthState());
  }, [user]);

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4">
        <button 
          onClick={() => setShowDebug(true)}
          className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded-md"
        >
          Debug Auth
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 text-white text-xs z-50 overflow-auto max-h-96">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">Auth Debug</h3>
        <button 
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <div>
          <span className="font-semibold">IndexedDB:</span> 
          <span className={indexedDBStatus ? "text-green-400" : "text-red-400"}>
            {indexedDBStatus ? "Available" : "Not Available"}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">Auth Context:</span>
          <div className="pl-2 mt-1">
            <div><span className="opacity-70">Loading:</span> {loading ? "True" : "False"}</div>
            <div>
              <span className="opacity-70">User:</span> {user ? "Logged In" : "Not Logged In"}
              {user && (
                <pre className="bg-gray-900 p-1 mt-1 rounded text-xs overflow-x-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              )}
            </div>
            <div>
              <span className="opacity-70">Subscription:</span> {subscription ? "Active" : "None"}
              {subscription && (
                <pre className="bg-gray-900 p-1 mt-1 rounded text-xs overflow-x-auto">
                  {JSON.stringify(subscription, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <span className="font-semibold">Local Storage:</span>
          <div className="pl-2 mt-1">
            <div>
              <span className="opacity-70">Auth Token:</span> 
              {authState?.token ? "Present" : "Missing"}
            </div>
            <div>
              <span className="opacity-70">User ID:</span> 
              {authState?.userId || "None"}
            </div>
            <div>
              <span className="opacity-70">Subscription:</span> 
              {authState?.subscription ? "Saved" : "None"}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <button
            onClick={() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('currentUserId');
              localStorage.removeItem('frenchmaster_subscription');
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
          >
            Clear Auth & Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;