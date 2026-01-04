import { config } from "dotenv";

config();

import TelegramBot from "node-telegram-bot-api";
import {
  handleMessage,
  handleRecentTransactions,
  handleDeleteLast,
  handleMonthlySummary,
  handleFamilyExpenses,
  handleFamilyMonthlySummary,
} from "./bot.js";

async function startBot() {
  try {
    // Validate required environment variables
    const requiredEnvVars = [
      "TELEGRAM_BOT_TOKEN",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "OPENROUTER_API_KEY",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    console.log("🤖 Starting Family Expense Tracker Bot...");
    console.log("✅ Environment variables validated");

    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 10;

    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: {
        interval: 1000, // Increased from 300ms to 1s to reduce request frequency
        autoStart: true,
        params: {
          timeout: 30, // Increased from 10 to 30 for better stability
          allowed_updates: ["message"], // Only listen to messages to reduce payload
        },
      },
    });

    console.log("✅ Telegram bot connected");

    // Set bot commands (shows in Telegram menu)
    await bot.setMyCommands([
      { command: "recent", description: "Your recent expenses" },
      { command: "family", description: "All family expenses" },
      { command: "summary", description: "Your monthly summary" },
      { command: "familysummary", description: "Family monthly summary" },
      { command: "delete", description: "Delete last expense" },
      { command: "help", description: "Show help message" },
    ]);

    console.log("✅ Bot commands registered");
    console.log("🚀 Bot is now running!");
    console.log("");

    // Handle /start command
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      console.log(`📱 User ${chatId} started the bot`);

      bot.sendMessage(
        chatId,
        "Welcome to Family Expense Tracker! 💰👨‍👩‍👧‍👦\n\n" +
          "💬 Just tell me your expenses naturally:\n" +
          '• "Spent 50 at Tesco"\n' +
          '• "Add 25 for coffee"\n' +
          '• "Paid 100 for electricity"\n' +
          '• "Bought lunch for 12.50"\n\n' +
          "📱 Or use the menu button (☰) to see all commands!\n\n" +
          `Your Chat ID: ${chatId}\n` +
          "(Add this to your Supabase authorized_users table)"
      );
    });

    // Handle natural language messages (including expenses)
    bot.on("message", async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      // Skip commands
      if (text?.startsWith("/")) return;

      // Process as potential expense or query
      await handleMessage(bot, chatId, text);
    });

    // Handle /recent command
    bot.onText(/\/recent/, async (msg) => {
      await handleRecentTransactions(bot, msg.chat.id);
    });

    // Handle /family command (word boundary to avoid matching /familysummary)
    bot.onText(/\/family(?:\s|$)/, async (msg) => {
      await handleFamilyExpenses(bot, msg.chat.id);
    });

    // Handle /summary command (word boundary to avoid matching /familysummary)
    bot.onText(/\/summary(?:\s|$)/, async (msg) => {
      await handleMonthlySummary(bot, msg.chat.id);
    });

    // Handle /familysummary command
    bot.onText(/\/familysummary/, async (msg) => {
      await handleFamilyMonthlySummary(bot, msg.chat.id);
    });

    // Handle /delete command
    bot.onText(/\/delete/, async (msg) => {
      await handleDeleteLast(bot, msg.chat.id);
    });

    // Handle /help command
    bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(
        chatId,
        "📖 Family Expense Tracker Help\n\n" +
          "💬 Natural Language:\n" +
          "Just type naturally! Examples:\n" +
          '• "Spent 50 at Tesco"\n' +
          '• "Add 25 for uber"\n' +
          '• "Bought coffee 4.50"\n' +
          '• "Paid 100 electricity"\n\n' +
          "📱 Commands:\n" +
          "• /recent - Your recent expenses\n" +
          "• /family - All family expenses\n" +
          "• /summary - Your monthly summary\n" +
          "• /familysummary - Family monthly summary\n" +
          "• /delete - Delete last expense\n" +
          "• /help - Show this message\n\n" +
          "💡 Tip: Use the menu button (☰) for quick access!"
      );
    });

    // Better polling error handling with exponential backoff
    bot.on("polling_error", (error) => {
      console.error("⚠️ Polling error:", error.code, error.message);

      if (
        error.code === "EFATAL" ||
        error.code === "ECONNRESET" ||
        error.code === "ETELEGRAM"
      ) {
        consecutiveErrors++;
        
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error(
            `❌ Too many consecutive errors (${consecutiveErrors}), restarting polling...`
          );
          // Stop and restart polling to reset connection
          bot.stopPolling();
          setTimeout(() => {
            console.log("↻ Restarting polling...");
            bot.startPolling();
          }, 5000); // Wait 5 seconds before restarting
          consecutiveErrors = 0;
        } else {
          console.log(
            `↻ Telegram connection interrupted (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}), retrying...`
          );
        }
      } else {
        console.error("❌ Unexpected polling error:", error);
        consecutiveErrors = 0;
      }
    });

    // Reset error counter on successful message
    bot.on("message", () => {
      if (consecutiveErrors > 0) {
        console.log("✅ Connection restored");
        consecutiveErrors = 0;
      }
    });

    // Handle process errors gracefully
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught exception:", error);
    });

    process.on("unhandledRejection", (error) => {
      console.error("❌ Unhandled rejection:", error);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("📴 Received SIGTERM, shutting down gracefully...");
      bot.stopPolling();
      process.exit(0);
    });

    process.on("SIGINT", () => {
      console.log("📴 Received SIGINT, shutting down gracefully...");
      bot.stopPolling();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

startBot();
