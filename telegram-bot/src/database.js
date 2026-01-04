import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables FIRST
config();

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('Missing required environment variable: SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// Use service role key for the bot
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get user by chat ID (no caching needed - single query is fast)
export async function isUserAuthorized(chatId) {
  try {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('telegram_chat_id', chatId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user not authorized
        console.log(`❌ Unauthorized access attempt from chat ID: ${chatId}`);
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error checking authorization:', error);
    return null;
  }
}

// Insert transaction (expense, income, or savings)
export async function insertExpense(expenseData, chatId) {
  const user = await isUserAuthorized(chatId);
  
  if (!user) {
    throw new Error('User not authorized');
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      transaction_type: expenseData.transaction_type || 'expense', // Default to expense for backwards compatibility
      amount: expenseData.amount,
      category: expenseData.category,
      description: expenseData.description,
      created_at: expenseData.created_at,
      user_id: user.id,        // Who added it
      family_id: user.family_id // Which family it belongs to
    }])
    .select();

  if (error) throw error;
  
  const transactionTypeLabel = expenseData.transaction_type || 'expense';
  console.log(`✅ ${transactionTypeLabel.charAt(0).toUpperCase() + transactionTypeLabel.slice(1)} added by ${user.name} (chat: ${chatId})`);
  return data[0];
}

// Get recent expenses (user-specific)
export async function getRecentExpenses(chatId, limit = 10) {
  const user = await isUserAuthorized(chatId);
  
  if (!user) {
    throw new Error('User not authorized');
  }

  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      authorized_users!expenses_user_id_fkey (name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get all family expenses (family-based)
export async function getAllFamilyExpenses(chatId, limit = 20) {
  const user = await isUserAuthorized(chatId);
  
  if (!user) {
    throw new Error('User not authorized');
  }

  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      authorized_users!expenses_user_id_fkey (name)
    `)
    .eq('family_id', user.family_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Delete last expense (by current user)
export async function deleteLastExpense(chatId) {
  const user = await isUserAuthorized(chatId);
  
  if (!user) {
    throw new Error('User not authorized');
  }

  // Get last expense added by this user
  const { data: lastExpense, error: fetchError } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .eq('family_id', user.family_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return null; // No expenses found
    }
    throw fetchError;
  }

  // Delete it
  const { error: deleteError } = await supabase
    .from('expenses')
    .delete()
    .eq('id', lastExpense.id);

  if (deleteError) throw deleteError;
  
  console.log(`✅ Expense deleted by ${user.name} (chat: ${chatId})`);
  return lastExpense;
}

// Get monthly summary (user-specific)
export async function getMonthlySummary(chatId, year, month) {
  const user = await isUserAuthorized(chatId);
  
  if (!user) {
    throw new Error('User not authorized');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount')
    .eq('user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) throw error;

  // Group by category and sum
  const summary = data.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += parseFloat(expense.amount);
    return acc;
  }, {});

  return summary;
}

// Get family monthly summary (family-based)
export async function getFamilyMonthlySummary(chatId, year, month) {
  const user = await isUserAuthorized(chatId);
  
  if (!user) {
    throw new Error('User not authorized');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount')
    .eq('family_id', user.family_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) throw error;

  // Group by category and sum
  const summary = data.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += parseFloat(expense.amount);
    return acc;
  }, {});

  return summary;
}