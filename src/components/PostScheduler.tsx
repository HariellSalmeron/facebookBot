import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, FacebookPage, ScheduledPost } from '../lib/supabase';
import { AlertCircle, Loader, Send, Clock, Trash2 } from 'lucide-react';

export function PostScheduler() {
  const { user } = useAuth();
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [content, setContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    try {
      setFetching(true);
      const [pagesRes, postsRes] = await Promise.all([
        supabase.from('facebook_pages').select('*').eq('user_id', user!.id),
        supabase.from('scheduled_posts').select('*').eq('user_id', user!.id),
      ]);

      if (pagesRes.error) throw pagesRes.error;
      if (postsRes.error) throw postsRes.error;

      setPages(pagesRes.data || []);
      setScheduledPosts(postsRes.data || []);
      if (pagesRes.data && pagesRes.data.length > 0) {
        setSelectedPageId(pagesRes.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setFetching(false);
    }
  }

  async function handleSchedulePost(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPageId || !content.trim() || !scheduledTime) {
      setError('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error: insertError } = await supabase.from('scheduled_posts').insert({
        user_id: user!.id,
        page_id: selectedPageId,
        content,
        scheduled_time: new Date(scheduledTime).toISOString(),
        status: 'pending',
      });

      if (insertError) throw insertError;

      setContent('');
      setScheduledTime('');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule post');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(postId: string) {
    try {
      setDeleting(postId);
      const { error } = await supabase.from('scheduled_posts').delete().eq('id', postId);

      if (error) throw error;
      setScheduledPosts(scheduledPosts.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setDeleting(null);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600 mb-2">No pages connected</p>
        <p className="text-gray-500">Connect a Facebook page to schedule posts</p>
      </div>
    );
  }

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule a Post</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSchedulePost} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Page</label>
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.page_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content here..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              {content.length}/2000 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Time
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Clock size={18} />
                Schedule Post
              </>
            )}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Scheduled Posts</h3>
        {scheduledPosts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No scheduled posts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledPosts.map((post) => {
              const page = pages.find((p) => p.id === post.page_id);
              const scheduledDate = new Date(post.scheduled_time);
              const statusColor = {
                pending: 'bg-yellow-50 border-yellow-200 text-yellow-700',
                published: 'bg-green-50 border-green-200 text-green-700',
                failed: 'bg-red-50 border-red-200 text-red-700',
              };

              return (
                <div
                  key={post.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{page?.page_name}</p>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded border ${statusColor[post.status]}`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={14} />
                        {scheduledDate.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deleting === post.id}
                    className="ml-4 p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  >
                    {deleting === post.id ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
