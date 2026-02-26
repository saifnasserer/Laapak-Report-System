---
name: evolution-api-management
description: Handles the management, deployment, and configuration of Evolution API v2, including instances, database persistence, Redis caching, AI integrations, and high-performance setups.
---

# Evolution API v2 Master Management

Specialized skill for managing Evolution API v2 within high-scale environments like FixZone. Version 2.x introduces mandatory database persistence (Prisma) and optimized Redis caching.

## When to Use
- **Configuration:** Managing complex environment variables.
- **Scaling:** Moving from local storage to S3/Minio or Redis.
- **AI Integration:** Setting up Typebot or OpenAI assistants.
- **Maintenance:** Handling Prisma migrations and container health.

## Infrastructure Matrix

| Component | Role | Recommendation |
|-----------|------|----------------|
| **Redis** | Cache/Sessions | **Mandatory** for stable multi-instance setups. |
| **MySQL/Postgres** | Persistence | **PostgreSQL Mandatory** for v2.3.7+. MySQL has query compatibility issues. |
| **Image Version** | Stability | **v2.3.7** is the stable baseline. Avoid `latest` in production/local dev to prevent breaking changes. |
| **Nginx Proxy** | SSL/Routing | Requires `Upgrade` headers for WebSockets. |

## Advanced Configuration (Environment)

### 1. High Performance & Persistence
```env
# Persistence (Mandatory)
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:pass@postgres:5432/evolution?schema=public
DATABASE_CONNECTION_CLIENT_NAME=fixzone_prod

# Save Toggles (Optimize DB size)
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=false
DATABASE_SAVE_DATA_LABELS=false

# Redis (Mandatory for Performance)
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://redis:6379/1
CACHE_REDIS_SAVE_INSTANCES=true
CACHE_LOCAL_ENABLED=false
```

### 2. Media & Disk Management (S3/Minio)
To prevent VPS disk saturation (FixZone is currently at 74%):
```env
S3_ENABLED=true
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=fixzone-whatsapp
S3_PORT=443
S3_ENDPOINT=s3.yourprovider.com
S3_USE_SSL=true
```

### 3. AI & Chatbot Integrations
- **Typebot:** `TYPEBOT_ENABLED=true`, `TYPEBOT_URL=...`
- **OpenAI:** `OPENAI_ENABLED=true`, `OPENAI_API_KEY=...`

## Operational Workflows

### Instance Life Cycle
- **Create:** `POST /instance/create`
- **Connect:** Scan QR from `SERVER_URL`.
- **Delete:** `DELETE /instance/delete/{instanceName}` (Cleans DB and Redis).

### Webhook Optimization
Avoid "webhook flooding" by enabling only essential events:
- `WEBHOOK_EVENTS_MESSAGES_UPSERT=true`
- `WEBHOOK_EVENTS_MESSAGES_UPDATE=true`
- `WEBHOOK_EVENTS_CONNECTION_UPDATE=true`

## Performance Checklist
- [ ] **Redis Status:** `docker exec redis redis-cli ping` (Should return `PONG`).
- [ ] **DB Migrations:** Evolution runs Prisma migrations on startup. Monitor logs for `Migration succeeded`.
- [ ] **WSS Connection:** Verify Nginx allows `Upgrade: websocket`.
- [ ] **Disk Space:** Audit `/var/lib/docker/volumes` if S3 is not enabled.

## Code Integration Tips
When using `EvolutionProvider.js`:
1.  **Headers:** Always include `apikey` (v2 requirement).
2.  **Buttons:** v2 supports Interactive Buttons (List, Reply, CTA).
3.  **Error Handling:** Catch `401 Unauthorized` (ApiKey mismatch) and `404` (Instance disconnected).

## Troubleshooting (Deep Dive)
- **"Prisma Client not found":** Usually a failed `npm install` or `prisma generate` inside the container. Re-pull the image.
- **QR Code Disconnects:** Check if `SERVER_URL` is using `https`. Insecure origins block QR polling.
- **"Connecting" Loop (QR not showing):** Often caused by persistent session metadata residue or version instability. Perform a "Deep Reset" (volume removal) and upgrade to v2.3.7.
- **Redis "Max Memory" reached:** Increase Redis memory limit or set a TTL for session keys.
- **Database Connection Race Condition:** API starts before Postgres is ready. See "Sequenced Startup" in Best Practices.
- **Port 8080 "Address already in use" Crash:** In v2.3.7, explicitly setting `SERVER_TYPE=baileys` may trigger a secondary listener crash. Use `SERVER_TYPE=http` or leave it default.


