# Family Expense Tracker Bot 💰

A smart Telegram bot for tracking family expenses using natural language, powered by local LLM (Ollama) and Supabase.

## Features ✨

- 🗣️ **Natural Language Processing** - Just say "Spent 50 at Tesco" or "Add 25 for coffee"
- 🤖 **Local LLM** - Powered by Ollama (Llama 3.2) - completely free and private
- 🔒 **Secure** - Row Level Security (RLS) with authorized user whitelist
- 👨‍👩‍👧‍👦 **Family Sharing** - Multiple family members can track expenses together
- 📊 **Smart Categorization** - Automatic expense categorization
- 📈 **Monthly Summaries** - Track spending by category
- 🐳 **Docker Ready** - Easy deployment with Docker Compose

## Tech Stack

- **Bot**: Node.js with Telegram Bot API
- **Database**: Supabase (PostgreSQL with RLS)
- **LLM**: Ollama (Llama 3.2 - 1.3GB model)
- **Deployment**: Docker & Docker Compose

## Prerequisites

- Docker & Docker Compose installed
- Telegram account
- Supabase account (free tier)

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

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the setup script:

```sql
-- Create authorized users table
CREATE TABLE authorized_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES authorized_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX idx_authorized_users_chat_id ON authorized_users(telegram_chat_id);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role has full access to expenses"
  ON expenses FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to authorized users"
  ON authorized_users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read authorized users for verification"
  ON authorized_users FOR SELECT TO authenticated, anon
  USING (true);
```

3. Get your credentials from **Project Settings → API**:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Service Role Key (keep this secret!)

### 4. Configure Environment Variables

Create `telegram-bot/.env`:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OLLAMA_HOST=http://ollama:11434
```

### 5. Start the Bot

```bash
# Start all services
docker-compose up -d

# Pull the LLM model (first time only, ~1.3GB)
docker exec -it ollama ollama pull llama3.2

# View logs
docker logs -f expense-bot
```

### 6. Get Your Chat IDs

1. Message your bot in Telegram with `/start`
2. The bot will reply with your Chat ID
3. Add authorized users to Supabase:

```sql
INSERT INTO authorized_users (telegram_chat_id, name) VALUES
  (123456789, 'Your Name'),
  (987654321, 'Family Member 1'),
  (555666777, 'Family Member 2');
```

### 7. Start Tracking! 🎉

Message your bot:
- "Spent 50 at Tesco"
- "Add 25 for coffee"
- "Paid 100 for electricity"
- `/recent` - View your expenses
- `/family` - View family expenses
- `/summary` - Monthly summary

## Bot Commands

| Command | Description |
|---------|-------------|
| `/recent` | Your recent expenses |
| `/family` | All family expenses |
| `/summary` | Your monthly summary |
| `/familysummary` | Family monthly summary |
| `/delete` | Delete last expense |
| `/help` | Show help message |

## Free Deployment Options 🆓

### Option 1: Railway.app

1. Create account at [railway.app](https://railway.app)
2. Click **New Project → Deploy from GitHub**
3. Connect your repository
4. Add environment variables
5. Railway will auto-deploy on push

**Cost**: Free tier includes $5/month credit

### Option 2: Render.com

1. Create account at [render.com](https://render.com)
2. Click **New → Docker**
3. Connect GitHub repo
4. Set Docker Compose as build command
5. Add environment variables

**Cost**: Free tier available (with limitations)

### Option 3: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login and launch
fly auth login
fly launch

# Deploy
fly deploy
```

**Cost**: Free allowance includes 3 shared VMs

### Option 4: Your Own VPS

Any VPS with Docker installed:
- DigitalOcean ($4/month)
- Hetzner (€3.79/month)
- Vultr ($2.50/month)

```bash
# On your VPS
git clone https://github.com/yourusername/family-expense-tracker.git
cd family-expense-tracker
docker-compose up -d
docker exec -it ollama ollama pull llama3.2
```

## Project Structure

```
family-expense-tracker/
├── docker-compose.yml
├── telegram-bot/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env (create this)
│   └── src/
│       ├── index.js          # Main bot entry
│       ├── bot.js             # Command handlers
│       ├── llm.js             # LLM integration
│       ├── database.js        # Supabase queries
│       ├── init-ollama.js     # Ollama initialization
│       └── utils.js           # Utility functions
└── README.md
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | `123456:ABCdef...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJhbG...` |
| `OLLAMA_HOST` | Ollama API endpoint | `http://ollama:11434` |

## Security Features 🔒

- ✅ **Row Level Security (RLS)** - Database-level access control
- ✅ **Authorized Users Only** - Whitelist-based access
- ✅ **Service Role Key** - Kept secret in bot environment
- ✅ **Local LLM** - No data sent to external AI services
- ✅ **User Tracking** - Know who added each expense

## Troubleshooting

### Bot not responding
```bash
# Check if containers are running
docker ps

# View bot logs
docker logs expense-bot

# Restart bot
docker-compose restart telegram-bot
```

### Ollama model issues
```bash
# Check if model is downloaded
docker exec -it ollama ollama list

# Re-pull model
docker exec -it ollama ollama pull llama3.2

# Test model directly
docker exec -it ollama ollama run llama3.2 "test"
```

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

## Development

### Local Development

```bash
# Install dependencies
cd telegram-bot
npm install

# Run without Docker (requires Ollama installed locally)
OLLAMA_HOST=http://localhost:11434 npm start
```

### Adding New Features

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Performance

- **Model Size**: 1.3GB (Llama 3.2)
- **RAM Usage**: ~2GB (bot + Ollama)
- **CPU**: Works on basic VPS (1 vCPU)
- **Response Time**: 1-3 seconds per expense

## Upgrading

```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check if model needs updating
docker exec -it ollama ollama list
```

## Roadmap

- [ ] Export expenses to CSV/Excel
- [ ] Budget alerts and notifications
- [ ] Recurring expense tracking
- [ ] Multi-currency support
- [ ] Receipt photo upload with OCR
- [ ] React web dashboard
- [ ] Analytics and charts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/family-expense-tracker/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/family-expense-tracker/discussions)
- 📧 **Email**: your.email@example.com

## Acknowledgments

- [Ollama](https://ollama.ai/) - Local LLM runtime
- [Supabase](https://supabase.com/) - Backend as a Service
- [Telegram Bot API](https://core.telegram.org/bots/api) - Bot platform
- [Llama 3.2](https://ai.meta.com/llama/) - Meta's open-source LLM

---

Made with ❤️ for family expense tracking
