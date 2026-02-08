import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { AuthForm } from './components/AuthForm';
import { FacebookLoginButton } from './components/FacebookLoginButton';
import { FacebookCallback } from './components/FacebookCallback';
import { PagesDashboard } from './components/PagesDashboard';
import { PostScheduler } from './components/PostScheduler';
import { Loader } from 'lucide-react';

function App() {
  const { session, user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'scheduler'>('dashboard');
  const [isCallback, setIsCallback] = useState(false);

  useEffect(() => {
    setIsCallback(window.location.pathname === '/auth/facebook/callback');
  }, []);

  if (isCallback) {
    return <FacebookCallback />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-2xl font-bold text-gray-900">PageBot</span>
            </div>
            <p className="text-gray-600">Manage your Facebook pages with ease</p>
          </div>

          <AuthForm />

          {user?.facebook_access_token && (
            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or connect with</span>
                </div>
              </div>
              <FacebookLoginButton />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user.facebook_access_token ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Connect Your Facebook Account</h2>
            <p className="text-gray-600 mb-6">To get started, please connect your Facebook account to authorize page management</p>
            <FacebookLoginButton />
          </div>
        ) : currentPage === 'dashboard' ? (
          <PagesDashboard onNavigate={setCurrentPage} />
        ) : (
          <PostScheduler />
        )}
      </main>
    </div>
  );
}

export default App;
