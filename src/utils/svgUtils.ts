/**
 * Utility functions for handling SVG logos in PDFs and emails
 */

/**
 * Converts an SVG string to a Base64 data URL
 */
export const svgToBase64 = (svgString: string): string => {
  // Clean up the SVG string
  const cleanedSvg = svgString.trim();
  
  // Encode to Base64
  const base64 = btoa(unescape(encodeURIComponent(cleanedSvg)));
  
  return `data:image/svg+xml;base64,${base64}`;
};

/**
 * Converts an SVG string to a PNG data URL using Canvas
 * This is useful for better PDF compatibility
 */
export const svgToPngDataUrl = async (
  svgString: string, 
  width: number = 200, 
  height: number = 150
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Create an image element
      const img = new Image();
      
      // Handle load event
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to PNG data URL
        const pngDataUrl = canvas.toDataURL('image/png');
        resolve(pngDataUrl);
      };
      
      // Handle error event
      img.onerror = (error) => {
        reject(error);
      };
      
      // Set the source to the SVG data URL
      img.src = svgToBase64(svgString);
      
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Placeholder SVG for Rümpel Schmiede logo
 * This is used when no actual logo is provided
 */
export const getRuempelSchmiedePlaceholderSVG = (): string => {
  return `
    <svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="200" height="150" fill="#E74C3C" rx="10"/>
      
      <!-- RS Letters -->
      <text x="100" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
        RS
      </text>
      
      <!-- Company name -->
      <text x="100" y="110" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">
        RÜMPEL SCHMIEDE
      </text>
      
      <!-- Decorative elements -->
      <rect x="20" y="120" width="60" height="2" fill="white" opacity="0.5"/>
      <rect x="120" y="120" width="60" height="2" fill="white" opacity="0.5"/>
    </svg>
  `;
};

/**
 * Get logo for use in HTML emails
 * Returns inline SVG or img tag with base64
 */
export const getEmailLogo = (svgString?: string, inline: boolean = true): string => {
  const svg = svgString || getRuempelSchmiedePlaceholderSVG();
  
  if (inline) {
    // Return inline SVG for better email compatibility
    return svg;
  } else {
    // Return as img tag with base64 data URL
    const base64Url = svgToBase64(svg);
    return `<img src="${base64Url}" alt="Rümpel Schmiede Logo" style="max-width: 200px; height: auto;">`;
  }
};

/**
 * Prepare logo for PDF usage
 * Converts SVG to PNG for better PDF compatibility
 */
export const preparePdfLogo = async (svgString?: string): Promise<string> => {
  const svg = svgString || getRuempelSchmiedePlaceholderSVG();
  
  try {
    // Convert to PNG for better PDF compatibility
    const pngDataUrl = await svgToPngDataUrl(svg, 140, 100);
    return pngDataUrl;
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
    // Fallback to base64 SVG
    return svgToBase64(svg);
  }
};