import { extractAmountFromMessage, getDefaultCategory, isValidCategory } from './utils.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.2-3b-instruct:free';


export async function parseExpenseWithLLM(userMessage) {
  try {
    // Extract amount directly as fallback
    const directAmount = extractAmountFromMessage(userMessage);
    
    // Optimized prompt with your categories
    const prompt = `Parse: "${userMessage}"

Return JSON:
{
  "transaction_type": "expense|income|savings",
  "amount": number with 2 decimals,
  "category": from list below,
  "description": merchant/source
}

EXPENSE (spending): Bills, Car, Food, Gifts, Government, Grocery, Health, Household, Leisure, Lifestyle, Others, Pranav, Purchases, Rent, Transport

INCOME (receiving): Business, Car Park, Carpooling, Cashback, Freelancing, Gifts, Interest, Others, Salary, Tax, Trading

SAVINGS (investing): Investment, Other

Examples:
"Spent £4.5 at Sainsbury's" → {"transaction_type":"expense","amount":4.50,"category":"Grocery","description":"Sainsbury's"}
"Add 50 Tesco" → {"transaction_type":"expense","amount":50.00,"category":"Grocery","description":"Tesco"}
"Bought petrol 45" → {"transaction_type":"expense","amount":45.00,"category":"Car","description":"Petrol"}
"Rent 850" → {"transaction_type":"expense","amount":850.00,"category":"Rent","description":"Monthly rent"}
"Salary 2400" → {"transaction_type":"income","amount":2400.00,"category":"Salary","description":"Monthly salary"}
"Freelance 500" → {"transaction_type":"income","amount":500.00,"category":"Freelancing","description":"Freelance work"}
"Saved 300" → {"transaction_type":"savings","amount":300.00,"category":"Investment","description":"Savings"}`;

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
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON in response:', responseText, e);
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
      parsed.transaction_type = 'expense'; // Default
    }

    // Validate category based on transaction_type
    if (!isValidCategory(parsed.transaction_type, parsed.category)) {
      console.log(`⚠️ Invalid category "${parsed.category}" for ${parsed.transaction_type}`);
      parsed.category = getDefaultCategory(parsed.transaction_type);
      console.log(`   Using default: ${parsed.category}`);
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