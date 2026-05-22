-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Dripsender settings
  dripsender_api_key text,
  dripsender_webhook_url text,
  dripsender_enabled boolean DEFAULT false,
  
  -- Cloudchat settings
  cloudchat_api_key text,
  cloudchat_endpoint text,
  cloudchat_enabled boolean DEFAULT false,
  
  -- AI Auto-reply settings
  ai_enabled boolean DEFAULT false,
  ai_provider text DEFAULT 'openai', -- 'openai' or 'gemini'
  openai_api_key text,
  openai_model text DEFAULT 'gpt-3.5-turbo',
  gemini_api_key text,
  gemini_model text DEFAULT 'gemini-pro',
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT settings_ai_provider_check CHECK (ai_provider IN ('openai', 'gemini')),
  CONSTRAINT settings_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "own_settings"
  ON settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_settings_user_id ON settings(user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();