// Rümpel Schmiede Logo als String für einfacheren Import
export const ruempelSchmiedeLogoSVG = `
<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Circle -->
  <circle cx="100" cy="75" r="70" fill="#E74C3C"/>
  
  <!-- Hammer Icon (simplified) -->
  <g transform="translate(100, 75)">
    <!-- Hammer Handle -->
    <rect x="-5" y="-40" width="10" height="50" fill="white" transform="rotate(45)"/>
    
    <!-- Hammer Head -->
    <rect x="-20" y="-45" width="40" height="15" fill="white" transform="rotate(45)"/>
  </g>
  
  <!-- RS Text -->
  <text x="100" y="85" font-family="Arial Black, sans-serif" font-size="36" font-weight="900" fill="white" text-anchor="middle" opacity="0.9">
    RS
  </text>
  
  <!-- Company Name -->
  <text x="100" y="130" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#E74C3C" text-anchor="middle">
    RÜMPEL SCHMIEDE
  </text>
  
  <!-- Decorative Lines -->
  <rect x="20" y="138" width="60" height="3" fill="#E74C3C" opacity="0.5"/>
  <rect x="120" y="138" width="60" height="3" fill="#E74C3C" opacity="0.5"/>
</svg>
`;