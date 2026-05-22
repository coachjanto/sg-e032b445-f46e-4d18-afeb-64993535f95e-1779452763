---
title: Dashboard Layout & Navigation
status: in_progress
priority: high
type: feature
tags: [frontend, layout]
created_by: agent
created_at: 2026-05-22T11:51:09Z
position: 4
---

## Notes
Main dashboard shell with collapsible sidebar, topbar with theme switcher and language selector, responsive layout. Sidebar shows: Dashboard, Live Chat, Devices, Contacts, Campaigns, Analytics, Settings.

## Checklist
- [ ] Create DashboardLayout component with sidebar navigation
- [ ] Build Sidebar component (collapsible, shows nav links with icons)
- [ ] Create Topbar with user menu, theme switcher, language selector
- [ ] Add mobile responsive behavior (sidebar → bottom nav on mobile)
- [ ] Create Dashboard overview page with stat cards
- [ ] Add placeholder chart components for analytics
- [ ] Build language switcher with ID/EN support
- [ ] Create i18n context with JSON translation files

## Acceptance
- Navigation works on desktop and mobile
- Theme switcher and language selector functional
- Dashboard shows overview statistics