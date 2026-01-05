# Family Expense Tracker Bot 💰

A smart Telegram bot for tracking family expenses using natural language, powered by local LLM (Ollama) and Supabase.

## Features ✨

- 🗣️ **Natural Language Processing** - Just say "Spent 50 at Tesco" or "Add 25 for coffee"
- 🤖 **Powered by OpenRouter** - Free LLM API (Llama 3.2, Gemma 2, and more)
- 🔒 **Secure** - Row Level Security (RLS) with authorized user whitelist
- 👨‍👩‍👧‍👦 **Family Sharing** - Multiple family members can track expenses together
- 📊 **Smart Categorization** - Automatic expense categorization
- 📈 **Monthly Summaries** - Track spending by category
- 🐳 **Single Container** - Easy deployment anywhere (Railway, Render, Fly.io)
- 🆓 **Completely Free** - No infrastructure costs with free tiers

## Tech Stack

- **Bot**: Node.js with Telegram Bot API
- **Database**: Supabase (PostgreSQL with RLS)
- **LLM**: OpenRouter API (free tier with multiple models)
- **Deployment**: Docker (single container - deploy anywhere!)

## Prerequisites

- Telegram account
- Supabase account (free tier)
- OpenRouter account (free tier with credits)

## Quick Start 🚀

### 1. Clone the Repository

```bash
git clone https://github.com/gmathankumar/family-expense-tracker.git
cd family-expense-tracker
```

### 2. Set Up Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Copy the **Bot Token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 3. Set Up OpenRouter

1. Create account at [openrouter.ai](https://openrouter.ai)
2. Go to **Keys** and create a new API key
3. You get free credits to start! Models like `meta-llama/llama-3.2-3b-instruct:free` are completely free

### 4. Configure Environment Variables

Create `telegram-bot/.env`:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 5. Deploy to Railway (Recommended) 🚂

**The easiest way:**

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) and sign in
3. **New Project** → **Deploy from GitHub repo**
4. Select your repository
5. Add environment variables:
   ```
   TELEGRAM_BOT_TOKEN=your_token
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   OPENROUTER_API_KEY=your_key
   ```
6. Deploy! Railway will automatically build and start your bot

**That's it!** Your bot is now live 🎉

### 6. Alternative: Local Development with Docker

```bash
# Build and run
docker build -t expense-tracker-bot .
docker run -d --env-file telegram-bot/.env expense-tracker-bot

# Or run locally without Docker
cd telegram-bot
npm install
npm start
```

**For detailed local development, see [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)**

### 7. Get Your Chat IDs

1. Message your bot in Telegram with `/start`
2. The bot will reply with your Chat ID
3. Add authorized users to Supabase:

```sql
INSERT INTO authorized_users (telegram_chat_id, name) VALUES
  (123456789, 'Your Name'),
  (987654321, 'Family Member 1'),
  (555666777, 'Family Member 2');
```

### 8. Start Tracking! 🎉

Message your bot:

- "Spent 50 at Tesco"
- "Add 25 for coffee"
- "Paid 100 for electricity"
- `/recent` - View your expenses
- `/family` - View family expenses
- `/summary` - Monthly summary

## Test models
```
cd c:\gnanasm\Misc\JS\family-expense-tracker\telegram-bot
node src/test-llm.js "Received salary £3900"
```

## Bot Commands

| Command          | Description            |
| ---------------- | ---------------------- |
| `/recent`        | Your recent expenses   |
| `/family`        | All family expenses    |
| `/summary`       | Your monthly summary   |
| `/familysummary` | Family monthly summary |
| `/delete`        | Delete last expense    |
| `/help`          | Show help message      |

## Free Deployment Options 🆓

### ⭐ Railway.app (Recommended - Easiest!)

**Perfect for single-container apps like this!**

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. **New Project** → **Deploy from GitHub**
4. Add environment variables
5. Done! Auto-deploys on every push

**Cost**: $5/month free credit (plenty for this bot)


### Your Own VPS

```bash
git clone https://github.com/yourusername/family-expense-tracker.git
cd family-expense-tracker
docker build -t expense-bot .
docker run -d --env-file telegram-bot/.env expense-bot
```

**Cost**: $3-5/month (Hetzner, DigitalOcean, Vultr)

## Project Structure

```
family-expense-tracker/
├── Dockerfile                 # Single container build
├── railway.toml              # Railway configuration
├── telegram-bot/
│   ├── package.json
│   ├── .env (create this)
│   └── src/
│       ├── index.js          # Main bot entry
│       ├── bot.js            # Command handlers
│       ├── llm.js            # OpenRouter integration
│       ├── database.js       # Supabase queries
│       └── utils.js          # Utility functions
└── README.md
```

## Environment Variables

| Variable                    | Description              | Example                   |
| --------------------------- | ------------------------ | ------------------------- |
| `TELEGRAM_BOT_TOKEN`        | Bot token from BotFather | `123456:ABCdef...`        |
| `SUPABASE_URL`              | Supabase project URL     | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key         | `eyJhbG...`               |
| `OPENROUTER_API_KEY`        | OpenRouter API key       | `sk-or-v1-...`            |

## Security Features 🔒

- ✅ **Row Level Security (RLS)** - Database-level access control
- ✅ **Authorized Users Only** - Whitelist-based access
- ✅ **Service Role Key** - Kept secret in bot environment
- ✅ **Local LLM** - No data sent to external AI services
- ✅ **User Tracking** - Know who added each expense

## Troubleshooting

### Bot not responding

```bash
# Check logs on Railway
# Go to your project → Deployments → View Logs

# Or locally with Docker
docker logs expense-tracker-bot
```

### OpenRouter API errors

- Check your API key is valid
- Verify you have credits remaining (free tier gives you credits)
- Check rate limits

### Database connection issues

```bash
# Test Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Check RLS policies in Supabase dashboard
```

### Unauthorized access errors

```bash
# Verify your chat ID is in authorized_users table
# Message the bot with /start to see your Chat ID
# Add it to Supabase using SQL Editor
```

## Roadmap

- [ ] Export expenses to CSV/Excel
- [ ] Budget alerts and notifications
- [ ] Recurring expense tracking
- [ ] Multi-currency support
- [ ] Receipt photo upload with OCR
- [ ] React web dashboard
- [ ] Analytics and charts

---

Made with ❤️ for family expense tracking
