---
title: Sender Devices Management
status: done
priority: high
type: feature
tags: [frontend, backend]
created_by: agent
created_at: 2026-05-22T11:51:09Z
position: 5
---

## Notes
Devices page with table listing all connected WhatsApp numbers. Add Device modal supporting 4 connection types: QR (Baileys), DripSender API, CloudChat API, Meta Cloud API. Each shows connection status, test button, and credentials form.

## Checklist
- [ ] Create Devices page with table (name, phone, type, status, actions)
- [ ] Build Add Device modal with connection type selector
- [ ] Create QR Connection form (shows QR code, real-time status)
- [ ] Create DripSender Connection form (API Key, Base URL, test button)
- [ ] Create CloudChat Connection form (API Key, Instance ID, Webhook URL)
- [ ] Create Meta Cloud API form (Phone Number ID, Access Token, WABA ID, App ID)
- [ ] Add device actions: Connect, Disconnect, Edit, Delete
- [ ] Implement connection status badges (connected/connecting/disconnected)
- [ ] Create device service functions (CRUD operations)

## Acceptance
- User can add device with any of the 4 connection methods
- Status updates reflect actual connection state
- Device credentials saved encrypted