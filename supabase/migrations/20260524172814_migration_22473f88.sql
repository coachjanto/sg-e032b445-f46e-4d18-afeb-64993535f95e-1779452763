-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create default settings for existing profiles without settings
INSERT INTO public.settings (
  user_id,
  dripsender_enabled,
  cloudchat_enabled,
  ai_enabled,
  ai_provider,
  openai_model,
  gemini_model,
  created_at,
  updated_at
)
SELECT 
  id,
  false,
  false,
  false,
  'openai',
  'gpt-3.5-turbo',
  'gemini-pro',
  NOW(),
  NOW()
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.settings)
ON CONFLICT (user_id) DO NOTHING;