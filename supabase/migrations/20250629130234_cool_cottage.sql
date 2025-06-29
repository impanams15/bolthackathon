/*
  # Create Algorand wallets table

  1. New Tables
    - `algorand_wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `address` (text, unique)
      - `mnemonic` (text, encrypted)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `algorand_wallets` table
    - Add policies for users to manage their own wallets only
*/

-- Create algorand_wallets table
CREATE TABLE IF NOT EXISTS algorand_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address text UNIQUE NOT NULL,
  mnemonic text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE algorand_wallets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own wallet"
  ON algorand_wallets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet"
  ON algorand_wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON algorand_wallets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallet"
  ON algorand_wallets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle wallet updates
CREATE OR REPLACE FUNCTION handle_wallet_updated()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wallet updates
DROP TRIGGER IF EXISTS on_wallet_updated ON algorand_wallets;
CREATE TRIGGER on_wallet_updated
  BEFORE UPDATE ON algorand_wallets
  FOR EACH ROW EXECUTE FUNCTION handle_wallet_updated();