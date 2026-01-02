const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://ollama:11434";

// Detect if message is an expense
export async function isExpenseMessage(userMessage) {
  try {
    const prompt = `Is this message about adding/recording an expense or spending money?

Message: "${userMessage}"

Respond with ONLY "yes" or "no".

Examples:
"Add 50 to Tesco" -> yes
"spent 25 on uber" -> yes
"bought coffee for 4.50" -> yes
"paid 100 for electricity" -> yes
"hello" -> no
"what's the weather" -> no
"how are you" -> no`;

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 10,
        },
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const answer = data.response?.trim().toLowerCase();

    return answer === "yes";
  } catch (error) {
    console.error("Error detecting expense intent:", error);
    return false;
  }
}

export async function parseExpenseWithLLM(userMessage) {
  try {
    const prompt = `You are an expense parser. Extract the expense details EXACTLY from the user's message.

User message: "${userMessage}"

CRITICAL RULES FOR AMOUNT:
- Keep ALL decimal places EXACTLY as written (e.g., 4.50 stays 4.50, not 4.5 or 5)
- Include decimals even if .00 (e.g., 50.00)
- Do NOT round numbers
- If no decimals mentioned, add .00

Extract:
1. Amount - MUST be a decimal number with 2 decimal places (e.g., 50.00, 4.50, 12.99)
2. Category - Pick ONE: Grocery, Transport, Entertainment, Food, Shopping, Bills, Health, Other
3. Description - Shop/merchant name or what was bought

Category Guidelines:
- Tesco, Sainsbury's, Asda, Morrisons, Waitrose, Lidl, Aldi = Grocery
- Uber, Taxi, Train, Bus, Petrol, Fuel, Diesel = Transport
- Coffee, Restaurant, Takeaway, Pizza, McDonald's, Cafe, Lunch, Dinner, Breakfast = Food
- Cinema, Netflix, Spotify, Games, Concert = Entertainment
- Electricity, Water, Gas, Phone, Internet, Rent = Bills
- Pharmacy, Doctor, Medicine, Hospital = Health
- Clothes, Shoes, Electronics, Amazon = Shopping

IMPORTANT EXAMPLES:
"Spent 4.50 on coffee" -> {"amount": 4.50, "category": "Food", "description": "Coffee"}
"Add 50 to Tesco" -> {"amount": 50.00, "category": "Grocery", "description": "Tesco"}
"Paid 12.99 for lunch" -> {"amount": 12.99, "category": "Food", "description": "Lunch"}
"Bought petrol for 65.30" -> {"amount": 65.30, "category": "Transport", "description": "Petrol"}

Response format - JSON ONLY with amount as decimal number:
{"amount": 4.50, "category": "Food", "description": "Coffee"}

Now extract from: "${userMessage}"

Return ONLY the JSON object, nothing else.`;

    console.log(`Parsing expense: "${userMessage}"`);

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
          num_predict: 150,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.response?.trim();

    if (!responseText) {
      console.error("Empty response from Ollama");
      return null;
    }

    console.log("Ollama raw response:", responseText);

    // Try to parse the JSON
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response:", responseText);
        return null;
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Validate the parsed data
    if (!parsed.amount || !parsed.category || !parsed.description) {
      console.error("Incomplete data in response:", parsed);
      return null;
    }

    // Ensure amount is a proper float with 2 decimal places
    let amount = parseFloat(parsed.amount);

    // Round to 2 decimal places to handle any floating point errors
    amount = Math.round(amount * 100) / 100;

    console.log("✅ Parsed expense:", {
      amount,
      category: parsed.category,
      description: parsed.description,
    });

    return {
      amount: amount,
      category: parsed.category,
      description: parsed.description,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("LLM parsing error:", error);
    console.error("Stack:", error.stack);
    return null;
  }
}
