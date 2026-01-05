// Extract amount from user message as fallback
export function extractAmountFromMessage(message) {
  if (!message) return null;

  // Match patterns like: 4.50, £4.50, 4.5, 50, £50, $50, 100.00
  const patterns = [
    /(?:£|\$|gbp|usd)?\s*(\d+\.\d{2})/i, // Matches 4.50, £4.50, $4.50, 100.00
    /(?:£|\$|gbp|usd)?\s*(\d+\.\d{1})/i, // Matches 4.5, £4.5, $4.5
    /(?:£|\$|gbp|usd)?\s*(\d+)(?:\s|$)/i, // Matches 50, £50, $50 (with word boundary)
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      // Round to 2 decimal places
      return Math.round(amount * 100) / 100;
    }
  }

  return null;
}

// Category definitions for the family expense tracker

export const CATEGORIES = {
  expense: [
    'Bills',
    'Car',
    'Food',
    'Gifts',
    'Government',
    'Grocery',
    'Health',
    'Household',
    'Leisure',
    'Lifestyle',
    'Others',
    'Pranav',
    'Purchases',
    'Rent',
    'Transport'
  ],
  income: [
    'Business',
    'Car Park',
    'Carpooling',
    'Cashback',
    'Freelancing',
    'Gifts',
    'Interest',
    'Others',
    'Salary',
    'Tax',
    'Trading'
  ],
  savings: [
    'Investment',
    'Other'
  ]
};

// Validate category for transaction type
export function isValidCategory(transactionType, category) {
  return CATEGORIES[transactionType]?.includes(category) || false;
}

// Get default category for transaction type
export function getDefaultCategory(transactionType) {
  const defaults = {
    expense: 'Others',
    income: 'Others',
    savings: 'Other'
  };
  return defaults[transactionType] || 'Others';
}