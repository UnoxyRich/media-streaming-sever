# Agent Instructions

You are implementing a private streaming web platform for a Raspberry Pi.

Follow these instructions exactly. Do not add features, UI elements, or stylistic changes unless explicitly requested.

## Critical UI and Style Rules

These rules are mandatory:
- Do not use emojis anywhere
- Do not use blue bracket or decorative bracket UI elements
- Do not add playful, gamified, or flashy visuals
- UI must be minimal, neutral, and professional
- Avoid excessive animations

Design target: internal enterprise dashboard style.

## Platform Constraints

- Raspberry Pi 5 (8GB)
- Raspberry Pi OS 64-bit
- Native installation only
- Docker is not allowed

## Backend Requirements

- Node.js
- Express or Fastify
- MySQL database
- JWT-based authentication
- bcrypt password hashing

## Frontend Requirements

- Vue 3 SPA
- API-driven architecture
- Auth-aware routing
- Role-based UI rendering

## Reverse Proxy

- Nginx
- HTTPS via Let’s Encrypt
- HTTP redirected to HTTPS

## Authentication Rules

- Users cannot self-register
- Admins create users via admin panel
- Roles: admin, user
- Role checks must be enforced server-side
- Admin routes must be protected at API level

## Media and Streaming Rules

- Media is not stored locally
- Streams must play inside the site
- Browser connects directly to external stream URLs
- Server must not proxy full video data
- Supported formats:
  - HLS (.m3u8)
  - DASH (.mpd)
  - MP4
- Adaptive bitrate enabled when supported

## Player Requirements

- Use Video.js and/or Shaka Player
- Resume playback per user
- Multiple subtitle tracks
- External subtitle files
- ASS subtitles via libass-wasm
- Automatic quality selection with manual override

## Minimum Data Model

Tables:
- users (id, username, password_hash, role)
- media (id, type, hierarchy fields)
- streams (media_id, source, format)
- watch_history (user_id, media_id, position)
- watch_later (user_id, media_id)

## Admin Panel

Admin users must be able to:
- Create and disable users
- Add and edit media entries
- Attach streaming sources
- View basic usage statistics

Admin panel must:
- Use the same SPA
- Be role-gated
- Share the same authentication system

## Legal and Safety Constraints

- Do not hardcode third-party site logic
- Abstract stream resolvers behind interfaces
- No automated scraping unless explicitly added later demonstrate
- Avoid embedding third-party branding

## Implementation Guidance

If a decision is unclear:
- Prefer simplicity over cleverness
- Prefer stability over features
- Prefer explicit behavior over hidden magic

Do not violate any UI or architectural constraints.
