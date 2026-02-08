import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader, AlertCircle } from 'lucide-react';

export function FacebookCallback() {
  const { updateFacebookToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
          setError('No authorization code received');
          setProcessing(false);
          return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/meta-api`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'exchange_code',
              code,
              redirectUri: `${window.location.origin}/auth/facebook/callback`,
              clientId: import.meta.env.VITE_FACEBOOK_APP_ID,
              clientSecret: import.meta.env.VITE_FACEBOOK_APP_SECRET,
            }),
          }
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to exchange code');
        }

        const { access_token, user_id, name } = data.data;

        await updateFacebookToken(access_token, user_id, name, new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString());

        window.location.href = '/';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect Facebook account');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [updateFacebookToken]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
          <p className="text-gray-600">Connecting your Facebook account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-4">
          <AlertCircle className="text-red-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Connection Failed</h2>
        <p className="text-gray-600 text-center mb-6">{error}</p>
        <a
          href="/"
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          Go Back
        </a>
      </div>
    </div>
  );
}
