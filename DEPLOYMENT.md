# Deployment Guide 🚀

This guide covers deploying the Family Expense Tracker Bot to various platforms.

## Table of Contents

- [Railway.app (Recommended)](#railwayapp-recommended)
- [Render.com](#rendercom)
- [Fly.io](#flyio)
- [DigitalOcean](#digitalocean)
- [AWS EC2](#aws-ec2)
- [Self-Hosted VPS](#self-hosted-vps)

---

## Railway.app (Recommended)

**Cost**: $5/month free credit, then $5-10/month
**Difficulty**: Easy ⭐

### Steps:

1. **Create Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **New Project**
   - Click **New Project**
   - Select **Deploy from GitHub repo**
   - Connect your forked repository

3. **Configure Environment**
   - Click on your service
   - Go to **Variables** tab
   - Add all variables from `.env.example`:
     ```
     TELEGRAM_BOT_TOKEN=your_token
     SUPABASE_URL=your_url
     SUPABASE_SERVICE_ROLE_KEY=your_key
     OLLAMA_HOST=http://ollama:11434
     ```

4. **Enable Docker Compose**
   - Go to **Settings**
   - Set **Build Command**: `docker-compose -f docker-compose.prod.yml up --build`
   - Set **Start Command**: Leave empty (handled by compose)

5. **Pull Ollama Model**
   - Once deployed, go to **Deployments**
   - Open terminal
   - Run: `docker exec -it ollama ollama pull llama3.2`

6. **Monitor**
   - Check logs in Railway dashboard
   - Bot should be running!

### Railway CLI (Alternative)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

---

## Render.com

**Cost**: Free tier with limitations, $7+/month for better
**Difficulty**: Medium ⭐⭐

### Steps:

1. **Create Account**
   - Sign up at [render.com](https://render.com)

2. **New Web Service**
   - Click **New +** → **Web Service**
   - Connect GitHub repository

3. **Configure Service**
   - **Name**: `family-expense-tracker`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Docker Command**: Leave default

4. **Environment Variables**
   Add in Environment tab:
   ```
   TELEGRAM_BOT_TOKEN=your_token
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   OLLAMA_HOST=http://ollama:11434
   ```

5. **Deploy**
   - Click **Create Web Service**
   - Wait for build to complete

6. **Pull Model**
   - Go to Shell tab
   - Run: `docker exec -it ollama ollama pull llama3.2`

**Note**: Free tier spins down after inactivity. Consider paid plan for 24/7 uptime.

---

## Fly.io

**Cost**: Free allowance (3 VMs), then pay-as-you-go
**Difficulty**: Medium ⭐⭐

### Steps:

1. **Install Flyctl**
   ```bash
   # Linux/Mac
   curl -L https://fly.io/install.sh | sh
   
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Create fly.toml**
   Create `fly.toml` in project root:
   ```toml
   app = "family-expense-tracker"
   primary_region = "lhr"  # London, change as needed
   
   [build]
   
   [env]
     OLLAMA_HOST = "http://localhost:11434"
   
   [[services]]
     internal_port = 11434
     protocol = "tcp"
   
     [[services.ports]]
       port = 11434
   ```

4. **Set Secrets**
   ```bash
   fly secrets set TELEGRAM_BOT_TOKEN=your_token
   fly secrets set SUPABASE_URL=your_url
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
   ```

5. **Deploy**
   ```bash
   fly launch
   fly deploy
   ```

6. **Pull Model**
   ```bash
   fly ssh console
   docker exec -it ollama ollama pull llama3.2
   exit
   ```

7. **Check Status**
   ```bash
   fly status
   fly logs
   ```

---

## DigitalOcean

**Cost**: $4-6/month for basic droplet
**Difficulty**: Medium ⭐⭐

### Steps:

1. **Create Droplet**
   - Go to [DigitalOcean](https://www.digitalocean.com)
   - Create → Droplets
   - **Image**: Docker on Ubuntu
   - **Plan**: Basic ($4/month, 1GB RAM)
   - **Region**: Choose closest
   - Add SSH key

2. **Connect via SSH**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/family-expense-tracker.git
   cd family-expense-tracker
   ```

4. **Configure Environment**
   ```bash
   cd telegram-bot
   cp .env.example .env
   nano .env  # Edit with your values
   cd ..
   ```

5. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   docker exec -it ollama ollama pull llama3.2
   ```

6. **Enable Auto-start**
   ```bash
   # Add to /etc/rc.local or create systemd service
   cat > /etc/systemd/system/expense-bot.service << EOF
   [Unit]
   Description=Family Expense Tracker Bot
   After=docker.service
   Requires=docker.service
   
   [Service]
   Type=oneshot
   RemainAfterExit=yes
   WorkingDirectory=/root/family-expense-tracker
   ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
   ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
   
   [Install]
   WantedBy=multi-user.target
   EOF
   
   systemctl enable expense-bot
   systemctl start expense-bot
   ```

7. **Monitor**
   ```bash
   docker logs -f expense-bot
   ```

---

## AWS EC2

**Cost**: Free tier eligible (t2.micro), then $8+/month
**Difficulty**: Hard ⭐⭐⭐

### Steps:

1. **Launch EC2 Instance**
   - Go to AWS Console → EC2
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.medium (t2.micro might be too small)
   - **Storage**: 20GB
   - Configure security group:
     - Allow SSH (port 22) from your IP
     - Allow port 11434 for Ollama (optional, for debugging)

2. **Connect**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker ubuntu
   exit
   # Reconnect
   ```

4. **Clone and Configure**
   ```bash
   git clone https://github.com/yourusername/family-expense-tracker.git
   cd family-expense-tracker/telegram-bot
   cp .env.example .env
   nano .env  # Add your credentials
   cd ..
   ```

5. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   docker exec -it ollama ollama pull llama3.2
   ```

6. **Set Up Auto-restart**
   ```bash
   sudo crontab -e
   # Add this line:
   @reboot cd /home/ubuntu/family-expense-tracker && docker-compose -f docker-compose.prod.yml up -d
   ```

---

## Self-Hosted VPS

**Cost**: Variable ($2-10/month)
**Difficulty**: Medium ⭐⭐

Works with any VPS provider: Hetzner, Vultr, Linode, OVH, etc.

### Requirements:
- Ubuntu/Debian Linux
- 2GB+ RAM
- 20GB+ storage
- Docker installed

### Quick Setup Script:

```bash
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose

# Clone project
cd ~
git clone https://github.com/yourusername/family-expense-tracker.git
cd family-expense-tracker

# Configure environment
cd telegram-bot
cp .env.example .env
echo "Edit .env file with your credentials"
nano .env
cd ..

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Pull model
sleep 30
docker exec -it ollama ollama pull llama3.2

echo "Bot deployed! Check logs with: docker logs -f expense-bot"
```

---

## Post-Deployment Checklist

After deploying to any platform:

- [ ] Verify bot is running: `docker ps`
- [ ] Check logs: `docker logs expense-bot`
- [ ] Test bot by messaging `/start`
- [ ] Add your Chat ID to Supabase
- [ ] Test expense tracking: "Spent 50 at Tesco"
- [ ] Verify database connection
- [ ] Set up monitoring (optional)
- [ ] Configure backups (recommended)

---

## Monitoring & Maintenance

### Check Bot Status
```bash
docker ps
docker logs -f expense-bot
```

### Restart Bot
```bash
docker-compose restart telegram-bot
```

### Update Bot
```bash
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Backup Ollama Models
```bash
docker cp ollama:/root/.ollama ./ollama_backup
```

### Monitor Resource Usage
```bash
docker stats
```

---

## Troubleshooting

### Bot not responding
```bash
# Check if running
docker ps

# View logs
docker logs --tail 100 expense-bot

# Restart
docker-compose restart telegram-bot
```

### Out of memory
- Upgrade to larger instance (2GB+ RAM recommended)
- Or use smaller model: `llama3.2:1b`

### Ollama errors
```bash
# Check Ollama
docker logs ollama

# Re-pull model
docker exec -it ollama ollama pull llama3.2

# Test directly
docker exec -it ollama ollama run llama3.2 "test"
```

---

## Cost Comparison

| Platform | Free Tier | Paid (Basic) | Best For |
|----------|-----------|--------------|----------|
| Railway | $5 credit/month | $5-10/month | Easy deployment |
| Render | Limited (sleeps) | $7/month | Simple setup |
| Fly.io | 3 VMs free | Pay-as-you-go | Good free tier |
| DigitalOcean | No | $4/month | Full control |
| AWS EC2 | 12 months | $8+/month | AWS ecosystem |
| Hetzner | No | €3.79/month | Best value |

---

## Support

If you encounter issues:

1. Check logs: `docker logs expense-bot`
2. Verify environment variables
3. Test Ollama: `docker exec -it ollama ollama list`
4. Open GitHub issue with logs

---

**Happy Deploying! 🚀**
