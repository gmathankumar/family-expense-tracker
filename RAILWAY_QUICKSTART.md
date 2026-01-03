# Deploy to Railway in 5 Minutes 🚂

The absolute easiest way to deploy your bot!

## Prerequisites

- GitHub account
- Railway account (free, sign up at [railway.app](https://railway.app))
- Telegram bot token (from @BotFather)
- Supabase project (free tier)
- OpenRouter API key (free credits at [openrouter.ai](https://openrouter.ai))

## Step-by-Step Deployment

### 1. Push Code to GitHub

```bash
# If you haven't already
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/family-expense-tracker.git
git push -u origin main
```

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **Login** (sign in with GitHub)
3. Click **New Project**
4. Select **Deploy from GitHub repo**
5. Choose your `family-expense-tracker` repository
6. Railway will automatically detect the Dockerfile and start building!

### 3. Add Environment Variables

1. Click on your deployed service
2. Go to the **Variables** tab
3. Click **New Variable** and add each of these:

```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...your_key_here
OPENROUTER_API_KEY=sk-or-v1-...your_key_here
```

4. Railway will automatically redeploy with the new variables

### 4. Check Deployment Status

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **View Logs**
4. You should see:
   ```
   ✅ Environment variables validated
   ✅ Telegram bot connected
   ✅ Bot commands registered
   🚀 Bot is now running!
   ```

### 5. Test Your Bot

1. Open Telegram
2. Search for your bot (the name you gave @BotFather)
3. Send `/start`
4. Bot should reply with your Chat ID!

### 6. Add Yourself to Authorized Users

1. Go to your Supabase project
2. Open **SQL Editor**
3. Run this (replace with your actual Chat ID from step 5):

```sql
INSERT INTO authorized_users (telegram_chat_id, name) VALUES
(YOUR_CHAT_ID_HERE, 'Your Name');
```

### 7. Start Tracking Expenses! 🎉

Send to your bot:

- "Spent 50 at Tesco"
- "Add 25 for coffee"
- `/recent` to see your expenses

## Railway Features

### Auto-Deploy on Push

Every time you push to GitHub, Railway automatically rebuilds and redeploys!

```bash
# Make changes locally
git add .
git commit -m "Added new feature"
git push

# Railway automatically deploys! 🚀
```

### View Logs

Go to **Deployments** → **View Logs** to see what's happening in real-time.

### Monitor Usage

Go to **Metrics** tab to see:

- CPU usage
- Memory usage
- Network traffic

### Custom Domain (Optional)

1. Go to **Settings** tab
2. Click **Generate Domain** for a free Railway domain
3. Or add your own custom domain

## Troubleshooting

### "Build failed"

Check **Deployment Logs**. Common issues:

- Missing `Dockerfile` in root
- Syntax errors in code

### "Bot not responding"

1. Check **Logs** for errors
2. Verify all environment variables are set correctly
3. Test Telegram bot token with:
   ```bash
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
   ```

### "Unauthorized access"

- Make sure you added your Chat ID to Supabase `authorized_users` table
- Send `/start` to get your Chat ID

### "OpenRouter API error"

- Verify API key is correct
- Check you have credits remaining (free tier gives you credits)
- Visit [openrouter.ai/activity](https://openrouter.ai/activity) to see usage

## Cost

Railway's free tier includes:

- **$5 of usage per month** (plenty for this bot)
- **500 GB bandwidth**
- **Automatic scaling**

This bot uses minimal resources (~$1-2/month), so the free tier is more than enough!

## Next Steps

- Invite family members to the bot
- Add their Chat IDs to Supabase
- Start tracking expenses together!
- Check out `/familysummary` for combined spending

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: Great community support
- GitHub Issues: For bot-specific questions

---

**That's it! Your bot is live on Railway!** 🎉🚂
