# BizzAI Deployment Guide

This guide provides step-by-step instructions for deploying BizzAI to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Docker Deployment](#docker-deployment-recommended)
- [Manual Deployment](#manual-deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Health Checks](#health-checks)
- [Monitoring](#monitoring)
- [Backup Strategy](#backup-strategy)
- [Rollback Procedure](#rollback-procedure)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **OS:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+ / Windows Server 2019+
- **CPU:** 2+ cores recommended
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 20GB minimum, SSD recommended
- **Network:** Static IP or domain name

### Software Requirements

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **MongoDB:** v6.0 or higher
- **Docker:** v20.10+ (for Docker deployment)
- **Docker Compose:** v2.0+ (for Docker deployment)
- **Nginx:** v1.18+ (for reverse proxy)
- **Git:** v2.30+

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests passing (`npm test` in both backend and frontend)
- [ ] Security scan passed (`npm audit` shows no critical vulnerabilities)
- [ ] Environment variables configured (`.env` files created from `.env.example`)
- [ ] Database backup strategy implemented
- [ ] SSL/TLS certificates obtained
- [ ] Domain name configured (DNS A record pointing to server)
- [ ] Firewall rules configured
- [ ] Monitoring and logging configured
- [ ] Rollback plan documented
- [ ] Team notified of deployment

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/orion-ai-community/BizzAI.git
cd BizzAI
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
nano .env  # Edit with your production values
```

**Critical Variables to Change:**

```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db:27017/bizzai
JWT_SECRET=<generate-strong-secret-min-32-chars>
JWT_REFRESH_SECRET=<generate-strong-secret-min-32-chars>
SESSION_SECRET=<generate-strong-secret-min-32-chars>
EMAIL_USER=your-production-email@domain.com
EMAIL_PASSWORD=your-app-password
CORS_ORIGIN=https://yourdomain.com
SENTRY_DSN=your-sentry-dsn
```

**Generate Strong Secrets:**

```bash
# Run the secrets generation script
npm run secrets:generate

# Or manually generate:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configure Frontend Environment

```bash
cd ../frontend
cp .env.example .env
nano .env
```

```env
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_SENTRY_DSN=your-sentry-dsn
VITE_SENTRY_ENVIRONMENT=production
```

---

## Database Setup

### Option 1: MongoDB Atlas (Recommended for Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Whitelist your server IP
4. Get connection string
5. Update `MONGODB_URI` in backend `.env`

### Option 2: Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh
> use bizzai
> db.createUser({
    user: "bizzai_user",
    pwd: "strong-password-here",
    roles: [{ role: "readWrite", db: "bizzai" }]
  })
```

### Create Database Indexes

```bash
cd backend
npm run indexes:create
```

---

## Docker Deployment (Recommended)

### 1. Build and Start Containers

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 2. Verify Deployment

```bash
# Run verification script
./scripts/verify-deployment.sh

# Or manually check
curl http://localhost:5000/api/health
curl http://localhost:80
```

### 3. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/bizzai`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/bizzai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Manual Deployment

### 1. Install Dependencies

```bash
# Backend
cd backend
npm ci --production

# Frontend
cd ../frontend
npm ci
```

### 2. Build Frontend

```bash
cd frontend
npm run build
```

### 3. Start Backend with PM2

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name bizzai-backend

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Serve Frontend with Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/BizzAI/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        # ... proxy headers
    }
}
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## Health Checks

### Endpoints

- **Basic Health:** `GET /api/health`
- **Readiness:** `GET /api/health/ready` (checks DB connection)
- **Liveness:** `GET /api/health/live` (checks app status)

### Automated Monitoring

```bash
# Add to crontab
*/5 * * * * curl -f http://localhost:5000/api/health || systemctl restart bizzai-backend
```

---

## Monitoring

### 1. Sentry Setup

1. Create account at [Sentry.io](https://sentry.io)
2. Create new project
3. Get DSN
4. Update `.env` files with `SENTRY_DSN`

### 2. Log Monitoring

```bash
# View backend logs
pm2 logs bizzai-backend

# Or with Docker
docker-compose logs -f backend

# Log files location
tail -f backend/logs/app.log
```

### 3. Performance Monitoring

```bash
# Monitor with PM2
pm2 monit

# Or use htop
htop
```

---

## Backup Strategy

### Automated Daily Backups

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * /path/to/BizzAI/scripts/backup-mongodb.sh

# Backup retention: 7 days
# Location: /backups/mongodb/
```

### Manual Backup

```bash
cd scripts
./backup-mongodb.sh
```

### Restore from Backup

```bash
cd scripts
./restore-mongodb.sh /path/to/backup/file.gz
```

---

## Rollback Procedure

### Docker Deployment

```bash
# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout v1.0.0

# Rebuild and start
docker-compose -f docker-compose.prod.yml up -d --build
```

### Manual Deployment

```bash
# Stop backend
pm2 stop bizzai-backend

# Checkout previous version
git checkout v1.0.0

# Reinstall dependencies
cd backend && npm ci --production
cd ../frontend && npm ci && npm run build

# Restart backend
pm2 restart bizzai-backend
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
pm2 logs bizzai-backend --lines 100

# Check environment variables
cat backend/.env

# Check MongoDB connection
mongosh $MONGODB_URI

# Check port availability
sudo lsof -i :5000
```

### Frontend Build Fails

```bash
# Clear cache
rm -rf frontend/node_modules frontend/dist
cd frontend && npm ci && npm run build

# Check environment variables
cat frontend/.env
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongosh $MONGODB_URI

# Check firewall
sudo ufw status
sudo ufw allow 27017/tcp  # If self-hosted

# Check MongoDB status
sudo systemctl status mongod
```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates

# Test SSL configuration
sudo nginx -t
```

---

## Post-Deployment Verification

Run the comprehensive verification script:

```bash
./scripts/verify-production.sh
```

This checks:
- ✅ Backend health endpoints
- ✅ Frontend accessibility
- ✅ Database connectivity
- ✅ SSL certificate validity
- ✅ Security headers
- ✅ API response times

---

## Support

For deployment issues:

- **Email:** shingadekartik1@gmail.com
- **GitHub Issues:** [BizzAI Issues](https://github.com/orion-ai-community/BizzAI/issues)
- **Documentation:** [README.md](README.md)

---

## Security Reminders

- ✅ Change all default secrets
- ✅ Use strong passwords (32+ characters)
- ✅ Enable firewall
- ✅ Keep system updated
- ✅ Regular backups
- ✅ Monitor logs
- ✅ Use HTTPS only
- ✅ Implement rate limiting (already configured)

---

**Last Updated:** January 18, 2026  
**Version:** 2.0.0
