/*
  # Add users table insert policy

  1. Changes
    - Add INSERT policy to users table so authenticated users can create their own record during signup
  
  2. Security
    - Policy ensures users can only insert a record with their own auth.uid() as the id
*/

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
