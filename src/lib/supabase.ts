import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  facebook_access_token: string | null;
  facebook_user_id: string | null;
  facebook_name: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FacebookPage = {
  id: string;
  user_id: string;
  page_id: string;
  page_name: string;
  page_access_token: string;
  page_picture_url: string | null;
  connected_at: string;
  created_at: string;
};

export type ScheduledPost = {
  id: string;
  user_id: string;
  page_id: string;
  content: string;
  scheduled_time: string;
  status: 'pending' | 'published' | 'failed';
  facebook_post_id: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};
