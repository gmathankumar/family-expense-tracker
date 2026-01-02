#!/bin/bash

# Family Expense Tracker Bot - Setup Script
# This script helps you set up the bot quickly

set -e

echo "🤖 Family Expense Tracker Bot - Setup Script"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose found!"
echo ""

# Check if .env exists
if [ -f "telegram-bot/.env" ]; then
    echo "⚠️  telegram-bot/.env already exists."
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file."
        ENV_EXISTS=true
    else
        ENV_EXISTS=false
    fi
else
    ENV_EXISTS=false
fi

# Create .env if needed
if [ "$ENV_EXISTS" = false ]; then
    echo ""
    echo "📝 Let's configure your bot..."
    echo ""
    
    # Get Telegram Bot Token
    echo "1️⃣  Telegram Bot Token"
    echo "   Get this from @BotFather on Telegram"
    echo "   Send /newbot to @BotFather and follow instructions"
    read -p "   Enter your bot token: " BOT_TOKEN
    echo ""
    
    # Get Supabase URL
    echo "2️⃣  Supabase URL"
    echo "   Get this from Supabase Dashboard → Project Settings → API"
    echo "   Example: https://xxxxx.supabase.co"
    read -p "   Enter your Supabase URL: " SUPABASE_URL
    echo ""
    
    # Get Supabase Service Role Key
    echo "3️⃣  Supabase Service Role Key"
    echo "   Get this from Supabase Dashboard → Project Settings → API"
    echo "   ⚠️  This is the SERVICE ROLE key, not the anon key!"
    read -p "   Enter your service role key: " SUPABASE_KEY
    echo ""
    
    # Create .env file
    cat > telegram-bot/.env << EOF
TELEGRAM_BOT_TOKEN=${BOT_TOKEN}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
OLLAMA_HOST=http://ollama:11434
EOF
    
    echo "✅ Configuration saved to telegram-bot/.env"
    echo ""
fi

# Ask about deployment mode
echo "🚀 Choose deployment mode:"
echo "   1) Development (docker-compose.yml)"
echo "   2) Production (docker-compose.prod.yml)"
read -p "   Enter choice (1 or 2): " -n 1 -r
echo ""
echo ""

if [[ $REPLY == "2" ]]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "Using production configuration..."
else
    COMPOSE_FILE="docker-compose.yml"
    echo "Using development configuration..."
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose -f $COMPOSE_FILE up -d

echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Check if Ollama is running
if docker ps | grep -q ollama; then
    echo "✅ Ollama container is running"
    
    # Check if model exists
    if docker exec ollama ollama list | grep -q llama3.2; then
        echo "✅ Llama 3.2 model already downloaded"
    else
        echo ""
        echo "📦 Downloading Llama 3.2 model (~1.3GB)..."
        echo "   This will take 5-10 minutes depending on your internet speed..."
        docker exec ollama ollama pull llama3.2
        echo "✅ Model downloaded successfully!"
    fi
else
    echo "❌ Ollama container is not running"
    exit 1
fi

# Check if bot is running
if docker ps | grep -q expense-bot; then
    echo "✅ Bot container is running"
else
    echo "❌ Bot container is not running"
    echo "   Check logs with: docker logs expense-bot"
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""
echo "📱 Next steps:"
echo ""
echo "1. Open Telegram and search for your bot"
echo "2. Send /start to get your Chat ID"
echo "3. Add your Chat ID to Supabase authorized_users table:"
echo ""
echo "   INSERT INTO authorized_users (telegram_chat_id, name) VALUES"
echo "   (YOUR_CHAT_ID, 'Your Name');"
echo ""
echo "4. Test the bot by sending: 'Spent 50 at Tesco'"
echo ""
echo "📊 Useful commands:"
echo "   View logs:        docker logs -f expense-bot"
echo "   Restart bot:      docker-compose -f $COMPOSE_FILE restart telegram-bot"
echo "   Stop all:         docker-compose -f $COMPOSE_FILE down"
echo "   View containers:  docker ps"
echo ""
echo "📚 Documentation:"
echo "   README.md        - Full documentation"
echo "   DEPLOYMENT.md    - Deployment guides"
echo ""
echo "Happy expense tracking! 💰"
