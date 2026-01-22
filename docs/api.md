# API routes

Base path: `/api`

## Auth

- `POST /auth/login`
  - Body: `{ "username": string, "password": string }`
  - Response: user profile
- `POST /auth/logout`
- `GET /auth/me`

## Users (admin)

- `GET /users`
- `POST /users`
  - Body: `{ "username": string, "password": string, "role": "admin" | "user" }`
- `PATCH /users/:id`
  - Body: `{ "is_active"?: boolean, "role"?: "admin" | "user", "password"?: string }`

## Media

- `GET /media`
  - Query: `category`, `type`, `parent_id`
- `GET /media/:id`
- `POST /media` (admin)
- `PATCH /media/:id` (admin)
- `DELETE /media/:id` (admin)

## Streams

- `GET /media/:id/streams`
- `POST /media/:id/streams` (admin)
- `PATCH /media/streams/:streamId` (admin)
- `DELETE /media/streams/:streamId` (admin)

## Subtitles

- `GET /media/:id/subtitles`
- `POST /media/:id/subtitles` (admin)
- `PATCH /media/subtitles/:subtitleId` (admin)
- `DELETE /media/subtitles/:subtitleId` (admin)

## Watch history

- `GET /media/me/watch-history`
- `PUT /media/:id/watch-history`
  - Body: `{ "position_seconds": number }`

## Watch later

- `GET /media/me/watch-later`
- `POST /media/:id/watch-later`
- `DELETE /media/:id/watch-later`

## Stats (admin)

- `GET /stats`
