---
description: Deploying Laapak Reports System to remote VPS
---

# Deployment Workflow

Follow these steps to deploy changes to the production server.

## 1. Local Preparation
Before deploying, ensure your changes are committed and pushed to the main repository.

```bash
git add .
git commit -m "feat: your descriptive message"
git push origin main
```

## 2. Remote Deployment
Connect to the VPS and execute the deployment commands.

// turbo
```bash
sshpass -p "0000" ssh -o StrictHostKeyChecking=no deploy@82.112.253.29 "cd /home/deploy/laapak-projects/reports && git pull origin main && docker compose -f remote-docker-compose.yml up -d --build"
```

## 3. Handle Memory Issues (Optional)
If the build fails with a `SIGKILL` or OOM error during the frontend build:

### a. Add Temporary Swap
// turbo
```bash
sshpass -p "0000" ssh -t -o StrictHostKeyChecking=no deploy@82.112.253.29 "echo '0000' | sudo -S fallocate -l 2G /swapfile_temp && echo '0000' | sudo -S chmod 600 /swapfile_temp && echo '0000' | sudo -S mkswap /swapfile_temp && echo '0000' | sudo -S swapon /swapfile_temp"
```

### b. Retry Deployment
Once swap is added, run the deployment command again (Step 2).

### c. Remove Temporary Swap
// turbo
```bash
sshpass -p "0000" ssh -t -o StrictHostKeyChecking=no deploy@82.112.253.29 "echo '0000' | sudo -S swapoff /swapfile_temp && echo '0000' | sudo -S rm /swapfile_temp"
```

## 4. Forced Refresh (Optional)
If changes are pushed but not live, force a clean rebuild and reload the proxy.

// turbo
```bash
sshpass -p "0000" ssh -o StrictHostKeyChecking=no deploy@82.112.253.29 "cd /home/deploy/laapak-projects/reports && docker compose -f remote-docker-compose.yml build --no-cache laapak-frontend-react && docker compose -f remote-docker-compose.yml up -d && docker exec nginx-proxy nginx -s reload"
```

## 5. Verification
Check the status of the containers and logs.

// turbo
```bash
sshpass -p "0000" ssh -o StrictHostKeyChecking=no deploy@82.112.253.29 "docker ps && docker logs --tail 20 laapak-frontend-react && docker logs --tail 20 report-system"
```
