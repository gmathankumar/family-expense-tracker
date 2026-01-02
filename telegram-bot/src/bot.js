import { parseExpenseWithLLM, isExpenseMessage } from "./llm.js";
import {
  insertExpense,
  getRecentExpenses,
  isUserAuthorized,
  deleteLastExpense,
  getMonthlySummary,
  getAllFamilyExpenses,
  getFamilyMonthlySummary,
} from "./database.js";

export async function handleMessage(bot, chatId, text) {
  try {
    // Check authorization first
    const user = await isUserAuthorized(chatId);

    if (!user) {
      await bot.sendMessage(
        chatId,
        "❌ Unauthorized access.\n\n" +
          "This bot is for authorized family members only. " +
          "Please contact the administrator if you should have access."
      );
      return;
    }

    // Check if this is an expense message
    const isExpense = await isExpenseMessage(text);

    if (!isExpense) {
      // Not an expense, respond naturally
      await bot.sendMessage(
        chatId,
        "I'm here to help track expenses! 💰\n\n" +
          "Try saying something like:\n" +
          '• "Spent 50 at Tesco"\n' +
          '• "Add 25 for coffee"\n' +
          '• "Paid 100 for electricity"\n\n' +
          "Or use /help to see all commands."
      );
      return;
    }

    // It's an expense, process it
    const processingMsg = await bot.sendMessage(
      chatId,
      `⏳ Processing your expense, ${user.name}...`
    );

    // Parse with LLM
    const expenseData = await parseExpenseWithLLM(text);

    if (!expenseData) {
      await bot.editMessageText(
        "❌ Could not understand the expense. Try:\n" +
          '"Spent 50 at Tesco" or "Add 25 for coffee"',
        { chat_id: chatId, message_id: processingMsg.message_id }
      );
      return;
    }

    // Insert into database
    await insertExpense(expenseData, chatId);

    await bot.editMessageText(
      `✅ Expense added!\n\n` +
        `💰 Amount: £${expenseData.amount}\n` +
        `📁 Category: ${expenseData.category}\n` +
        `📝 Description: ${expenseData.description}`,
      { chat_id: chatId, message_id: processingMsg.message_id }
    );
  } catch (error) {
    console.error("Error handling message:", error);

    try {
      const errorMsg =
        error.message === "User not authorized"
          ? "❌ You are not authorized to add expenses."
          : "❌ Error processing message. Please try again.";

      await bot.sendMessage(chatId, errorMsg);
    } catch (sendError) {
      console.error("Error sending error message:", sendError);
    }
  }
}

// Keep all other functions the same...
export async function handleRecentTransactions(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);

    if (!user) {
      await bot.sendMessage(chatId, "❌ Unauthorized access.");
      return;
    }

    const expenses = await getRecentExpenses(chatId, 10);

    if (expenses.length === 0) {
      await bot.sendMessage(chatId, "No transactions found.");
      return;
    }

    let message = `📊 Your Recent Transactions:\n\n`;
    let total = 0;

    expenses.forEach((exp, idx) => {
      const date = new Date(exp.created_at).toLocaleDateString();
      message += `${idx + 1}. £${exp.amount} - ${exp.category}\n   ${
        exp.description
      } (${date})\n\n`;
      total += parseFloat(exp.amount);
    });

    message += `💰 Total: £${total.toFixed(2)}`;

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    await bot.sendMessage(chatId, "❌ Error fetching transactions.");
  }
}

export async function handleDeleteLast(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);

    if (!user) {
      await bot.sendMessage(chatId, "❌ Unauthorized access.");
      return;
    }

    const deleted = await deleteLastExpense(chatId);

    if (!deleted) {
      await bot.sendMessage(chatId, "No expenses to delete.");
      return;
    }

    await bot.sendMessage(
      chatId,
      `✅ Deleted last expense:\n\n` +
        `💰 Amount: £${deleted.amount}\n` +
        `📁 Category: ${deleted.category}\n` +
        `📝 Description: ${deleted.description}`
    );
  } catch (error) {
    console.error("Error deleting expense:", error);
    await bot.sendMessage(chatId, "❌ Error deleting expense.");
  }
}

export async function handleMonthlySummary(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);

    if (!user) {
      await bot.sendMessage(chatId, "❌ Unauthorized access.");
      return;
    }

    const now = new Date();
    const summary = await getMonthlySummary(
      chatId,
      now.getFullYear(),
      now.getMonth() + 1
    );

    if (Object.keys(summary).length === 0) {
      await bot.sendMessage(chatId, "No expenses this month.");
      return;
    }

    let message = `📊 Your Monthly Summary (${now.toLocaleString("default", {
      month: "long",
    })} ${now.getFullYear()}):\n\n`;
    let total = 0;

    Object.entries(summary)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, amount]) => {
        message += `${category}: £${amount.toFixed(2)}\n`;
        total += amount;
      });

    message += `\n💰 Total: £${total.toFixed(2)}`;

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error getting monthly summary:", error);
    await bot.sendMessage(chatId, "❌ Error getting summary.");
  }
}

export async function handleFamilyExpenses(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);

    if (!user) {
      await bot.sendMessage(chatId, "❌ Unauthorized access.");
      return;
    }

    const expenses = await getAllFamilyExpenses(chatId, 15);

    if (expenses.length === 0) {
      await bot.sendMessage(chatId, "No family expenses found.");
      return;
    }

    let message = `👨‍👩‍👧‍👦 Recent Family Expenses:\n\n`;

    expenses.forEach((exp, idx) => {
      const date = new Date(exp.created_at).toLocaleDateString();
      const userName = exp.authorized_users?.name || "Unknown";
      message += `${idx + 1}. £${exp.amount} - ${exp.category}\n   ${
        exp.description
      }\n   by ${userName} (${date})\n\n`;
    });

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error fetching family expenses:", error);
    await bot.sendMessage(chatId, "❌ Error fetching family expenses.");
  }
}

export async function handleFamilyMonthlySummary(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);

    if (!user) {
      await bot.sendMessage(chatId, "❌ Unauthorized access.");
      return;
    }

    const now = new Date();
    const summary = await getFamilyMonthlySummary(
      chatId,
      now.getFullYear(),
      now.getMonth() + 1
    );

    if (Object.keys(summary).length === 0) {
      await bot.sendMessage(chatId, "No family expenses this month.");
      return;
    }

    let message = `👨‍👩‍👧‍👦 Family Monthly Summary (${now.toLocaleString("default", {
      month: "long",
    })} ${now.getFullYear()}):\n\n`;
    let total = 0;

    Object.entries(summary)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, amount]) => {
        message += `${category}: £${amount.toFixed(2)}\n`;
        total += amount;
      });

    message += `\n💰 Total: £${total.toFixed(2)}`;

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Error getting family monthly summary:", error);
    await bot.sendMessage(chatId, "❌ Error getting summary.");
  }
}
