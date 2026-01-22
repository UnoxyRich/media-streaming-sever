# Private Streaming Web Platform (Raspberry Pi)

This project is a private, self-hosted streaming web platform running on a Raspberry Pi 5 (8GB) with Raspberry Pi OS 64-bit. It provides an authenticated media catalog for externally hosted streams. The server never proxies full video data, and browsers connect directly to external sources.

## Features

- Secure login with HttpOnly JWT cookies
- Role-based access control (admin, user)
- Admin-only user creation and management
- Hierarchical media catalog (movie, anime, TV, shows, seasons, episodes)
- Watch history with resume playback
- Watch Later lists
- Stream sources and resolution metadata
- Video player supporting HLS, DASH, MP4
- Adaptive bitrate with manual quality override
- Subtitles with multiple tracks, external files, and ASS rendering via libass-wasm
- Nginx reverse proxy with HTTPS and secure headers

## Architecture

Browser (Vue SPA)
→ Nginx (HTTPS reverse proxy)
→ Node.js API
→ MySQL
→ External streaming sources (direct browser connection)

## Repository Layout

- `backend/` Node.js API server
- `frontend/` Vue 3 SPA
- `infra/` Nginx configuration
- `docs/` API reference

## System Setup (Raspberry Pi)

### 1. Install Dependencies

```bash
sudo apt update
sudo apt install -y nginx mysql-server certbot python3-certbot-nginx
```

Install Node.js (for example, Node 20 LTS) using the official NodeSource instructions for Raspberry Pi OS.

### 2. MySQL Setup

```bash
sudo mysql -e "CREATE DATABASE media_streaming CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'media_user'@'localhost' IDENTIFIED BY 'change-me';"
sudo mysql -e "GRANT ALL PRIVILEGES ON media_streaming.* TO 'media_user'@'localhost';"
```

### 3. Backend Setup

```bash
cd /workspace/media-streaming-sever/backend
cp .env.example .env
# edit .env to match your database and JWT settings
npm install
npm run migrate
node scripts/create-admin.js admin strong-password
npm start
```

The API listens on port 4000 by default.

### 4. Frontend Setup

```bash
cd /workspace/media-streaming-sever/frontend
npm install
npm run build
```

Copy `frontend/dist` to `/var/www/private-streaming`:

```bash
sudo mkdir -p /var/www/private-streaming
sudo cp -r dist/* /var/www/private-streaming/
```

### 5. Nginx and HTTPS

1. Copy `infra/nginx.conf` to `/etc/nginx/sites-available/private-streaming` and update `server_name` and paths.
2. Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/private-streaming /etc/nginx/sites-enabled/private-streaming
sudo nginx -t
sudo systemctl reload nginx
```

3. Run Certbot:

```bash
sudo certbot --nginx -d example.com
```

The Nginx config includes secure headers, HTTPS enforcement, and SPA routing.

## Usage

1. Sign in with the admin account created in the setup step.
2. Use the Admin Panel in the SPA to create users, add media entries, and attach stream sources and subtitles.
3. Users can browse the library, play media, resume playback, and manage Watch Later.

## API Documentation

See `docs/api.md` for the full route list.

## Notes

- Media files are not stored locally.
- Streams must be direct URLs to HLS, DASH, or MP4 sources.
- The server never proxies full video data.
- No user self-registration is available.

## License

See `LICENSE`.
