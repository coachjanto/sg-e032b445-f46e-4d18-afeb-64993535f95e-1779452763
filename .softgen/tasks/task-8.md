---
title: Campaign Management & Scheduling
status: todo
priority: medium
type: feature
tags: [frontend, campaigns]
created_by: agent
created_at: 2026-05-22T11:46:17Z
position: 8
---

## Notes
New Campaign page with message composer, recipient selector (individual, group, tag-based), message type selector (text/image/doc/video/template), scheduling with date-time picker, variable support. Campaign list with status tracking.

## Checklist
- [ ] Create New Campaign page with multi-step form
- [ ] Build device selector dropdown
- [ ] Create recipient selector (individual, group, tag filters)
- [ ] Add message type selector with rich text editor
- [ ] Implement variable insertion ({{name}}, {{phone}})
- [ ] Create message preview panel
- [ ] Add schedule picker (send now or schedule later)
- [ ] Build recurring campaign option
- [ ] Create Campaigns list page with table
- [ ] Add campaign detail page showing per-recipient status
- [ ] Implement cancel campaign action
- [ ] Create duplicate campaign function

## Acceptance
- Campaign sends to selected recipients
- Scheduled campaigns execute at specified time
- Delivery status tracked per recipient