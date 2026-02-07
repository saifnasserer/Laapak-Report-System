---
description: Deploying Laapak Reports System to remote VPS
---

# Deployment Workflow

The preferred method for deployment is **GitHub Actions**. This automatically builds and deploys your code when you push to the `main` branch.

## 1. Automated Deployment (Preferred)
Just push your changes to GitHub:

```bash
git add .
git commit -m "feat: your descriptive message"
git push origin main
```

**What happens:**
1. GitHub builds the Docker images (solving memory issues).
2. GitHub pushes images to Docker Hub.
3. GitHub SSHes into the VPS, pulls the images, and restarts containers.
4. Nginx proxy is reloaded automatically.

## 2. Remote Manual Deployment (Fallback)
If GitHub Actions is failing, you can still manually trigger a build on the VPS.

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
