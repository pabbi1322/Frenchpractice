import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DemoInstructions from './DemoInstructions';

const AccountPage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Get current user from AuthContext
  const { user: authUser } = useAuth();
  
  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      
      try {
        // Check if we have a logged-in user from AuthContext
        if (authUser) {
          console.log('Using authenticated user data:', authUser);
          setUser({
            id: authUser.id || 'user_' + Math.random().toString(36).substring(2, 10),
            name: authUser.name || 'Demo User',
            email: authUser.email || 'demo',
            avatar: authUser.avatar || null,
            joined: authUser.joined || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            subscription: authUser.subscription || null,
            isDemo: authUser.email === 'demo'
          });
        } else {
          // Fallback to mock data
          setUser({
            id: 'user_' + Math.random().toString(36).substring(2, 10),
            name: 'Demo User',
            email: 'demo',
            avatar: null,
            joined: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            subscription: null,
            isDemo: true
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [authUser]);

  const handleLogout = () => {
    // Call the logout method from AuthContext to clear the authentication state
    logout();
    // After logout, navigate to the homepage
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto py-20">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="ml-4 text-xl">Loading account information...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto py-12">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 bg-gray-800 rounded-2xl p-6 border border-gray-700 sticky top-24">
            <div className="flex flex-col items-center mb-6">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-full border-2 border-blue-500 mb-3" 
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold mb-3">
                  {user.name.charAt(0)}
                </div>
              )}
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>

            <div className="border-t border-gray-700 pt-6 mb-6">
              <nav>
                <ul className="space-y-2">
                  <li>
                    <button 
                      onClick={() => setActiveTab('profile')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        Profile
                      </div>
                    </button>
                  </li>

                  <li>
                    <button 
                      onClick={() => setActiveTab('progress')}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'progress' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Learning Progress
                      </div>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="pt-2">
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Log out
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="w-full md:w-3/4">
            {activeTab === 'profile' && (
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 mb-6">
                {user && user.isDemo && <DemoInstructions />}
                <h2 className="text-2xl font-bold mb-6">User Profile</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-400 mb-2">Name</label>
                    <div className="bg-gray-700 p-3 rounded-lg">{user.name}</div>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Email</label>
                    <div className="bg-gray-700 p-3 rounded-lg">{user.email}</div>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Member Since</label>
                    <div className="bg-gray-700 p-3 rounded-lg">{formatDate(user.joined)}</div>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Last Login</label>
                    <div className="bg-gray-700 p-3 rounded-lg">{formatDate(user.lastLogin)}</div>
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-700 pt-6">
                  <h3 className="text-xl font-bold mb-4">Update Profile</h3>
                  <p className="text-gray-400 mb-4">
                    You can update your profile details below.
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200">
                    Edit Profile
                  </button>
                </div>
              </div>
            )}



            {activeTab === 'progress' && (
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">Learning Progress</h2>
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">Recent Activity</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">Words Practice</div>
                        <div className="text-sm text-gray-400">2 days ago</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-gray-300">Completed 32 new words</div>
                        <div className="text-green-400">+160 points</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">Verbs Practice</div>
                        <div className="text-sm text-gray-400">3 days ago</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-gray-300">Mastered 8 irregular verbs</div>
                        <div className="text-green-400">+120 points</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">Numbers Practice</div>
                        <div className="text-sm text-gray-400">5 days ago</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-gray-300">Completed basic numbers 1-100</div>
                        <div className="text-green-400">+95 points</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 text-blue-400">Skill Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300">Words</span>
                        <span className="text-gray-300">65%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{width: "65%"}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300">Verbs</span>
                        <span className="text-gray-300">42%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{width: "42%"}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300">Numbers</span>
                        <span className="text-gray-300">78%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{width: "78%"}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300">Sentences</span>
                        <span className="text-gray-300">28%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-pink-600 h-2.5 rounded-full" style={{width: "28%"}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <button 
                      onClick={() => navigate('/practice/words')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                    >
                      Continue Learning
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;