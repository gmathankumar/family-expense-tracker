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
