# Krowka — Real‑time Chat App

Krowka is a full‑stack, real‑time chat application built with React (Chakra UI) on the frontend and Go + Redis on the backend. It supports live messaging over WebSockets, persistent chat history in Redis, a contact list, and a Profile & Security panel where users can manage display details, avatar, password, and a 2FA preference.


## Preview

- Light/Dark theme with a color mode toggle
- Branded header with logo and interactive wordmark
- Landing page with feature highlights
- Chat screen with contact list, history pane, and message composer
- Profile drawer with avatar upload, profile fields, password change, and 2FA toggle


## Features

- Real‑time messaging via WebSockets (Go + Gorilla/websocket)
- Message persistence in Redis using RedisJSON and RediSearch
- Contact list sorted by recent activity (Redis Sorted Sets)
- Profile management: avatar, display name, email, phone
- Password change endpoint (validates current password)
- 2FA preference toggle (stored; see “Security notes” below)
- Responsive Chakra UI theming with dark mode


## Architecture

- Frontend: `client/` (React 18 + Chakra UI)
	- WebSocket client connects to `ws://localhost:8081/ws`
	- HTTP API calls to `http://localhost:8080`
- Backend: Go services
	- HTTP server on `:8080` (`pkg/httpserver`)
		- Auth (register/login)
		- Chat history and contacts
		- Profile CRUD, avatar upload, password change, 2FA toggle
		- Serves `/avatars/…` as static files
	- WebSocket server on `:8081` (`pkg/ws`)
		- Handles bootstrapping user connections and broadcasting messages to the two participants of a chat
- Data store: Redis (via `pkg/redisrepo`)
	- Requires RedisJSON and RediSearch (use Redis Stack)
	- Keys used:
		- `users` (Set) — all usernames
		- `<username>` (String) — password (plaintext in this demo; see Security notes)
		- `contacts:<username>` (ZSET) — last activity score per contact
		- `chat#<timestamp>` (RedisJSON) — individual chat document
		- `idx#chats` (RediSearch index) — search on chat fields
		- `profile:<username>` (RedisJSON) — profile document


## How it works

1. Registration/Login
	 - HTTP endpoints: `POST /register`, `POST /login`
	 - Users are stored in Redis (`users` set and `<username>` -> password). The React client stores a simple username session in `localStorage` to toggle UI state. In production you would use secure sessions or JWT.

2. Real‑time chat
	 - The client opens `ws://localhost:8081/ws` and sends a `bootup` message to map the socket to a username.
	 - Messages are JSON with `{ type: 'message', chat: { from, to, message } }`.
	 - Server stamps `timestamp`, persists the chat (RedisJSON) and broadcasts it to the two participants.

3. Chat history and contacts
	 - History: `GET /chat-history?u1=<userA>&u2=<userB>[&from-ts=0&to-ts=+inf]` uses RediSearch to fetch messages chronologically.
	 - Contacts: `GET /contact-list?username=<user>` reads a ZSET of recent contacts.

4. Profile & security
	 - Profile document lives at `profile:<username>` (RedisJSON): `{ username, displayName, email, phone, avatarUrl, twoFA }`.
	 - Endpoints:
		 - `GET /profile?username=<user>` — fetch profile
		 - `POST /profile` — save displayName/email/phone/avatarUrl
		 - `POST /avatar` — multipart upload; stores under `/avatars/` and updates profile
		 - `POST /password/change` — validate old password, set new one
		 - `POST /2fa/toggle` — set `twoFA` boolean


## Prerequisites

- Node.js 16+ and npm
- Go 1.20+
- Redis Stack (or Redis with RedisJSON + RediSearch modules)


## Configuration

Copy `.env-example` to `.env` and set your Redis connection:

```
REDIS_CONNECTION_STRING=<host>:<port>
REDIS_PASSWORD=<password>
```

Examples:

- Local Redis Stack with no password:
	- `REDIS_CONNECTION_STRING=localhost:6379`
	- `REDIS_PASSWORD=`


