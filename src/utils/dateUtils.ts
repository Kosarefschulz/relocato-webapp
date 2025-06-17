/**
 * Utility functions for date parsing and formatting
 * Handles various German date formats
 */

/**
 * Parse a date string that could be in various formats
 * Common German formats: DD.MM.YYYY, DD.MM.YY, DD/MM/YYYY, DD-MM-YYYY
 * ISO format: YYYY-MM-DD
 * @param dateString - The date string to parse
 * @returns A valid Date object or null if parsing fails
 */
export function parseDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  
  // Remove any extra whitespace
  const trimmed = dateString.trim();
  if (!trimmed) return null;
  
  // Try native Date parsing first (handles ISO format and some other formats)
  const nativeDate = new Date(trimmed);
  if (!isNaN(nativeDate.getTime())) {
    return nativeDate;
  }
  
  // German date formats: DD.MM.YYYY or DD.MM.YY
  const germanPattern = /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/;
  const germanMatch = trimmed.match(germanPattern);
  if (germanMatch) {
    const day = parseInt(germanMatch[1], 10);
    const month = parseInt(germanMatch[2], 10) - 1; // Month is 0-indexed
    let year = parseInt(germanMatch[3], 10);
    
    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Alternative formats with / or -
  const altPattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
  const altMatch = trimmed.match(altPattern);
  if (altMatch) {
    const day = parseInt(altMatch[1], 10);
    const month = parseInt(altMatch[2], 10) - 1;
    let year = parseInt(altMatch[3], 10);
    
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // ISO format with time: YYYY-MM-DDTHH:mm:ss
  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})/;
  const isoMatch = trimmed.match(isoPattern);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
}

/**
 * Format a date for display in German format
 * @param date - The date to format (can be Date object or string)
 * @param options - Formatting options
 * @returns Formatted date string or fallback text
 */
export function formatDate(
  date: Date | string | undefined | null,
  options: {
    includeWeekday?: boolean;
    fallback?: string;
  } = {}
): string {
  const { includeWeekday = true, fallback = 'Kein Datum' } = options;
  
  if (!date) return fallback;
  
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) {
    return fallback;
  }
  
  try {
    if (includeWeekday) {
      return dateObj.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      return dateObj.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  } catch (error) {
    // Fallback for environments that don't support toLocaleDateString
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
  }
}

/**
 * Convert a date to ISO format for storage (YYYY-MM-DD)
 * @param date - The date to convert
 * @returns ISO date string or empty string
 */
export function toISODateString(date: Date | string | undefined | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string is valid
 * @param dateString - The date string to check
 * @returns true if valid, false otherwise
 */
export function isValidDate(dateString: string | undefined | null): boolean {
  if (!dateString) return false;
  const date = parseDate(dateString);
  return date !== null && !isNaN(date.getTime());
}

/**
 * Get a human-readable relative time string
 * @param date - The date to compare
 * @returns Relative time string (e.g., "in 3 Tagen", "vor 2 Wochen")
 */
export function getRelativeTime(date: Date | string | undefined | null): string {
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Heute';
  if (diffInDays === 1) return 'Morgen';
  if (diffInDays === -1) return 'Gestern';
  
  if (diffInDays > 0) {
    if (diffInDays < 7) return `in ${diffInDays} Tagen`;
    if (diffInDays < 30) return `in ${Math.round(diffInDays / 7)} Wochen`;
    if (diffInDays < 365) return `in ${Math.round(diffInDays / 30)} Monaten`;
    return `in ${Math.round(diffInDays / 365)} Jahren`;
  } else {
    const absDays = Math.abs(diffInDays);
    if (absDays < 7) return `vor ${absDays} Tagen`;
    if (absDays < 30) return `vor ${Math.round(absDays / 7)} Wochen`;
    if (absDays < 365) return `vor ${Math.round(absDays / 30)} Monaten`;
    return `vor ${Math.round(absDays / 365)} Jahren`;
  }
}