## Case Studies & Resolutions

### 1. QR Code Visibility (Baileys Version Mismatch)
**Problem:** Instances stuck in `connecting` due to outdated internal WhatsApp Web version in Baileys.
**Solution:** Explicitly set `CONFIG_SESSION_PHONE_VERSION` env var to the latest WhatsApp Web version (e.g., `2.3000.x`).

### 2. 500 Error on `findChats` (MySQL Compatibility)
**Problem:** In v2.3.7+, fetching chats throws `Invalid prisma.$queryRaw() invocation ... Named and positional parameters mixed`.
**Root Cause:** The codebase uses PostgreSQL-specific raw SQL syntax (`::double precision`, `DISTINCT ON`) that is incompatible with the Prisma MySQL driver.
**Solution:** Migrate database to **PostgreSQL**.
1. Update `docker-compose.yml` to use `postgres:15-alpine` service.
2. Set `DATABASE_PROVIDER=postgresql`.
3. Update `DATABASE_CONNECTION_URI=postgresql://user:pass@host:5432/db?schema=public`.
4. **Note:** Requires a fresh instance creation/QR scan as sessions are DB-bound.

### 3. Webhook Forwarding Errors (404 Not Found from n8n)
**Problem:** The `WebhookLog` shows events are successfully received from Evolution API, but forwarding destination (like n8n) returns a `404 Not Found`.
**Root Cause:** The destination webhook URL is either inactive or expecting a different endpoint type.
**Solution:** 
1. **If using n8n Production URL (`.../webhook/...`):** Ensure the workflow in n8n is set to **Active**. Inactive workflows will reject incoming webhooks with 404.
2. **If Testing in n8n:** n8n requires you to click "Listen for Test Event" and use the specific test URL (`.../webhook-test/...`). If you use the production URL while testing (or vice versa), it will return 404.
3. Check the "سجلات الويب هوك" (Webhook Logs) in FixZone Settings to view the exact error message returned by the destination server to differentiate between connection timeouts (500) and missing endpoints (404).

### 4. Local Development: API Port Mismatch (404 Errors)
**Problem:** Frontend components return `404 Not Found` or `Route not found` for newly created endpoints, even though they exist in `backend/routes/`.
**Root Cause:** The local backend Node process (`npm run dev` or `node server.js`) was started *before* the new route was added. It is running an old version of the code in memory. Alternatively, the frontend is pointed to the wrong port (e.g., trying to access backend via `localhost:3000` or `3001` instead of `4000`).
**Solution:**
1. Manually kill and restart the local backend process: 
   ```bash
   kill -9 $(lsof -t -i:4000)
   node server.js
   ```
2. Verify `lib/apiConfig.js` and `.env` to ensure `REACT_APP_API_URL` correctly points to the running backend port (usually `4000` via proxy in `vite.config.js`).

### 6. Local Development: QR Code Stabilization (Deep Reset)
**Problem:** QR code fails to appear in Manager, even with correct `.env`. API logs show continuous "connecting" updates but no handshake.
**Root Cause:** Corruption in the `evolution_instances` volume or a schema mismatch during an auto-migration failure.
**Solution:**
1. **Sequenced Reset**:
   ```bash
   docker compose down -v  # Essential to clear volumes
   sudo rm -rf ./evolution-api_data # Clear host-mapped data
   docker compose up -d evolution-postgres evolution-redis
   # Wait for Postgres to be ready
   docker exec evolution_postgres pg_isready 
   docker compose up -d evolution_api evolution_manager
   ```
2. **Standardize Browser Identity**: Set `CONFIG_SESSION_PHONE_BROWSER="Evolution API"` in `.env`. Some default strings (e.g., Ubuntu kernel versions) can be flagged by WhatsApp.
3. **Forced Reload**: Use `docker compose up -d` instead of `docker restart` to ensure environment variables (especially Browser Identity) are re-injected into the container.

