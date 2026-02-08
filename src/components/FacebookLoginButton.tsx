import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Loader } from 'lucide-react';

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';
const REDIRECT_URI = `${window.location.origin}/auth/facebook/callback`;

export function FacebookLoginButton() {
  const { updateFacebookToken } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFacebookLogin = () => {
    if (!FACEBOOK_APP_ID) {
      setError('Facebook App ID not configured. Please set VITE_FACEBOOK_APP_ID in your environment.');
      return;
    }

    const scope = ['pages_manage_metadata', 'pages_read_engagement', 'pages_manage_posts'];
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope.join(',')}&state=${Math.random().toString(36).substring(7)}`;

    window.location.href = authUrl;
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleFacebookLogin}
        disabled={loading || !FACEBOOK_APP_ID}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader size={18} className="animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Connect Facebook
          </>
        )}
      </button>
    </div>
  );
}
