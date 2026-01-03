# Local Development Guide 💻

Run and test the bot on your local machine.

## Prerequisites

- Node.js 18+ installed ([nodejs.org](https://nodejs.org))
- Git installed
- Text editor (VS Code, Sublime, etc.)

## Quick Setup

### 1. Clone Repository

```bash
git clone https://github.com/gmathankumar/family-expense-tracker.git
cd family-expense-tracker
```

### 2. Get API Keys

You need 4 API keys:

#### A. Telegram Bot Token

1. Open Telegram
2. Search for `@BotFather`
3. Send `/newbot`
4. Follow instructions to create bot
5. Copy the token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### B. Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for setup to complete
4. Go to **SQL Editor** and run this:

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

5. Go to **Project Settings → API**
6. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **service_role key** (secret, starts with `eyJ...`)

#### C. OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up (free)
3. Go to [Keys](https://openrouter.ai/keys)
4. Create new key
5. Copy key (starts with `sk-or-v1-...`)

You get **free credits** to start!

### 3. Configure Environment

```bash
cd telegram-bot

# Copy example env file
cp .env.example .env

# Edit .env file
nano .env  # or use your favorite editor
```

Add your keys to `.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENROUTER_API_KEY=sk-or-v1-...
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Bot

```bash
npm start
```

You should see:

```
🤖 Starting Family Expense Tracker Bot...
✅ Environment variables validated
✅ Telegram bot connected
✅ Bot commands registered
🚀 Bot is now running!
```

### 6. Test the Bot

1. Open Telegram
2. Search for your bot name
3. Send `/start`
4. Bot replies with your **Chat ID**
5. Copy your Chat ID

### 7. Add Yourself to Authorized Users

Go to Supabase SQL Editor and run:

```sql
INSERT INTO authorized_users (telegram_chat_id, name) VALUES
(YOUR_CHAT_ID_HERE, 'Your Name');
```

Replace `YOUR_CHAT_ID_HERE` with the number from step 6.

### 8. Start Tracking! 🎉

Message your bot:

- "Spent 50 at Tesco"
- "Add 25 for coffee"
- `/recent`
- `/summary`

## Development Scripts

```bash
# Start bot (production mode)
npm start

# Start with auto-reload on file changes (Node 18+)
npm run dev

# Run tests (if you add any)
npm test

# Lint code (if you add ESLint)
npm run lint
```

## Project Structure

```
telegram-bot/
├── src/
│   ├── index.js          # Main entry point
│   ├── bot.js            # Command handlers
│   ├── llm.js            # OpenRouter LLM integration
│   ├── database.js       # Supabase database queries
│   └── utils.js          # Helper functions
├── package.json          # Dependencies and scripts
├── .env                  # Your secrets (gitignored)
└── .env.example          # Template for .env
```

## Making Changes

### Add a New Command

1. **Update `src/bot.js`** - Add handler function:

```javascript
export async function handleNewCommand(bot, chatId) {
  const user = await isUserAuthorized(chatId);
  if (!user) {
    await bot.sendMessage(chatId, "❌ Unauthorized");
    return;
  }

  // Your logic here
  await bot.sendMessage(chatId, "Command result!");
}
```

2. **Update `src/index.js`** - Register command:

```javascript
bot.onText(/\/newcommand/, async (msg) => {
  await handleNewCommand(bot, msg.chat.id);
});
```

3. **Add to bot menu** - In `bot.setMyCommands()`:

```javascript
{ command: 'newcommand', description: 'What it does' }
```

### Modify LLM Behavior

Edit `src/llm.js` - change the prompt or model:

```javascript
// Change model
const MODEL = "google/gemma-2-9b-it:free"; // Different model

// Change prompt
const prompt = `Your custom prompt here...`;
```

### Add Database Queries

Edit `src/database.js` - add new query functions:

```javascript
export async function getExpensesByCategory(chatId, category) {
  const user = await isUserAuthorized(chatId);
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .eq("category", category);

  if (error) throw error;
  return data;
}
```

## Testing

### Test with Different Inputs

Try various expense formats:

- "Spent 50 at Tesco"
- "Add 25.50 for coffee"
- "Bought lunch 12.99"
- "Paid 100 electricity"
- "uber 15"

### Test Edge Cases

- Very small amounts: "0.01"
- Large amounts: "999.99"
- Different currencies: "£50", "$50"
- No decimals: "50"

### Check Logs

Watch the console output to see:

- Parsed expenses
- API calls
- Errors

## Debugging

### Enable Detailed Logging

Add to your code:

```javascript
console.log("Debug:", variable);
```

### Common Issues

**"Missing environment variables"**

```bash
# Check .env file exists
ls -la telegram-bot/.env

# Check all 4 variables are set
cat telegram-bot/.env
```

**"Unauthorized access"**

```bash
# Check you added your Chat ID to Supabase
# Send /start to get your Chat ID
# Add it to authorized_users table
```

**"OpenRouter API error"**

```bash
# Check API key is valid
# Visit https://openrouter.ai/activity to see usage
# Make sure you have credits
```

**"Bot not responding"**

```bash
# Check bot token is correct
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# Should return your bot info
```

## Hot Reload (Node 18+)

```bash
# Start with watch mode
npm run dev

# Now edit files and bot auto-restarts!
```

## Stopping the Bot

Press `Ctrl+C` in the terminal.

## Resetting Data

To clear all expenses:

```sql
-- In Supabase SQL Editor
DELETE FROM expenses;
```

To reset authorized users:

```sql
DELETE FROM authorized_users;
-- Then re-add yourself
```

## Environment Variables Explained

| Variable                    | Purpose                     | Where to Get                    |
| --------------------------- | --------------------------- | ------------------------------- |
| `TELEGRAM_BOT_TOKEN`        | Authenticates with Telegram | @BotFather on Telegram          |
| `SUPABASE_URL`              | Database connection         | Supabase Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Database access             | Supabase Project Settings → API |
| `OPENROUTER_API_KEY`        | LLM API access              | openrouter.ai/keys              |

## Next Steps

Once everything works locally:

1. Push to GitHub
2. Deploy to Railway (see `RAILWAY_QUICKSTART.md`)
3. Share with family members
4. Add their Chat IDs to authorized_users

## Need Help?

- Check logs for errors
- Read error messages carefully
- Search existing GitHub issues
- Open new issue with:
  - What you tried
  - What happened
  - Error logs (remove sensitive info)

## Tips

- Use `console.log()` liberally during development
- Test one feature at a time
- Keep `.env` file secret (it's gitignored)
- Commit changes frequently
- Write good commit messages

---

**Happy coding!** 🚀
