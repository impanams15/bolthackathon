/*
  # Create AI responses table

  1. New Tables
    - `ai_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `prompt` (text, user's input)
      - `video_url` (text, Tavus video URL)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on `ai_responses` table
    - Add policies for users to read and insert their own responses
*/

-- Create ai_responses table
CREATE TABLE IF NOT EXISTS ai_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt text NOT NULL,
  video_url text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own AI responses"
  ON ai_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI responses"
  ON ai_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_responses_user_id ON ai_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_timestamp ON ai_responses(timestamp);