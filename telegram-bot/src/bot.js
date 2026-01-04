import { parseExpenseWithLLM } from './llm.js';
import { 
  insertExpense, 
  getRecentExpenses, 
  isUserAuthorized,
  deleteLastExpense,
  getMonthlySummary,
  getAllFamilyExpenses,
  getFamilyMonthlySummary
} from './database.js';

export async function handleMessage(bot, chatId, text) {
  try {
    // Check authorization first
    const user = await isUserAuthorized(chatId);
    
    if (!user) {
      await bot.sendMessage(
        chatId,
        '❌ Unauthorized access.\n\n' +
        'This bot is for authorized family members only. ' +
        'Please contact the administrator if you should have access.'
      );
      return;
    }

    const processingMsg = await bot.sendMessage(chatId, `⏳ Processing...`);

    // Parse with LLM
    const transactionData = await parseExpenseWithLLM(text);
    
    if (!transactionData) {
      await bot.editMessageText(
        '❌ Could not understand. Try:\n' +
        '"Spent 50 at Tesco" or "Salary 2400"',
        { chat_id: chatId, message_id: processingMsg.message_id }
      );
      return;
    }

    // Insert into database
    await insertExpense(transactionData, chatId);

    // Get emoji based on type
    const typeEmoji = transactionData.transaction_type === 'income' ? '💰' : 
                      transactionData.transaction_type === 'savings' ? '🏦' : '💸';
    
    const typeLabel = transactionData.transaction_type.charAt(0).toUpperCase() + 
                      transactionData.transaction_type.slice(1);

    await bot.editMessageText(
      `✅ ${typeLabel} recorded!\n\n` +
      `${typeEmoji} Amount: £${transactionData.amount.toFixed(2)}\n` +
      `📁 Category: ${transactionData.category}\n` +
      `📝 Description: ${transactionData.description}`,
      { chat_id: chatId, message_id: processingMsg.message_id }
    );
  } catch (error) {
    console.error('Error handling message:', error);
    
    try {
      const errorMsg = error.message === 'User not authorized' 
        ? '❌ You are not authorized.'
        : '❌ Error processing. Please try again.';
      
      await bot.sendMessage(chatId, errorMsg);
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
}

export async function handleRecentTransactions(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);
    
    if (!user) {
      await bot.sendMessage(chatId, '❌ Unauthorized access.');
      return;
    }

    const expenses = await getRecentExpenses(chatId, 10);
    
    if (expenses.length === 0) {
      await bot.sendMessage(chatId, 'No transactions found.');
      return;
    }

    let message = `📊 Recent Transactions:\n\n`;
    let totalExpense = 0;
    let totalIncome = 0;
    let totalSavings = 0;
    
    expenses.forEach((exp, idx) => {
      const date = new Date(exp.created_at).toLocaleDateString();
      const addedBy = exp.authorized_users?.name || 'Unknown';
      const typeEmoji = exp.transaction_type === 'income' ? '💰' : 
                        exp.transaction_type === 'savings' ? '🏦' : '💸';
      
      message += `${idx + 1}. ${typeEmoji} £${parseFloat(exp.amount).toFixed(2)} - ${exp.category}\n`;
      message += `   ${exp.description} • by ${addedBy}\n`;
      message += `   ${date}\n\n`;
      
      // Sum by type
      const amount = parseFloat(exp.amount);
      if (exp.transaction_type === 'expense') totalExpense += amount;
      else if (exp.transaction_type === 'income') totalIncome += amount;
      else if (exp.transaction_type === 'savings') totalSavings += amount;
    });
    
    message += `━━━━━━━━━━━━━━━━\n`;
    if (totalIncome > 0) message += `💰 Income: £${totalIncome.toFixed(2)}\n`;
    if (totalExpense > 0) message += `💸 Expenses: £${totalExpense.toFixed(2)}\n`;
    if (totalSavings > 0) message += `🏦 Savings: £${totalSavings.toFixed(2)}\n`;
    
    const netCashFlow = totalIncome - totalExpense - totalSavings;
    message += `📈 Net: £${netCashFlow.toFixed(2)}`;

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    await bot.sendMessage(chatId, '❌ Error fetching transactions.');
  }
}

export async function handleDeleteLast(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);
    
    if (!user) {
      await bot.sendMessage(chatId, '❌ Unauthorized access.');
      return;
    }

    const deleted = await deleteLastExpense(chatId);
    
    if (!deleted) {
      await bot.sendMessage(chatId, 'No transactions to delete.');
      return;
    }

    const typeEmoji = deleted.transaction_type === 'income' ? '💰' : 
                      deleted.transaction_type === 'savings' ? '🏦' : '💸';

    await bot.sendMessage(
      chatId,
      `✅ Deleted:\n\n` +
      `${typeEmoji} £${parseFloat(deleted.amount).toFixed(2)}\n` +
      `📁 ${deleted.category}\n` +
      `📝 ${deleted.description}`
    );
  } catch (error) {
    console.error('Error deleting:', error);
    await bot.sendMessage(chatId, '❌ Error deleting.');
  }
}

export async function handleMonthlySummary(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);
    
    if (!user) {
      await bot.sendMessage(chatId, '❌ Unauthorized access.');
      return;
    }

    const now = new Date();
    const summary = await getMonthlySummary(chatId, now.getFullYear(), now.getMonth() + 1);
    
    if (Object.keys(summary).length === 0) {
      await bot.sendMessage(chatId, 'No transactions this month.');
      return;
    }

    let message = `📊 Monthly Summary (${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}):\n\n`;
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
    console.error('Error getting summary:', error);
    await bot.sendMessage(chatId, '❌ Error getting summary.');
  }
}

export async function handleFamilyExpenses(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);
    
    if (!user) {
      await bot.sendMessage(chatId, '❌ Unauthorized access.');
      return;
    }

    const expenses = await getAllFamilyExpenses(chatId, 15);
    
    if (expenses.length === 0) {
      await bot.sendMessage(chatId, 'No family transactions found.');
      return;
    }

    let message = `👨‍👩‍👧‍👦 Recent Family Transactions:\n\n`;
    
    expenses.forEach((exp, idx) => {
      const date = new Date(exp.created_at).toLocaleDateString();
      const userName = exp.authorized_users?.name || 'Unknown';
      const typeEmoji = exp.transaction_type === 'income' ? '💰' : 
                        exp.transaction_type === 'savings' ? '🏦' : '💸';
      
      message += `${idx + 1}. ${typeEmoji} £${parseFloat(exp.amount).toFixed(2)} - ${exp.category}\n`;
      message += `   ${exp.description}\n`;
      message += `   by ${userName} (${date})\n\n`;
    });

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error fetching family transactions:', error);
    await bot.sendMessage(chatId, '❌ Error fetching family transactions.');
  }
}

export async function handleFamilyMonthlySummary(bot, chatId) {
  try {
    const user = await isUserAuthorized(chatId);
    
    if (!user) {
      await bot.sendMessage(chatId, '❌ Unauthorized access.');
      return;
    }

    const now = new Date();
    const summary = await getFamilyMonthlySummary(chatId, now.getFullYear(), now.getMonth() + 1);
    
    if (Object.keys(summary).length === 0) {
      await bot.sendMessage(chatId, 'No family transactions this month.');
      return;
    }

    let message = `👨‍👩‍👧‍👦 Family Monthly Summary (${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}):\n\n`;
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
    console.error('Error getting family summary:', error);
    await bot.sendMessage(chatId, '❌ Error getting summary.');
  }
}