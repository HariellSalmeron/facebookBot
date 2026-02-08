import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, FacebookPage } from '../lib/supabase';
import { AlertCircle, Loader, Trash2, Plus } from 'lucide-react';

export function PagesDashboard() {
  const { user } = useAuth();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [user]);

  async function fetchPages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('facebook_pages')
        .select('*')
        .eq('user_id', user!.id)
        .order('connected_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePage(pageId: string) {
    try {
      setDeleting(pageId);
      const { error } = await supabase
        .from('facebook_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
      setPages(pages.filter((p) => p.id !== pageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete page');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Connected Pages</h2>
          <p className="text-gray-600 mt-1">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'} connected
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={18} />
          Add Page
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {pages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-gray-600 text-lg mb-4">No pages connected yet</p>
          <p className="text-gray-500 mb-6">
            Connect your Facebook pages to start managing and scheduling posts
          </p>
          <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            <Plus size={18} />
            Connect First Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {page.page_picture_url && (
                <img
                  src={page.page_picture_url}
                  alt={page.page_name}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1">{page.page_name}</h3>
                <p className="text-sm text-gray-600 mb-4">ID: {page.page_id}</p>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded transition-colors text-sm">
                    Schedule Post
                  </button>
                  <button
                    onClick={() => handleDeletePage(page.id)}
                    disabled={deleting === page.id}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors disabled:opacity-50"
                  >
                    {deleting === page.id ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
