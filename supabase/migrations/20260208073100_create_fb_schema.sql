/*
  # Facebook Page Management Bot Schema

  1. New Tables
    - `users` - Stores user authentication and Facebook tokens
    - `facebook_pages` - Connected Facebook pages for each user
    - `scheduled_posts` - Posts queued for scheduling
    - `post_logs` - Audit trail of published posts
  
  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Service role can access for background jobs
  
  3. Indexes
    - Performance optimization for queries by user_id and status
    - Timestamp indexes for scheduling
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  facebook_access_token text,
  facebook_user_id text,
  facebook_name text,
  token_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS facebook_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  page_name text NOT NULL,
  page_access_token text NOT NULL,
  page_picture_url text,
  connected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, page_id)
);

ALTER TABLE facebook_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pages"
  ON facebook_pages
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pages"
  ON facebook_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own pages"
  ON facebook_pages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES facebook_pages(id) ON DELETE CASCADE,
  content text NOT NULL,
  scheduled_time timestamptz NOT NULL,
  status text DEFAULT 'pending',
  facebook_post_id text,
  published_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own posts"
  ON scheduled_posts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own posts"
  ON scheduled_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON scheduled_posts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON scheduled_posts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS post_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL REFERENCES facebook_pages(id) ON DELETE CASCADE,
  content text NOT NULL,
  facebook_post_id text,
  status text NOT NULL,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE post_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own logs"
  ON post_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_scheduled_posts_user_status ON scheduled_posts(user_id, status);
CREATE INDEX idx_scheduled_posts_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX idx_facebook_pages_user ON facebook_pages(user_id);
CREATE INDEX idx_post_logs_user ON post_logs(user_id);
