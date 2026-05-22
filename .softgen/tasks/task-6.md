---
title: Contact Management & CSV Import
status: in_progress
priority: medium
type: feature
tags: [frontend, backend]
created_by: agent
created_at: 2026-05-22T11:51:09Z
position: 6
---

## Notes
Contacts page with searchable table, add contact form, bulk CSV import with column mapping, groups and tags management, export to CSV.

## Checklist
- [ ] Create Contacts page with data table (name, phone, tags, group, date)
- [ ] Build Add Contact form with validation
- [ ] Create CSV Import component with file upload and column mapping UI
- [ ] Implement contact groups management (create, rename, delete)
- [ ] Add tags system (multi-tag per contact)
- [ ] Create Export to CSV function
- [ ] Add search and filter by group/tag/status
- [ ] Implement pagination (25/50/100 per page)
- [ ] Create contact service functions

## Acceptance
- CSV import correctly maps columns and creates contacts
- Search and filters work across all fields
- Export generates valid CSV file