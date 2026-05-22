---
title: Design System & Theme Configuration
status: done
priority: urgent
type: feature
tags: [frontend, styling]
created_by: agent
created_at: 2026-05-22T11:51:09Z
position: 2
---

## Notes
Industrial-Utility aesthetic: monospace typography (JetBrains Mono + IBM Plex Mono), steel/charcoal/cyan palette, high-density layouts, technical precision. Dark/Light/System theme switcher with localStorage persistence.

## Checklist
- [ ] Import JetBrains Mono and IBM Plex Mono from Google Fonts
- [ ] Configure Tailwind with monospace font stack
- [ ] Set up color tokens: steel primary, charcoal backgrounds, cyan accents
- [ ] Create ThemeProvider with dark/light/system modes
- [ ] Build theme switcher component for navbar
- [ ] Configure globals.css with shadcn tokens in Industrial-Utility palette

## Acceptance
- Theme switcher persists selection across sessions
- All components use design system tokens
- Fonts render consistently across pages