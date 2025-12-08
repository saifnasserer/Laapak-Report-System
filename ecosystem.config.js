/**
 * PM2 Ecosystem Configuration
 * This ensures environment variables are loaded from .env file
 * 
 * Usage: pm2 start ecosystem.config.js
 */

const fs = require('fs');
const path = require('path');

// Load .env file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value.trim();
      }
    });
    return envVars;
  }
  return {};
}

const envVars = loadEnvFile();

module.exports = {
  apps: [{
    name: 'laapak-reports',
    script: 'backend/server.js',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      ...envVars // Merge .env variables
    },
    error_file: './logs/reports-error.log',
    out_file: './logs/reports-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

