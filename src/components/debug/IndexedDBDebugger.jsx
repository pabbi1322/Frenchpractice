// src/components/debug/IndexedDBDebugger.jsx
import { useState, useEffect } from 'react';
import indexedDBService from '../../services/IndexedDBService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * A component that displays the current status of IndexedDB
 * This is useful for debugging auth and persistence issues
 */
const IndexedDBDebugger = () => {
  const [dbStatus, setDbStatus] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await indexedDBService.getStatus();
        setDbStatus(status);
      } catch (error) {
        console.error('Error fetching IndexedDB status:', error);
        setDbStatus({ error: error.message });
      }
    };

    const fetchUsers = async () => {
      try {
        const allUsers = await indexedDBService.getAll('users');
        setUsers(allUsers || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };

    fetchStatus();
    fetchUsers();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center"
      >
        <span className={`w-3 h-3 rounded-full mr-2 ${dbStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
        IndexedDB Debug
      </button>

      {isOpen && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 mt-2 max-w-md max-h-96 overflow-auto">
          <h3 className="text-lg font-semibold mb-2">IndexedDB Status</h3>
          
          {dbStatus ? (
            <div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <span className="font-medium">Connection:</span>
                <span className={dbStatus.connected ? 'text-green-600' : 'text-red-600'}>
                  {dbStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
                
                {dbStatus.name && (
                  <>
                    <span className="font-medium">Database Name:</span>
                    <span>{dbStatus.name}</span>
                  </>
                )}
                
                {dbStatus.version && (
                  <>
                    <span className="font-medium">Version:</span>
                    <span>{dbStatus.version}</span>
                  </>
                )}
                
                {dbStatus.error && (
                  <>
                    <span className="font-medium">Error:</span>
                    <span className="text-red-600">{dbStatus.error}</span>
                  </>
                )}
              </div>
              
              {dbStatus.objectStores && dbStatus.objectStores.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-1">Object Stores:</h4>
                  <ul className="list-disc pl-5 text-sm">
                    {dbStatus.objectStores.map((store) => (
                      <li key={store}>{store}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">Loading database status...</div>
          )}
          
          <h3 className="text-lg font-semibold mt-4 mb-2">Current Auth User</h3>
          {user ? (
            <div className="text-sm bg-gray-100 p-2 rounded">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify({
                  id: user.id,
                  email: user.email,
                  name: user.name
                }, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No user is currently signed in</div>
          )}
          
          <h3 className="text-lg font-semibold mt-4 mb-2">Users in Database ({users.length})</h3>
          {users.length > 0 ? (
            <div className="text-sm overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-left">ID</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Email</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="border border-gray-300 px-2 py-1">{user.id}</td>
                      <td className="border border-gray-300 px-2 py-1">{user.email}</td>
                      <td className="border border-gray-300 px-2 py-1">{user.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No users found in database</div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexedDBDebugger;