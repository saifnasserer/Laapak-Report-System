# Laapak Report System

A comprehensive reporting and management system for Laapak.

## 📁 Project Structure

- `frontend-react/`: Modern React frontend (Next.js 16).
- `backend/`: Node.js Express backend.
- `docs/`: Documentation and references.

## 🌐 Service Map

The system consists of the following services accessible via Nginx Proxy:

| URL | Component | Container |
| :--- | :--- | :--- |
| `reports.laapak.com` | **Laapak Reports (Public)** | `laapak-frontend-react` |
| `reports.laapak.com:3001` | **Reports API** | `report-system` |
| `system.fixzzone.com` | **FixZone Main System** | `fz-system` |
| `po.laapak.com` | **Purchase Order System** | `laapak-po` |
| `wa.fixzzone.com` | **WhatsApp Evolution API** | `evolution-api` |
| `n8n-auto.fixzzone.com` | **n8n Automations** | `n8n` |

## 🛠️ Deployment

For detailed deployment instructions, see the [Deployment Workflow](.agent/workflows/deploy.md).

### Quick Deployment (Report System)
```bash
git push origin main
sshpass -p "0000" ssh deploy@82.112.253.29 "cd /home/deploy/laapak-projects/reports && git pull origin main && docker compose -f remote-docker-compose.yml up -d --build"
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS.
- **Backend**: Node.js, Express, Sequelize, MySQL.
- **Infrastructure**: Docker, Docker Compose, Nginx.
