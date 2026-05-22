---
title: Contact Management & CSV Import
status: done
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
- [x] Create Contacts page with data table (name, phone, tags, group, date)
- [x] Build Add Contact form with validation
- [x] Create CSV Import component with file upload and column mapping UI
- [x] Implement contact groups management (create, rename, delete)
- [x] Add tags system (multi-tag per contact)
- [x] Create Export to CSV function
- [x] Add search and filter by group/tag/status
- [x] Implement pagination (25/50/100 per page)
- [x] Create contact service functions

## Acceptance
- CSV import correctly maps columns and creates contacts
- Search and filters work across all fields
- Export generates valid CSV file