[README.md](https://github.com/user-attachments/files/24789426/README.md)
# Private Streaming Web Platform (Raspberry Pi)

This project is a private, self-hosted streaming web platform running on a Raspberry Pi 5 (8GB).

The system allows authenticated users to watch externally hosted movies, anime, and TV shows directly inside a web browser, without leaving the site. Media is not stored locally and is streamed from third-party sources.

This platform is designed for personal/private use, with controlled user access and an admin-managed media catalog.

## Core Features

- Secure login (username + password)
- Role-based access (admin / user)
- Admin-only user creation
- Hierarchical media library:
  - Categories (Movie / Anime / TV)
  - Shows → Seasons → Episodes
- Embedded in-site playback (no redirects)
- Adaptive streaming (HLS / DASH / MP4)
- Custom video player
- Resume playback (watch history)
- Watch Later lists
- Advanced subtitle support:
  - SRT
  - WebVTT
  - ASS (styled subtitles)
- HTTPS (Let’s Encrypt)
- Internet-accessible deployment
- Native installation only (no Docker)

## Architecture Overview

Browser (Vue SPA)
→ Nginx (HTTPS reverse proxy)
→ Node.js API
→ MySQL
→ External streaming sources (direct browser connection)

Important notes:
- The Raspberry Pi does not relay full video data
- Media streams go directly from source to browser
- The server handles authentication, metadata, and UI logic only

## Technology Stack

Backend:
- Node.js (Express or Fastify)
- MySQL 8
- JWT authentication
- bcrypt password hashing

Frontend:
- Vue 3 (SPA)
- Video.js and Shaka Player
- libass-wasm for ASS subtitles

Infrastructure:
- Raspberry Pi OS 64-bit
- Nginx
- Certbot (Let’s Encrypt)

## Security

- HTTPS enforced
- HttpOnly authentication cookies
- Rate limiting on login and API endpoints
- Role-based authorization checks
- No public account creation

## Usage Notes

- This project does not host or store media files
- Streaming sources are provided manually or resolved via plugins
- Reliability depends on external sources
- Intended for private or educational use only

## Status

Under active development.
See agent.md for detailed implementation instructions.
