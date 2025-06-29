/*
  # Create app users and related tables

  1. New Tables
    - `app_users`
      - `id` (uuid, primary key)
      - `auth_user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `email` (text, unique)
      - `algorand_address` (text, optional)
      - `created_at` (timestamp)
    - `user_donations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to app_users)
      - `amount` (double precision)
      - `tx_hash` (text, optional)
      - `timestamp` (timestamp)
    - `donation_certificates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to app_users)
      - `asa_id` (text)
      - `issue_date` (timestamp)
      - `tx_hash` (text, optional)
    - `user_chats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to app_users)
      - `message` (text)
      - `response` (text)
      - `timestamp` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Use subqueries to link auth.uid() to app_users records

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize foreign key relationships
*/

-- Create app_users table (separate from existing users/profiles)
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  algorand_address text,
  created_at timestamptz DEFAULT now()
);

-- Create user_donations table (separate from existing donations)
CREATE TABLE IF NOT EXISTS user_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  amount double precision NOT NULL,
  tx_hash text,
  timestamp timestamptz DEFAULT now()
);

-- Create donation_certificates table
CREATE TABLE IF NOT EXISTS donation_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  asa_id text NOT NULL,
  issue_date timestamptz DEFAULT now(),
  tx_hash text
);

-- Create user_chats table (separate from existing chat_conversations)
CREATE TABLE IF NOT EXISTS user_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  -- Drop app_users policies
  DROP POLICY IF EXISTS "Users can read own app data" ON app_users;
  DROP POLICY IF EXISTS "Users can insert own app data" ON app_users;
  DROP POLICY IF EXISTS "Users can update own app data" ON app_users;
  
  -- Drop user_donations policies
  DROP POLICY IF EXISTS "Users can read own user donations" ON user_donations;
  DROP POLICY IF EXISTS "Users can insert own user donations" ON user_donations;
  
  -- Drop donation_certificates policies
  DROP POLICY IF EXISTS "Users can read own donation certificates" ON donation_certificates;
  DROP POLICY IF EXISTS "Users can insert own donation certificates" ON donation_certificates;
  
  -- Drop user_chats policies
  DROP POLICY IF EXISTS "Users can read own user chats" ON user_chats;
  DROP POLICY IF EXISTS "Users can insert own user chats" ON user_chats;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Ignore if policies don't exist
END $$;

-- Create policies for app_users table
CREATE POLICY "Users can read own app data"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own app data"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own app data"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Create policies for user_donations table
CREATE POLICY "Users can read own user donations"
  ON user_donations
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM app_users WHERE auth.uid() = auth_user_id));

CREATE POLICY "Users can insert own user donations"
  ON user_donations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM app_users WHERE auth.uid() = auth_user_id));

-- Create policies for donation_certificates table
CREATE POLICY "Users can read own donation certificates"
  ON donation_certificates
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM app_users WHERE auth.uid() = auth_user_id));

CREATE POLICY "Users can insert own donation certificates"
  ON donation_certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM app_users WHERE auth.uid() = auth_user_id));

-- Create policies for user_chats table
CREATE POLICY "Users can read own user chats"
  ON user_chats
  FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM app_users WHERE auth.uid() = auth_user_id));

CREATE POLICY "Users can insert own user chats"
  ON user_chats
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM app_users WHERE auth.uid() = auth_user_id));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_app_users_auth_user_id ON app_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_created_at ON app_users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_donations_user_id ON user_donations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_donations_timestamp ON user_donations(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_donations_tx_hash ON user_donations(tx_hash);

CREATE INDEX IF NOT EXISTS idx_donation_certificates_user_id ON donation_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_certificates_asa_id ON donation_certificates(asa_id);
CREATE INDEX IF NOT EXISTS idx_donation_certificates_issue_date ON donation_certificates(issue_date);

CREATE INDEX IF NOT EXISTS idx_user_chats_user_id ON user_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_timestamp ON user_chats(timestamp);