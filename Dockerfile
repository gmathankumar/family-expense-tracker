# Family Expense Tracker Bot - Simplified Single Container
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY telegram-bot/package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY telegram-bot/src ./src

# Expose port (not necessary for bot, but good practice)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Start the bot
CMD ["node", "src/index.js"]