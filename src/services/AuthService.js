// src/services/AuthService.js
import indexedDBService from './IndexedDBService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yourbackend.com';

// Mock user data for development
const MOCK_USERS = [
  {
    id: '1',
    email: 'user@example.com',
    name: 'Test User',
    password: 'password123',
    stripeCustomerId: 'cus_mock_customer'
  },
  {
    id: '2',
    email: 'demo@example.com',
    name: 'Demo User',
    password: 'demo123',
    stripeCustomerId: 'cus_mock_demo'
  }
];

// Mock authentication service for development
class MockAuthService {
  constructor() {
    // Initialize IndexedDB and check for existing users
    this.initLocalUsers();
  }

  async initLocalUsers() {
    try {
      console.log('Initializing mock users in IndexedDB...');
      // Try to get users from IndexedDB
      const users = await indexedDBService.getAll('users');
      console.log(`Found ${users.length} existing users in IndexedDB`);
      
      // Check if demo user exists specifically by email
      const demoUserExists = users.some(user => user.email === 'demo@example.com');
      
      if (!demoUserExists) {
        console.log('Demo user not found, adding it to the database...');
        // Add demo user specifically to ensure it exists
        try {
          const demoUser = MOCK_USERS.find(user => user.email === 'demo@example.com');
          if (demoUser) {
            await indexedDBService.add('users', demoUser);
            console.log('Successfully added demo user to IndexedDB');
          } else {
            console.error('Demo user not found in MOCK_USERS');
          }
        } catch (demoAddError) {
          console.error('Failed to add demo user:', demoAddError);
          // If adding fails due to constraint error, try updating instead
          if (demoAddError.name === 'ConstraintError') {
            const demoUser = MOCK_USERS.find(user => user.email === 'demo@example.com');
            await indexedDBService.update('users', demoUser);
            console.log('Updated existing demo user in IndexedDB');
          }
        }
      } else {
        console.log('Demo user already exists in IndexedDB');
      }
      
      // Add any other mock users that don't exist
      if (users.length === 0) {
        for (const user of MOCK_USERS) {
          if (user.email !== 'demo@example.com') {  // Skip demo user as it's handled above
            try {
              await indexedDBService.add('users', user);
              console.log(`Added mock user ${user.email} to IndexedDB`);
            } catch (addError) {
              console.error(`Failed to add mock user ${user.email}:`, addError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize local users:', error);
    }
  }

  async login(email, password) {
    console.log(`Attempting login with email: ${email}`);
    
    // Verify IndexedDB connection first
    try {
      const dbStatus = await indexedDBService.getStatus();
      if (!dbStatus.connected) {
        console.error('IndexedDB not connected during login attempt');
        throw new Error('Database connection unavailable. Please ensure your browser supports IndexedDB and try again.');
      }
    } catch (dbError) {
      console.error('Failed to check IndexedDB status:', dbError);
      throw new Error('Database connection error: ' + dbError.message);
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Get all users from IndexedDB
      console.log('Fetching users from IndexedDB...');
      const users = await indexedDBService.getAll('users');
      console.log(`Found ${users.length} users in database`);
      
      // Check if email exists first for better error messages
      const userWithEmail = users.find(u => u.email === email);
      if (!userWithEmail) {
        console.error('Login failed: No user found with this email');
        throw new Error('No account found with this email address');
      }
      
      // Now check password
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        console.error('Login failed: Invalid password for user', email);
        throw new Error('Invalid password');
      }

      console.log('Login successful for user:', user.id);
      const token = 'mock_token_' + Math.random().toString(36).substr(2, 9);
      
      // Save login session to localStorage
      localStorage.setItem('currentUserId', user.id);
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          stripeCustomerId: user.stripeCustomerId || 'cus_mock_' + user.id
        },
        token,
        subscription: {
          id: 'sub_mock_123',
          status: 'active',
          planId: 'free',
          currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(email, password, name) {
    console.log(`Attempting signup with email: ${email}, name: ${name}`);
    
    // Verify IndexedDB connection first
    try {
      const dbStatus = await indexedDBService.getStatus();
      if (!dbStatus.connected) {
        console.error('IndexedDB not connected during signup attempt');
        throw new Error('Database connection unavailable. Please ensure your browser supports IndexedDB and try again.');
      }
    } catch (dbError) {
      console.error('Failed to check IndexedDB status:', dbError);
      throw new Error('Database connection error: ' + dbError.message);
    }
    
    // Input validation
    if (!email || !password || !name) {
      console.error('Signup error: Missing required fields');
      throw new Error('All fields are required');
    }
    
    if (password.length < 6) {
      console.error('Signup error: Password too short');
      throw new Error('Password must be at least 6 characters');
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Check if user already exists in IndexedDB
      console.log('Checking if user already exists...');
      const users = await indexedDBService.getAll('users');
      
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        console.error('Signup failed: Email already exists', email);
        throw new Error('A user with this email already exists');
      }

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        name,
        password,
        stripeCustomerId: 'cus_mock_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      
      // Save new user to IndexedDB
      console.log('Creating new user in database:', newUser.id);
      await indexedDBService.add('users', newUser);
      
      const token = 'mock_token_' + Math.random().toString(36).substr(2, 9);
      
      // Save login session to localStorage
      localStorage.setItem('currentUserId', newUser.id);
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      
      console.log('Signup successful for user:', newUser.id);
      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          stripeCustomerId: newUser.stripeCustomerId
        },
        token
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async verifyToken(token) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!token.startsWith('mock_token_')) {
      throw new Error('Invalid token');
    }

    try {
      // Get the current user ID from localStorage
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) {
        throw new Error('User session not found');
      }
      
      // Get user data from IndexedDB
      const user = await indexedDBService.getById('users', currentUserId);
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        stripeCustomerId: user.stripeCustomerId
      };
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  async getSubscriptionStatus() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Check for subscription data in localStorage
      const storedSubscription = localStorage.getItem('frenchmaster_subscription');
      if (storedSubscription) {
        try {
          return JSON.parse(storedSubscription);
        } catch (error) {
          console.error('Error parsing subscription data:', error);
        }
      }
      
      // Default subscription data
      const subscriptionData = {
        id: 'sub_mock_123',
        status: 'active',
        planId: 'free',
        currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      };
      
      // Save to localStorage for future use
      localStorage.setItem('frenchmaster_subscription', JSON.stringify(subscriptionData));
      
      return subscriptionData;
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  async logout() {
    // Remove user session from localStorage
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('authToken');
    return Promise.resolve();
  }

  async updateProfile(userData) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) {
        throw new Error('User session not found');
      }
      
      // Get current user data
      const currentUser = await indexedDBService.getById('users', currentUserId);
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      // Update user data
      const updatedUser = {
        ...currentUser,
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      // Save updated user to IndexedDB
      await indexedDBService.update('users', updatedUser);
      
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        stripeCustomerId: updatedUser.stripeCustomerId
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) {
        throw new Error('User session not found');
      }
      
      // Get current user data
      const currentUser = await indexedDBService.getById('users', currentUserId);
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      // Verify current password
      if (currentUser.password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      const updatedUser = {
        ...currentUser,
        password: newPassword,
        updatedAt: new Date().toISOString()
      };
      
      // Save updated user to IndexedDB
      await indexedDBService.update('users', updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}

// Real AuthService implementation (commented for reference)
class RealAuthService {
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return await response.json();
  }

  async signup(email, password, name) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    return await response.json();
  }

  async verifyToken(token) {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    return await response.json();
  }

  async getSubscriptionStatus() {
    const response = await fetch(`${API_BASE_URL}/user/subscription`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get subscription status');
    }

    return await response.json();
  }

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}

// Export the appropriate service based on environment
export const AuthService = import.meta.env.DEV 
  ? new MockAuthService() 
  : new RealAuthService();