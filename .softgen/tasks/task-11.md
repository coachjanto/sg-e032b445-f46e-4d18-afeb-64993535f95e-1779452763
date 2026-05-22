---
title: Settings Page - API Configuration
status: in_progress
priority: high
type: feature
tags: [settings, api, configuration]
created_by: agent
created_at: 2026-05-22T13:17:18Z
position: 11
---

## Notes
Halaman pengaturan untuk konfigurasi API eksternal:
- Dripsender API (untuk blast WhatsApp)
- Cloudchat API (untuk integrasi chat)
- AI Auto-reply dengan OpenAI dan Gemini

Settings disimpan di tabel `settings` dengan enkripsi untuk API keys.

## Checklist
- [ ] Create `settings` table di Supabase dengan RLS
- [ ] Create settings.tsx page dengan form untuk 3 API providers
- [ ] Form Dripsender: API key, webhook URL
- [ ] Form Cloudchat: API key, endpoint
- [ ] Form AI Auto-reply: toggle OpenAI/Gemini, API keys, model selection
- [ ] Add Settings link di DashboardLayout sidebar
- [ ] Implement save/update settings dengan toast notification

## Acceptance
- User bisa menyimpan dan mengubah API credentials untuk Dripsender, Cloudchat, OpenAI, dan Gemini
- Settings tersimpan secure di database dengan RLS
- Toast notification muncul saat berhasil/gagal menyimpan