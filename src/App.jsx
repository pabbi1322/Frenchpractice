import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ContentProvider } from './contexts/ContentContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import Navigation from './components/Navigation.jsx';
import VocabularyPractice from './components/VocabularyPractice.jsx';
import VerbsPractice from './components/VerbsPractice.jsx';
import NumbersPractice from './components/NumbersPractice.jsx';
import SentencesPractice from './components/SentencesPractice.jsx';
import HomePage from './components/HomePage.jsx';
import LoginForm from './components/auth/LoginForm.jsx';
import SignupForm from './components/auth/SignupForm.jsx';
import AccountPage from './components/account/AccountPage.jsx';
import ContentManagementPage from './components/content-management/ContentManagementPage.jsx';
import ContentManagerWithDirectVerbs from './components/content-management/ContentManagerWithDirectVerbs.jsx';
import AuthDebug from './components/AuthDebug.jsx';
import { checkDataLoading } from './debug';
import { runCategoryMigrationIfNeeded } from './utils/runCategoryMigration';
import { runCategoryPurgeIfNeeded } from './utils/runCategoryPurge';

import { useAuth } from './contexts/AuthContext';

function AppContent() {
  const location = useLocation();
  const [showLogin, setShowLogin] = React.useState(false);
  const [showSignup, setShowSignup] = React.useState(false);
  const { user, isPaidUser } = useAuth();
  
  // isPaidUser is a function, we need to call it to get the current status

  // Force dark mode on document load and run migrations
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    
    // Add debug code
    console.log("App mounted, running data loading check...");
    setTimeout(() => {
      checkDataLoading();
      
      // First run the category purge to remove unwanted categories
      runCategoryPurgeIfNeeded()
        .then(purgeResult => {
          if (purgeResult.newlyRun) {
            console.log(`Category purge completed. Removed ${purgeResult.deletedCategoriesCount} categories and updated ${purgeResult.updatedWordsCount} words.`);
          }
          
          // Then run category migration if needed (after purge)
          return runCategoryMigrationIfNeeded();
        })
        .then(migrationResult => {
          if (migrationResult?.newlyRun) {
            console.log(`Category migration completed. Updated ${migrationResult.updatedCount} words.`);
          }
        })
        .catch(err => {
          console.error("Error during category operations:", err);
        });
    }, 1000); // Delay to ensure app is mounted
  }, []);

  // Check if current page is homepage or auth pages
  const isHomePage = location.pathname === '/';
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';

  // Update modal states based on current route
  React.useEffect(() => {
    setShowLogin(isLoginPage);
    setShowSignup(isSignupPage);
  }, [isLoginPage, isSignupPage, location.pathname]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation shown on all dashboard pages when no modal is open */}
      {!isHomePage && !showLogin && !showSignup && <Navigation />}
      <main className={`container mx-auto px-4 ${!isHomePage ? 'py-8' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Navigate to="/practice/words" replace />} />
          <Route path="/signup" element={<Navigate to="/practice/words" replace />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/practice/words" element={<VocabularyPractice />} />
          <Route path="/practice/verbs" element={<VerbsPractice />} />
          <Route path="/practice/numbers" element={<NumbersPractice />} />
          <Route path="/practice/sentences" element={<SentencesPractice />} />
          {/* Do not redirect content management as it's important functionality */}
          <Route path="/manage-content" element={<ContentManagementPage />} />
          {/* New direct verb management route */}
          <Route path="/direct-verbs" element={<ContentManagerWithDirectVerbs />} />
        </Routes>
      </main>
          
          {showLogin && (
            <LoginForm 
              onClose={() => setShowLogin(false)}
              switchToSignup={() => {
                setShowLogin(false);
                setShowSignup(true);
              }}
            />
          )}
          
          {showSignup && (
            <SignupForm 
              onClose={() => setShowSignup(false)}
              switchToLogin={() => {
                setShowSignup(false);
                setShowLogin(true);
              }}
            />
          )}
          
          {/* Add the auth debugger component */}
          <AuthDebug />
        </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </ContentProvider>
    </AuthProvider>
  );
}

export default App;