/*
  # Add Service Role Policies for Worker

  1. Security
    - Add service role policies to allow background worker to update scheduled posts
    - Add policies to allow logging published posts
  
  2. Important Notes
    - Service role has unrestricted access but we still define explicit policies for clarity
    - Worker needs to update post status and create logs
*/

CREATE POLICY "Service role can update scheduled posts"
  ON scheduled_posts
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert post logs"
  ON post_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);
