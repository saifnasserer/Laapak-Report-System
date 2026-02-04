---
name: managing-remote-servers
description: Specialized skill for managing and performing actions on the remote VPS (82.112.253.29). Use when the user mentions "vps", "remote server", "deploy", or needs to run commands on the server.
---

# Remote Server Management

Tools and workflows for managing the **FixZone VPS**.

## Server Information

- **Host:** `82.112.253.29`
- **User:** `deploy`
- **Identity:** Use password `0000` (Use `sshpass -p "0000"` for automated scripts)
- **Active Deployment Path:** `/home/deploy/fz-projects/system/docker-infra` (Central infrastructure & Proxy)
- **Source Code Path:** `/home/deploy/fz-projects/system` (Git Repo Root)
- **Structure Snapshot:** 👉 **[`resources/server-snapshot.md`](resources/server-snapshot.md)**

## When to Use
- User wants to check server status (Docker containers)
- User needs to deploy new code (Git + Docker Build)
- User wants to run database migrations on production (Inside Docker)
- User needs to check remote logs (Docker logs)

## Workflow: Deployment & File Transfer

**PRIMARY METHOD: GitHub**
Always prefer using Git to move code to the server. This ensures version control and consistency.

```markdown
- [ ] Push local changes to GitHub (`git push origin main`)
- [ ] SSH into server
- [ ] Navigate to source: `cd /home/deploy/fz-projects/system`
- [ ] Pull latest code: `git pull`
- [ ] Go to infra: `cd docker-infra`
- [ ] Rebuild service: `docker compose up -d --build fz-system` (or `fz-frontend`)
```

## Common Commands

### 1. Docker-Based Deployment (Recommended)
```bash
# 1. Local: Push changes
git push origin main

# 2. Remote: Pull Code & Rebuild
sshpass -p "0000" ssh deploy@82.112.253.29 "cd /home/deploy/fz-projects/system && git pull && cd docker-infra && docker compose up -d --build fz-system fz-frontend"
```

### 2. Server Maintenance
```bash
# Check all container status
docker ps

# Check logs for a specific service (Backend is 'fz-system')
docker logs --tail 100 -f fz-system

# Check logs for Frontend
docker logs --tail 100 -f fz-frontend

# Restart the backend
cd /home/deploy/fz-projects/system/docker-infra && docker compose restart fz-system

# Check system resources
htop
df -h
```

### 3. Service Mapping
- **Frontend & API:** `system.fixzzone.com` -> `fz-frontend` (80), `fz-system` (4000)
- **Evolution API:** `wa.fixzzone.com` -> `evolution-api` (8080)
- **n8n Automation:** `n8n-auto.fixzzone.com` -> `n8n` (5678)
- **Laapak Services:** `reports.laapak.com` (3001), `po.laapak.com` (3002)
- **Database:** `mysql-db` (MySQL 8.0)

### 4. Direct File Transfer (Fallback)
```bash
# Upload .env or config files
sshpass -p "0000" scp .env.production deploy@82.112.253.29:/home/deploy/fz-projects/system/backend/.env
```

## Security & Best Practices

- **Password Prompt:** I will prompt for the password (`0000`) if needed.
- **Root Password:** The MySQL root password is `rootpassword` (or `0000` inside `docker-compose`).
- **Database Migrations:** Run inside `fz-system`: `docker exec -it fz-system npm run migrate`.

### Accessing Secured Database (MySQL)
Since port `3306` is bound to localhost only:
1.  **Do NOT** connect to `82.112.253.29:3306` directly.
2.  **Use SSH Tunnel:**
    ```bash
    ssh -L 3306:127.0.0.1:3306 deploy@82.112.253.29
    ```
3.  **Connect Client:** Host: `127.0.0.1`, Port: `3306`, User: `root`, Pass: `0000`.

## Troubleshooting & Common Pitfalls

### 1. "Code Not Updating" (Stale Containers)
If you deploy but changes don't appear:
- **Diagnosis:** Check if the running container has the old code.
  ```bash
  docker exec fz-system grep "new_string" /app/path/to/file.js
  ```
- **Cause:** Docker build might have failed silently, or you are looking at the wrong directory.
- **Fix:** Rebuild explicitly: `docker compose up -d --build fz-system`.

### 2. Nginx Proxy Issues (Docker-managed)
- **Context:** Nginx is now a Docker container (`nginx-proxy`).
- **Configs:** Found in `/home/deploy/fz-projects/system/docker-infra/nginx/conf.d/`.
- **Restart:** `docker compose restart nginx-proxy`.
- **Important:** Host-level Nginx must remain **DISABLED** to avoid port 80/443 conflicts.

### 3. PM2 / Host Services
- **Note:** PM2 and Host-level Nginx have been removed/uninstalled. All logic must reside in Docker containers.

### 3. SQL Errors (500 Internal Server Error)
- **Constraint:** The production database runs in **Strict Mode** (`only_full_group_by`).
- **Symptom:** Queries working locally fail on production with `Expression #X of SELECT list is not in GROUP BY clause`.
- **Fix:** Ensure all non-aggregated columns in the SELECT list are present in the GROUP BY clause.

## Standard Maintenance Procedures

### 1. File Organization
- **Backups:** Store all SQL dumps in `/home/deploy/backups_sql/`. Do not clutter the home root.
- **Periodicity:** Run a cleanup script monthly to archive old backups.

### 2. Security Hardening
- **Database Ports:** limit `3306` access.
  - *Best Practice:* Do not map `3306:3306` in `docker-compose.yml`. Use `127.0.0.1:3306:3306` if local access is needed, or rely on Docker network/SSH Tunnels.
- **Firewall:** Ensure `ufw` limits SSH to known IPs if possible.

### 3. Debugging Health Checks
- **Problem:** Alpine images often resolve `localhost` to IPv6 (`::1`), causing `wget` connection refused errors if the service listens on IPv4 only.
- **Solution:** Always use `http://127.0.0.1/` in `HEALTHCHECK` commands for Alpine-based containers.