### 7. Global WebSocket Visibility
**Problem:** Instances appear in the Manager, but the "Connecting" UI/QR code never refreshes.
**Cause:** `VITE_WS_URL` is missing or pointing to the wrong host.
**Solution:** In `docker-compose.yml`, explicitly set:
```yaml
environment:
  - VITE_API_URL=http://localhost:9080
  - VITE_WS_URL=ws://localhost:9080
```
This ensures the browser (client-side) can establish the necessary real-time link to the API.

## FixZone Production Environment (VPS)

> [!IMPORTANT]
> **Host:** `82.112.253.29` (User: `deploy`, Identity: `ssh vps`)
> **Docker Path:** `/home/deploy/fz-projects/system/docker-infra`

### 1. Deployment Specification
- **Service Name:** `evolution-api`
- **Image:** `evoapicloud/evolution-api:v2.3.7`
- **Internal Port:** `8080`
- **Public URL:** `https://wa.fixzzone.com`
- **Internal Network URL:** `http://evolution-api:8080` (Use this for n8n/Backend)

### 2. Verified Configuration (Environment)
The following settings were verified on the active production container (`c68287b47c7c`).

#### **Authentication & Security**
```env
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=laapak_wa_2026_***  # Ask Admin for full key
SERVER_URL=https://wa.fixzzone.com
CORS_ORIGIN=*
```

#### **Database & Caching (Critical)**
- **Database:** Uses `postgres-db` container (`postgres:15-alpine`).
- **Redis:** Uses `redis` container (`redis:alpine`).
```env
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:0000@postgres-db:5432/evolution?schema=public
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://redis:6379/1
```

### 3. Operational Commands (VPS)
Use the `ssh vps` alias.

**Restart Service:**
```bash
ssh vps "cd /home/deploy/fz-projects/system/docker-infra && docker compose restart evolution-api"
```

**Check Logs:**
```bash
ssh vps "docker logs --tail 100 -f evolution-api"
```

**Run Database Migrations (Manual):**
Migrations run automatically on container startup. To trigger manually:
```bash
ssh vps "docker restart evolution-api"
```

### 4. Known Issues & Workarounds (FixZone Specific)

#### Webhook Event String Matching (CRITICAL)
When processing webhooks from Evolution API (e.g., inside `evolution.handler.service.js`), be extremely careful with event string matching.
- **Issue:** Evolution API sends events using dot notation, e.g., `messages.upsert`.
- **Pitfall:** If your backend logic converts the event to uppercase (e.g., `normalizedEvent = event.toUpperCase()`), it becomes `MESSAGES.UPSERT`. Do NOT check against `MESSAGES_UPSERT` (with underscore), as this will cause the webhook to silently be ignored.
- **Fix:** Always check against both variations to be safe: `if (event === 'MESSAGES.UPSERT' || event === 'MESSAGES_UPSERT')`. This was the root cause of inbound chat messages not appearing in the Live Chat UI.

### 6. Technical Reference: Evolution API V2 Media Uploads

To avoid "400 Bad Request" or file rendering issues in WhatsApp, always follow this specification for `POST /message/sendMedia/{instance}`:

#### **Payload Specification**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `number` | String | Yes | Recipient phone (e.g., `1234567890`). |
| `mediatype` | String | Yes | Strictly: `"image"`, `"video"`, or `"document"`. |
| `mimetype` | String | Yes | Standard MIME type (e.g., `image/jpeg`, `application/pdf`). |
| `media` | String | Yes | **Raw Base64 string** (preferable in v2.3.7) or public URL. |
| `fileName` | String | Yes | Name with extension (e.g., `image.png`). |
| `caption` | String | No | Accompanying text message. |

#### **Critical Rules for FixZone Operations**
1.  **Strict Media Mapping**: 
    - Always map `audio` or `xls` to `document` `mediatype`. 
    - Unsupported types result in silent failure or 400.
2.  **Base64 Formatting**:
    - **V2.3.7 Preference**: Raw Base64 string (remove `data:...;base64,` prefix).
    - If Base64 length is excessive, Ensure the server timeout is > 30s.
3.  **Frontend State Consistency**:
    - In `ChatWindow.js`, do NOT clear `selectedFiles` state on minor thread updates (e.g., status updates). Only clear it when `thread.id` changes.
    - Use `console.debug` for tracking file selection without flooding production logs.

