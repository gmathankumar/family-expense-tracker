# Quick Start Guide ⚡

Get your bot running in 5 minutes!

## 🚀 Fastest Way: Railway (Recommended)

```bash
# 1. Get API Keys

# Telegram: Open Telegram → Message @BotFather → /newbot → Copy token
# Supabase: Go to supabase.com → New Project → Copy URL & Service Role Key
# OpenRouter: Go to openrouter.ai/keys → Create account → Get API key (free credits!)

# 2. Clone repository
git clone https://github.com/gmathankumar/family-expense-tracker.git
cd family-expense-tracker

# 3. Push to your GitHub
git remote set-url origin https://github.com/YOUR_USERNAME/family-expense-tracker.git
git push -u origin main

# 4. Deploy to Railway
# Go to railway.app → New Project → Deploy from GitHub → Select repo

# 5. Add environment variables in Railway dashboard:
TELEGRAM_BOT_TOKEN=paste_your_token_here
SUPABASE_URL=paste_your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=paste_your_key_here
OPENROUTER_API_KEY=paste_your_openrouter_key_here

# 6. Railway auto-deploys! Check logs for "Bot is now running!"

# 7. Set up Supabase database
# In Supabase SQL Editor, run:
# 8. Get your Chat ID
# Message your bot on Telegram: /start
# Bot replies with your Chat ID

# 9. Add yourself to authorized users
# In Supabase SQL Editor:
INSERT INTO authorized_users (telegram_chat_id, name) VALUES
(YOUR_CHAT_ID_HERE, 'Your Name');

 UPDATE authorized_users 
 SET family_id = 'family-id-here', auth_user_id = 'auth-user-id-here'
 WHERE telegram_chat_id = new-member-chat-id;

# ✅ Done! Try: "Spent 50 at Tesco"
```

---

## 🏠 Local Development

```bash
# 1. Clone
git clone https://github.com/gmathankumar/family-expense-tracker.git
cd family-expense-tracker

# 2. Get API keys (Telegram, Supabase, OpenRouter)

# 3. Configure
cd telegram-bot
cp .env.example .env
nano .env  # Add your credentials

# 4. Install dependencies
npm install

# 5. Run locally
npm start

# 6. Test - Message your bot: /start
```

---

## 🐳 Docker Deploy

```bash
# Build
docker build -t expense-tracker-bot .

# Run
docker run -d \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_ROLE_KEY=your_key \
  -e OPENROUTER_API_KEY=your_openrouter_key \
  expense-tracker-bot

# Check logs
docker logs -f <container_id>
```

---

## 📱 Test Commands

Once running, try:

- `/start` - Get your Chat ID
- `Spent 50 at Tesco` - Add expense
- `Add 25 for coffee` - Add expense
- `Paid 100 for electricity` - Add expense
- `/recent` - View recent expenses
- `/summary` - Monthly summary
- `/family` - Family expenses
- `/delete` - Delete last expense

---

## ❓ Troubleshooting

**Bot not responding?**

```bash
# Railway: Check deployment logs in dashboard
# Docker: docker logs <container_id>
```

**"Unauthorized access" error?**

- Make sure you added your Chat ID to Supabase authorized_users table
- Send `/start` to get your Chat ID

**OpenRouter API errors?**

- Check API key is valid at openrouter.ai/keys
- Verify you have credits (free tier gives you credits)

---

## 📚 Full Documentation

- [README.md](README.md) - Complete guide
- [RAILWAY_QUICKSTART.md](RAILWAY_QUICKSTART.md) - Detailed Railway guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - All deployment options

---

**Need help?** Open an issue on GitHub!
