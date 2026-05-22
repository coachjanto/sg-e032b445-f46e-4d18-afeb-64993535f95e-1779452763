-- Extend profiles table with additional fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en' CHECK (language IN ('en', 'id')),
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));

-- Sender devices table (4 connection types)
CREATE TABLE IF NOT EXISTS sender_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  type text NOT NULL CHECK (type IN ('qr', 'dripsender', 'cloudchat', 'meta')),
  phone_number text,
  credentials_encrypted text,
  status text DEFAULT 'disconnected' CHECK (status IN ('connected', 'connecting', 'disconnected', 'expired')),
  last_active timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Contact groups
CREATE TABLE IF NOT EXISTS contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  tags text[] DEFAULT '{}',
  group_id uuid REFERENCES contact_groups(id) ON DELETE SET NULL,
  last_contacted timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Message templates (quick replies)
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  content text NOT NULL,
  variables text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_id uuid REFERENCES sender_devices(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  message_body text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'video', 'template')),
  media_url text,
  scheduled_at timestamp with time zone,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'cancelled', 'failed')),
  recurring_interval text,
  created_at timestamp with time zone DEFAULT now()
);

-- Campaign recipients (delivery tracking)
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Message logs (chat history)
CREATE TABLE IF NOT EXISTS message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES sender_devices(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_type text DEFAULT 'text',
  content text,
  media_url text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  timestamp timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invitee_email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sender_devices_user_id ON sender_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_sender_devices_status ON sender_devices(status);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_group_id ON contacts(group_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_device_id ON campaigns(device_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_device_id ON message_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_timestamp ON message_logs(timestamp DESC);