#### **Troubleshooting Knowledge Base**
- **Error: `media should not be empty`**: Check if the Base64 content is being correctly read from disk in `chat.service.js`.
- **Error: `400 Bad Request` (Validation Failed)**: Usually due to a missing `fileName` or invalid `mediatype`.
- **File not opening on phone**: Ensure the `fileName` extension matches the `mimetype` transmitted.

### 7. Core Message Endpoints Directory (V2 Complete Reference)
Beyond media, here are the exact payload structures for other common Evolution API V2 message types based on the official documentation:

#### 1. Send Plain Text
**POST** `/message/sendText/{instance}`
```json
{
  "number": "5511999999999",
  "text": "Hello this is a plain text message!",
  "delay": 1200
}
```

#### 2. Send WhatsApp Audio (Voice Note / PTT)
**POST** `/message/sendWhatsAppAudio/{instance}`
Sends an audio file as if it was recorded in real-time (shows a microphone icon instead of a file icon).
```json
{
  "number": "5511999999999",
  "audio": "<base64_string>",
  "delay": 1200
}
```
*Note: The audio MUST be encoded in opus/ogg format for WhatsApp to render it as a Voice Note.*

#### 3. Send Location
**POST** `/message/sendLocation/{instance}`
```json
{
  "number": "5511999999999",
  "name": "FixZone Main Office",
  "address": "123 Tech Street, City",
  "latitude": "-23.550520",
  "longitude": "-46.633308"
}
```

#### 4. Send Contact (vCard)
**POST** `/message/sendContact/{instance}`
```json
{
  "number": "5511999999999",
  "contact": [
    {
      "fullName": "Support Team",
      "wuid": "5511888888888" // The phone number of the contact being shared
    }
  ]
}
```

#### 5. Send Reaction
**POST** `/message/sendReaction/{instance}`
Used to react to an existing message in a thread.
```json
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": false,
    "id": "BAE5... (Original Message ID)"
  },
  "reaction": "👍" // Emoji to react with
}
```

#### 6. Send Poll (Beta/V2 specific)
**POST** `/message/sendPoll/{instance}`
```json
{
  "number": "5511999999999",
  "name": "Rate our service:",
  "options": [
    "Excellent",
    "Good",
    "Needs Improvement"
  ],
  "selectableCount": 1
}
```

### 8. Advanced Management Endpoints (V2 Complete Reference)

#### A. Profile Settings
**1. Update Profile Picture**
**POST** `/profile/updateProfilePicture/{instance}`
```json
{
  "number": "5511999999999", // To update a group's picture, pass the group JID here
  "picture": "<base64_string>" // Raw Base64 of the image
}
```

**2. Update Profile Name**
**POST** `/profile/updateProfileName/{instance}`
```json
{
  "name": "FixZone Support"
}
```

**3. Update Profile Status (About / Bio)**
**POST** `/profile/updateProfileStatus/{instance}`
```json
{
  "status": "Available to help! FixZone Support"
}
```

#### B. Group Management
**1. Create Group**
**POST** `/group/createGroup/{instance}`
```json
{
  "subject": "VIP Support - FixZone",
  "description": "Premium support group for VIP clients",
  "participants": [
    "5511888888888" // Array of numbers to add initially
  ]
}
```

**2. Update Participants (Add/Remove/Promote)**
**POST** `/group/updateParticipant/{instance}`
```json
{
  "groupJid": "1234567890@g.us", // Must use group ID/JID, not phone number
  "action": "add", // Options: "add", "remove", "promote", "demote"
  "participants": [
    "5511888888888"
  ]
}
```

#### C. Chat Management
**1. Mark Message as Read**
**POST** `/chat/markMessageAsRead/{instance}`
Very important for CRM integrations so messages don't stay "unread" in WhatsApp Web.
```json
{
  "readMessages": [
    {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "BAE53414..." // The ID of the message to mark as read
    }
  ]
}
```

**2. Archive Chat**
**POST** `/chat/archiveChat/{instance}`
```json
{
  "lastMessage": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "id": "BAE53414..." // The last message ID in the thread
  },
  "archive": true // true to archive, false to unarchive
}
```

#### D. Webhook Management
**1. Set/Update Webhook**
**POST** `/webhook/set/{instance}`
```json
{
  "url": "https://api.fixzzone.com/api/evolution/webhook",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "CONNECTION_UPDATE"
  ]
}
```
*Note: Sending this request will overwrite any existing webhook configuration for the instance.*
