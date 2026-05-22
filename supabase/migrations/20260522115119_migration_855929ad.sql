-- Ultra-simple RLS policies with direct auth.uid() checks only

-- Sender devices (user owns directly)
ALTER TABLE sender_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_devices" ON sender_devices FOR ALL USING (user_id = auth.uid());

-- Contact groups (user owns directly)
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_groups" ON contact_groups FOR ALL USING (user_id = auth.uid());

-- Contacts (user owns directly)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_contacts" ON contacts FOR ALL USING (user_id = auth.uid());

-- Message templates (user owns directly)
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_templates" ON message_templates FOR ALL USING (user_id = auth.uid());

-- Campaigns (user owns directly)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_campaigns" ON campaigns FOR ALL USING (user_id = auth.uid());

-- Campaign recipients (authenticated users only, app filters by campaign ownership)
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_campaign_recipients" ON campaign_recipients FOR ALL USING (auth.uid() IS NOT NULL);

-- Message logs (authenticated users only, app filters by device ownership)
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_message_logs" ON message_logs FOR ALL USING (auth.uid() IS NOT NULL);

-- Team members (can see sent and received invites)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_team_invites" ON team_members FOR ALL USING (
  inviter_id = auth.uid() OR auth.email() = invitee_email
);