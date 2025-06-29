/*
  # Create additional tables for enhanced features

  1. New Tables
    - `chat_conversations` - Store AI chat history
    - `donations` - Track donation transactions
    - `campaigns` - Fundraising campaigns
    - `reddit_posts` - Cache Reddit posts

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for user data access
*/

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  context text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations"
  ON chat_conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON chat_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient text NOT NULL,
  amount decimal(20, 6) NOT NULL,
  message text,
  is_anonymous boolean DEFAULT false,
  transaction_id text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own donations"
  ON donations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own donations"
  ON donations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  goal decimal(20, 6) NOT NULL,
  raised decimal(20, 6) DEFAULT 0,
  duration_days integer DEFAULT 30,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  ends_at timestamptz DEFAULT (now() + interval '30 days')
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reddit posts cache table
CREATE TABLE IF NOT EXISTS reddit_posts (
  id text PRIMARY KEY,
  subreddit text NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  content text,
  url text,
  permalink text,
  ups integer DEFAULT 0,
  num_comments integer DEFAULT 0,
  created_utc bigint,
  cached_at timestamptz DEFAULT now()
);

-- No RLS needed for Reddit posts as they're public data
-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON reddit_posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_cached_at ON reddit_posts(cached_at);