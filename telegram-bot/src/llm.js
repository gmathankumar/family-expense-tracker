import { extractAmountFromMessage } from "./utils.js";
import { config } from "dotenv";

// Ensure environment variables are loaded
config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Using free models on OpenRouter
// Options: meta-llama/llama-3.2-3b-instruct:free, google/gemma-2-9b-it:free, etc.
const MODEL = "meta-llama/llama-3.2-3b-instruct:free";

export async function parseExpenseWithLLM(userMessage) {
  try {
    // Extract amount directly as fallback
    const directAmount = extractAmountFromMessage(userMessage);
    
    // Simplified, focused prompt
    const prompt = `You are a financial transaction parser. Extract transaction details EXACTLY from the user's message.

User message: "${userMessage}"

CRITICAL RULES FOR AMOUNT:
- Keep ALL decimal places EXACTLY as written (e.g., 4.50 stays 4.50, not 4.5 or 5)
- Include decimals even if .00 (e.g., 50.00)
- Do NOT round numbers
- If no decimals mentioned, add .00

Return JSON with:
- transaction_type: "expense" (spent/paid/bought), "income" (received/earned/salary), or "savings" (saved/invested)
- amount: number with decimals (e.g., 4.50 not 4.5)
- category: best match from list below
- description - Source/merchant name or what it's for

Categories:
EXPENSE: Grocery, Transport, Food, Entertainment, Bills, Health, Shopping, Other
INCOME: Salary, Freelance, Business, Investment, Gift, Other  
SAVINGS: Emergency Fund, Retirement, Investment, General, Goal

Examples:
"Spent £4.5 at Sainsbury's" -> {"transaction_type":"expense","amount":4.50,"category":"Grocery","description":"Sainsbury's"}
"Add 50 Tesco" -> {"transaction_type":"expense","amount":50.00,"category":"Grocery","description":"Tesco"}
"Salary 2400" -> {"transaction_type":"income","amount":2400.00,"category":"Salary","description":"Monthly salary"}
"Saved 300" -> {"transaction_type":"savings","amount":300.00,"category":"General","description":"Savings"}`;

    console.log(`Parsing: "${userMessage}"`);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/gmathankumar/family-expense-tracker',
        'X-Title': 'Family Expense Tracker Bot'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 100,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content?.trim();
    
    if (!responseText) {
      console.error('Empty response from OpenRouter');
      return null;
    }

    console.log('LLM response:', responseText);
    
    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      console.log('Initial JSON parse failed, attempting regex extraction:', e.message);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON in response:', responseText);
        return null;
      }
      parsed = JSON.parse(jsonMatch[0]);
    }
    
    // Validate required fields
    if (!parsed.transaction_type || !parsed.amount || !parsed.category || !parsed.description) {
      console.error('Missing fields:', parsed);
      return null;
    }

    // Validate transaction_type
    const validTypes = ['expense', 'income', 'savings'];
    if (!validTypes.includes(parsed.transaction_type)) {
      console.error('Invalid transaction_type:', parsed.transaction_type);
      // Default to expense if invalid
      parsed.transaction_type = 'expense';
    }

    // Get amount
    let amount = parseFloat(parsed.amount);
    
    // Use direct extraction if LLM's amount is wrong
    if (directAmount && Math.abs(amount - directAmount) > 0.01) {
      console.log(`⚠️ Using direct amount: ${directAmount} (LLM said ${amount})`);
      amount = directAmount;
    }
    
    // Round to 2 decimals
    amount = Math.round(amount * 100) / 100;

    console.log('✅ Parsed:', {
      type: parsed.transaction_type,
      amount,
      category: parsed.category,
      description: parsed.description
    });

    return {
      transaction_type: parsed.transaction_type,
      amount: amount,
      category: parsed.category,
      description: parsed.description,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('LLM parsing error:', error);
    return null;
  }
}
