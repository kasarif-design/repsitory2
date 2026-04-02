/*
  # Create chat_messages table

  ## Summary
  Creates a table to persist chatbot conversation history per user.

  ## New Tables
  - `chat_messages`
    - `id` (uuid, PK) - Unique message identifier
    - `user_id` (uuid, FK to auth.users) - Owner of the message
    - `role` (text) - Either 'user' or 'assistant'
    - `content` (text) - Message content
    - `created_at` (timestamptz) - Timestamp

  ## Security
  - RLS enabled: users can only access their own messages
  - SELECT: users read their own messages
  - INSERT: users insert their own messages
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chat_messages_user_id_created_at_idx
  ON chat_messages (user_id, created_at DESC);
