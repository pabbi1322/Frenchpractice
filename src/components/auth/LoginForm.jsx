// src/components/auth/LoginForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DemoCredentials from './DemoCredentials';
import AuthDebugger from '../debug/AuthDebugger';
import indexedDBService from '../../services/IndexedDBService';

const LoginForm = ({ onClose, switchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const { login, dbStatus } = useAuth();
  
  // Check database connection on mount
  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        const status = await indexedDBService.getStatus();
        if (!status.connected) {
          setError('Database connection issue detected. Authentication may not work properly.');
        }
      } catch (err) {
        console.error('Failed to check DB status:', err);
        setError('Failed to check database status. Please refresh the page and try again.');
      }
    };
    
    checkDbConnection();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Attempting to login with:', email);
    
    try {
      const result = await login(email, password);
      
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, redirecting to practice page');
        // Use direct window location change to ensure complete page refresh
        window.location.href = '/practice/words';
        return; // Prevent further execution
      } else {
        console.error('Login failed:', result.error);
        setError(result.error);
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Login</h2>
          <div className="flex items-center gap-2">
            {/* Debug toggle button */}
            <button
              onClick={() => setShowDebugger(!showDebugger)}
              className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-2 py-1 rounded"
              title="Toggle debug panel"
            >
              {showDebugger ? 'Hide Debug' : 'Debug'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Debug information panel */}
        {showDebugger && <AuthDebugger />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={switchToSignup}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
        
        <DemoCredentials 
          onUseDemo={(demoEmail, demoPassword) => {
            setEmail(demoEmail);
            setPassword(demoPassword);
            // Automatically submit the form with demo credentials
            login(demoEmail, demoPassword).then(result => {
              if (result.success) {
                // Use direct window location change to ensure complete page refresh
                window.location.href = '/practice/words';
              } else {
                setError(result.error);
              }
            }).catch(err => {
              setError('An unexpected error occurred. Please try again.');
              console.error('Login error:', err);
            });
          }} 
        />
        
        {/* Show database status if there's an error */}
        {error && (
          <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">Troubleshooting Tips:</p>
            <ul className="text-xs text-yellow-700 dark:text-yellow-400 list-disc pl-4 mt-1">
              <li>Make sure you're using the correct email and password</li>
              <li>If you're using demo credentials, try using the "Debug" button above</li>
              <li>Database status: {dbStatus?.connected ? "Connected ✓" : "Disconnected ✗"}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;