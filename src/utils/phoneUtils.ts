/**
 * Utility functions for phone number processing
 */

/**
 * Cleans a phone number by removing apostrophes and other unwanted characters
 * while preserving the essential phone number structure
 * @param phone - The raw phone number string from Google Sheets
 * @returns The cleaned phone number string
 */
export function cleanPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove apostrophes that Google Sheets might add
  // Also trim whitespace
  let cleaned = phone
    .replace(/'/g, '') // Remove all apostrophes
    .replace(/'/g, '') // Remove curly apostrophes (if any)
    .replace(/`/g, '') // Remove backticks (if any)
    .trim();
  
  // Format German phone numbers
  // If number starts with 49 (German country code) but no +, add it
  if (cleaned.match(/^49\d+$/)) {
    cleaned = '+' + cleaned;
  }
  // If number starts with 0049, replace with +49
  else if (cleaned.startsWith('0049')) {
    cleaned = '+49' + cleaned.substring(4);
  }
  
  return cleaned;
}

/**
 * Formats a phone number for display
 * @param phone - The phone number to format
 * @returns The formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // First clean the phone number
  const cleaned = cleanPhoneNumber(phone);
  
  // Return the cleaned number (can be extended later for specific formatting)
  return cleaned;
}