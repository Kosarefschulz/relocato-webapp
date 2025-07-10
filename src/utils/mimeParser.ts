// MIME Parser Utilities for Email Content
// Handles decoding and parsing of MIME encoded emails

// Decode MIME encoded strings (e.g., =?utf-8?q?text?=)
export function decodeMimeString(str: string | undefined): string {
  if (!str) return str || '';
  
  // First, try to fix common UTF-8 encoding issues
  try {
    // Check if string contains UTF-8 encoding artifacts
    if (str.includes('Ã¼') || str.includes('Ã¤') || str.includes('Ã¶') || str.includes('ÃŸ')) {
      // This is likely a double-encoded UTF-8 string
      const bytes = new TextEncoder().encode(str);
      const decoded = new TextDecoder('iso-8859-1').decode(bytes);
      str = decoded;
    }
  } catch (e) {
    // If decoding fails, continue with original string
  }
  
  // Handle encoded-word format: =?charset?encoding?encoded-text?=
  return str.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (match, charset, encoding, encodedText) => {
    try {
      if (encoding.toUpperCase() === 'Q') {
        // Quoted-Printable decoding
        let decoded = encodedText.replace(/_/g, ' ');
        decoded = decoded.replace(/=([0-9A-F]{2})/gi, (m: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
        return decoded;
      } else if (encoding.toUpperCase() === 'B') {
        // Base64 decoding
        const buffer = Uint8Array.from(atob(encodedText), c => c.charCodeAt(0));
        return new TextDecoder(charset).decode(buffer);
      }
    } catch (e) {
      console.error('Failed to decode MIME string:', e);
    }
    return match;
  });
}

// Decode quoted-printable content
export function decodeQuotedPrintable(content: string): string {
  // Handle soft line breaks
  content = content.replace(/=\r?\n/g, '');
  // Decode hex sequences
  content = content.replace(/=([0-9A-F]{2})/gi, (m, hex) => 
    String.fromCharCode(parseInt(hex, 16))
  );
  return content;
}

// Decode base64 content
export function decodeBase64(content: string): string {
  try {
    // Remove all whitespace from base64
    const cleanBase64 = content.replace(/[\s\r\n]/g, '');
    const decoded = atob(cleanBase64);
    // Convert to proper UTF-8
    const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.error('Base64 decode error:', e);
    return content;
  }
}

// Sanitize HTML content for safe display
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Remove potentially dangerous tags and attributes
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove script tags
  const scripts = tempDiv.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove on* event handlers
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach(element => {
    const attributes = element.attributes;
    for (let i = attributes.length - 1; i >= 0; i--) {
      const attr = attributes[i];
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }
    }
  });
  
  // Remove javascript: links
  const links = tempDiv.querySelectorAll('a[href^="javascript:"]');
  links.forEach(link => link.removeAttribute('href'));
  
  return tempDiv.innerHTML;
}

// Convert plain text to HTML with proper formatting
export function textToHtml(text: string): string {
  if (!text) return '';
  
  // Escape HTML entities
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // Convert URLs to links
  const withLinks = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Convert email addresses to links
  const withEmails = withLinks.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1">$1</a>'
  );
  
  // Convert newlines to <br> tags
  const withBreaks = withEmails.replace(/\n/g, '<br>\n');
  
  return `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${withBreaks}</div>`;
}

// Process email content for display
export function processEmailContent(email: {
  html?: string;
  text?: string;
  textAsHtml?: string;
}): string {
  // Priority: HTML > textAsHtml > text
  if (email.html) {
    // Check if content is quoted-printable encoded
    if (email.html.includes('=3D') || email.html.includes('=C3=') || email.html.includes('=E2=')) {
      const decoded = decodeQuotedPrintable(email.html);
      return sanitizeHtml(decoded);
    }
    return sanitizeHtml(email.html);
  }
  
  if (email.textAsHtml) {
    // Check if content is quoted-printable encoded
    if (email.textAsHtml.includes('=3D') || email.textAsHtml.includes('=C3=') || email.textAsHtml.includes('=E2=')) {
      const decoded = decodeQuotedPrintable(email.textAsHtml);
      return sanitizeHtml(decoded);
    }
    return sanitizeHtml(email.textAsHtml);
  }
  
  if (email.text) {
    // Check if content is quoted-printable encoded
    if (email.text.includes('=3D') || email.text.includes('=C3=') || email.text.includes('=E2=')) {
      const decoded = decodeQuotedPrintable(email.text);
      return textToHtml(decoded);
    }
    return textToHtml(email.text);
  }
  
  return '<div style="text-align: center; padding: 20px; color: #999;">No content available for this email</div>';
}