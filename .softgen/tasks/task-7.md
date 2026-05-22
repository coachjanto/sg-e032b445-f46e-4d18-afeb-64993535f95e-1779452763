---
title: Live Chat Interface (WhatsApp Web Clone)
status: in_progress
priority: high
type: feature
tags: [frontend, real-time]
created_by: agent
created_at: 2026-05-22T11:51:09Z
position: 7
---

## Notes
Full-screen WhatsApp Web-style interface with multi-device sections in left panel (resizable, collapsible), chat window in right panel. Supports message bubbles, media, quick reply templates, typing indicators.

## Checklist
- [ ] Create LiveChat page with split layout (left panel + right panel)
- [ ] Build multi-device sections with collapse/expand per device
- [ ] Implement resizable dividers between device sections
- [ ] Create chat list component per device (avatar, name, last message, unread count)
- [ ] Build chat window with header, message bubbles area, input bar
- [ ] Add message bubble components (text, image, document, audio, quoted)
- [ ] Implement input bar with emoji picker, attach button, send button
- [ ] Create quick reply templates popup
- [ ] Add real-time message updates (WebSocket or polling based on device type)
- [ ] Implement infinite scroll for message history
- [ ] Add typing indicator and read receipts UI
- [ ] Create date separators (Today, Yesterday, etc.)

## Acceptance
- Multiple devices shown in left panel with independent chat lists
- Clicking a chat opens conversation in right panel
- Messages send successfully and appear in real-time