-- Add new columns for advanced AI settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS ai_keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_system_prompt text DEFAULT 'You are a helpful WhatsApp assistant. Keep responses concise and friendly.',
ADD COLUMN IF NOT EXISTS ai_business_hours_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_business_hours_start text DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS ai_business_hours_end text DEFAULT '17:00',
ADD COLUMN IF NOT EXISTS ai_response_delay integer DEFAULT 2;

-- Add check constraint for response delay (1-10 seconds)
ALTER TABLE public.settings
ADD CONSTRAINT settings_ai_response_delay_check 
CHECK (ai_response_delay >= 1 AND ai_response_delay <= 10);

COMMENT ON COLUMN public.settings.ai_keywords IS 'Array of keywords that trigger AI response. If empty, responds to all messages.';
COMMENT ON COLUMN public.settings.ai_system_prompt IS 'Custom system prompt to set AI personality and context';
COMMENT ON COLUMN public.settings.ai_business_hours_enabled IS 'Enable AI only during business hours';
COMMENT ON COLUMN public.settings.ai_business_hours_start IS 'Business hours start time (HH:MM format)';
COMMENT ON COLUMN public.settings.ai_business_hours_end IS 'Business hours end time (HH:MM format)';
COMMENT ON COLUMN public.settings.ai_response_delay IS 'Delay in seconds before sending AI response (1-10)';