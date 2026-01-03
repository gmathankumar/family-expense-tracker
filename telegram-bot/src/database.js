import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables FIRST
config();

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error("Missing required environment variable: SUPABASE_URL");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Use service role key for the bot
// This is safe because:
// 1. Key is only in bot environment (not exposed to users)
// 2. Bot validates chat IDs before any DB operation
// 3. Bot is the only service with this key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cache for authorized users (reduce DB calls)
const authorizedUsersCache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function refreshAuthorizedUsers() {
  const now = Date.now();

  // Refresh cache if expired
  if (now - cacheTimestamp > CACHE_TTL) {
    try {
      const { data, error } = await supabase
        .from("authorized_users")
        .select("*");

      if (error) throw error;

      authorizedUsersCache.clear();
      data.forEach((user) => {
        authorizedUsersCache.set(user.telegram_chat_id, user);
      });

      cacheTimestamp = now;
      console.log(`✅ Refreshed ${data.length} authorized users`);
    } catch (error) {
      console.error("Error refreshing authorized users:", error);
    }
  }
}

// Check if user is authorized
export async function isUserAuthorized(chatId) {
  await refreshAuthorizedUsers();

  const user = authorizedUsersCache.get(chatId);

  if (!user) {
    console.log(`❌ Unauthorized access attempt from chat ID: ${chatId}`);
    return null;
  }

  return user;
}

// Insert expense with user validation
export async function insertExpense(expenseData, chatId) {
  // CRITICAL: Validate authorization first
  const user = await isUserAuthorized(chatId);

  if (!user) {
    throw new Error("User not authorized");
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert([
      {
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        created_at: expenseData.created_at,
        user_id: user.id,
      },
    ])
    .select();

  if (error) throw error;

  console.log(`✅ Expense added by ${user.name} (${chatId})`);
  return data[0];
}

// Get recent expenses for a user
export async function getRecentExpenses(chatId, limit = 10) {
  const user = await isUserAuthorized(chatId);

  if (!user) {
    throw new Error("User not authorized");
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get all family expenses (for shared view)
export async function getAllFamilyExpenses(chatId, limit = 20) {
  const user = await isUserAuthorized(chatId);

  if (!user) {
    throw new Error("User not authorized");
  }

  // Get all authorized user IDs
  const authorizedUserIds = Array.from(authorizedUsersCache.values()).map(
    (u) => u.id
  );

  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      authorized_users (name)
    `
    )
    .in("user_id", authorizedUserIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Delete last expense
export async function deleteLastExpense(chatId) {
  const user = await isUserAuthorized(chatId);

  if (!user) {
    throw new Error("User not authorized");
  }

  // Get last expense
  const { data: lastExpense, error: fetchError } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return null; // No expenses found
    }
    throw fetchError;
  }

  // Delete it
  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("id", lastExpense.id);

  if (deleteError) throw deleteError;

  console.log(`✅ Expense deleted by ${user.name} (${chatId})`);
  return lastExpense;
}

// Get monthly summary by category
export async function getMonthlySummary(chatId, year, month) {
  const user = await isUserAuthorized(chatId);

  if (!user) {
    throw new Error("User not authorized");
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from("expenses")
    .select("category, amount")
    .eq("user_id", user.id)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

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

// Get family monthly summary
export async function getFamilyMonthlySummary(chatId, year, month) {
  const user = await isUserAuthorized(chatId);

  if (!user) {
    throw new Error("User not authorized");
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const authorizedUserIds = Array.from(authorizedUsersCache.values()).map(
    (u) => u.id
  );

  const { data, error } = await supabase
    .from("expenses")
    .select("category, amount")
    .in("user_id", authorizedUserIds)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

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

// Refresh cache on demand (can be called via admin command)
export async function refreshCache() {
  cacheTimestamp = 0; // Force refresh
  await refreshAuthorizedUsers();
}
