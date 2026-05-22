---
title: Database Schema & Authentication Setup
status: in_progress
priority: urgent
type: feature
tags: [backend, database, auth]
created_by: agent
created_at: 2026-05-22T11:46:17Z
position: 1
---

## Notes
Set up complete PostgreSQL schema for WhatsApp management platform with Supabase Auth integration. Includes users, devices, contacts, campaigns, messages, and templates tables with proper relationships and RLS policies.

## Checklist
- [ ] Create users table with profile fields (role, language, theme preferences)
- [ ] Create sender_devices table (4 connection types: qr/dripsender/cloudchat/meta)
- [ ] Create contacts table with tags and group support
- [ ] Create contact_groups table
- [ ] Create campaigns table with scheduling
- [ ] Create campaign_recipients table for delivery tracking
- [ ] Create message_logs table for chat history
- [ ] Create message_templates table for quick replies
- [ ] Create team_members table for collaboration
- [ ] Set up RLS policies for multi-tenant data isolation
- [ ] Create database functions for encryption/decryption of API credentials
- [ ] Generate TypeScript types

## Acceptance
- All tables created with proper foreign keys and indexes
- RLS policies prevent cross-user data access
- TypeScript types generated and importable