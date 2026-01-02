import TelegramBot from "node-telegram-bot-api";
import { config } from "dotenv";
import {
  handleMessage,
  handleRecentTransactions,
  handleDeleteLast,
  handleMonthlySummary,
  handleFamilyExpenses,
  handleFamilyMonthlySummary,
} from "./bot.js";
import { initOllama } from "./init-ollama.js";

config();

async function startBot() {
  try {
    console.log("Initializing Ollama...");
    await initOllama();

    console.log("Starting Telegram bot...");
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10,
        },
      },
    });

    console.log("Bot started successfully! ✅");

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

    // Handle /start command
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      console.log(`User ${chatId} started the bot`);

      bot.sendMessage(
        chatId,
        "Welcome to Family Expense Tracker! 💰👨‍👩‍👧‍👦\n\n" +
          "💬 Just tell me your expenses naturally:\n" +
          '• "Spent 50 at Tesco"\n' +
          '• "Add 25 for coffee"\n' +
          '• "Paid 100 for electricity"\n' +
          '• "Bought lunch for 12.50"\n\n' +
          "📱 Or use the menu button to see all commands!\n\n" +
          `Your Chat ID: ${chatId}`
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

    // Handle /family command
    bot.onText(/\/family/, async (msg) => {
      await handleFamilyExpenses(bot, msg.chat.id);
    });

    // Handle /summary command
    bot.onText(/\/summary/, async (msg) => {
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

    bot.on("polling_error", (error) => {
      console.error("Polling error:", error.code);

      if (
        error.code === "EFATAL" ||
        error.code === "ECONNRESET" ||
        error.code === "ETELEGRAM"
      ) {
        console.log("Telegram connection interrupted, will auto-retry...");
      } else {
        console.error("Unexpected polling error:", error);
      }
    });

    process.on("uncaughtException", (error) => {
      console.error("Uncaught exception:", error);
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled rejection:", error);
    });
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

startBot();