## Running locally (Windows PowerShell)

Open two terminals: one for the Go HTTP server and another for the WebSocket server, plus a third for the React client.

1) Start the HTTP API (port 8080):

```powershell
cd C:\Users\shiva\OneDrive\Desktop\Krowka\Krowka
go run . --server=http
```

2) Start the WebSocket server (port 8081):

```powershell
cd C:\Users\shiva\OneDrive\Desktop\Krowka\Krowka
go run . --server=websocket
```

3) Start the React client (port 3000):

```powershell
cd C:\Users\shiva\OneDrive\Desktop\Krowka\Krowka\client
npm install
npm start
```

Notes:

- The HTTP server ensures an `avatars/` folder exists in the repo root and serves it at `http://localhost:8080/avatars/...`.
- The client is configured to call `http://localhost:8080` and connect to `ws://localhost:8081/ws`.


## API quick reference

- Auth
	- `POST /register` — `{ username, password }`
	- `POST /login` — `{ username, password }`
- Contacts and chats
	- `POST /verify-contact` — `{ username }`
	- `GET /contact-list?username=<user>`
	- `GET /chat-history?u1=<a>&u2=<b>[&from-ts=0&to-ts=+inf]`
- Profile & security
	- `GET /profile?username=<user>`
	- `POST /profile` — `{ username, displayName, email, phone, avatarUrl }`
	- `POST /avatar` — multipart: `username`, `file`
	- `POST /password/change` — `{ username, oldPassword, newPassword }`
	- `POST /2fa/toggle` — `{ username, enabled }`


## Frontend highlights

- Chakra UI theme in `client/src/theme.js` with dark mode support.
- Color mode switcher (`ColorModeSwitcher.js`) in the header.
- Header shows the brand logo (Face_K) and “Krowka” wordmark; when logged in, an avatar menu provides Profile and Logout.
- Landing page showcases the app and CTA buttons.
- Chat screen (`client/src/Components/Chat/`) manages contacts, history, and sending messages over WebSocket.
- Profile drawer (`client/src/Components/ProfileDrawer.jsx`) handles:
	- Avatar upload
	- Display name, email, phone
	- 2FA toggle
	- Password change


## Security notes (important)

This project is a functional demo. For production:

- Password storage: The current code stores plaintext passwords in Redis to keep the demo simple. Replace with bcrypt (hash + salt) and compare hashes on login and password change.
- Authentication: Instead of using `localStorage` username for UI state, introduce secure sessions (httpOnly cookies) or JWTs with proper middleware to protect profile and password routes.
- 2FA: The toggle currently stores a boolean preference. Implement real TOTP 2FA (secret generation, QR code provisioning, and code verification on login) before considering this feature active.
- File uploads: Add file type/size validation and consider storing avatars in object storage (S3/Azure Blob) with a CDN for scale.
- CORS, rate limiting, logging, and input validation should be tightened as you move toward production.


## Troubleshooting

- “Redis Connection Failed”: Verify `.env` has correct `REDIS_CONNECTION_STRING` and `REDIS_PASSWORD`, and that Redis Stack is running.
- “WebSocket cannot connect”: Ensure the WebSocket server is running on `:8081` and not blocked by firewall.
- Client cannot load avatars: Confirm the HTTP server is running and the file exists under `avatars/` in the repo root; the URL will be `http://localhost:8080/avatars/<file>`.


## License

MIT — feel free to use and adapt. Attribution appreciated.


## Screenshots

Below are quick visuals using the assets in this repo. Replace with live screenshots when you’re ready.

### Brand

<img width="1536" height="1024" alt="Logo" src="https://github.com/user-attachments/assets/14264b19-d4e4-44b3-9e60-b492d3872062" />

### Reference UI

<img width="1024" height="1536" alt="Krowka_Ref" src="https://github.com/user-attachments/assets/81d51c4b-a98d-410d-8085-608a12e4c135" />


