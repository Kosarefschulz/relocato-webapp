// Rümpel Schmiede Logo
// Da das Original-Logo sehr groß ist (303KB), verwenden wir vorerst ein vereinfachtes Logo
// Für das echte Logo sollte die Datei optimiert werden (z.B. mit SVGO)

// Vereinfachtes Logo für bessere Performance
export const ruempelSchmiedeLogoSVG = `
<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="200" height="150" fill="#E74C3C" rx="10"/>
  
  <!-- Container Icon symbolizing "Rümpel" (junk/clearance) -->
  <g transform="translate(100, 60)">
    <!-- Container body -->
    <rect x="-30" y="-20" width="60" height="40" fill="white" rx="3"/>
    <!-- Container ridges -->
    <rect x="-25" y="-15" width="2" height="30" fill="#E74C3C"/>
    <rect x="-10" y="-15" width="2" height="30" fill="#E74C3C"/>
    <rect x="5" y="-15" width="2" height="30" fill="#E74C3C"/>
    <rect x="20" y="-15" width="2" height="30" fill="#E74C3C"/>
    <!-- Container lid -->
    <rect x="-32" y="-25" width="64" height="8" fill="white" rx="2"/>
  </g>
  
  <!-- Company Name -->
  <text x="100" y="110" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
    RÜMPEL SCHMIEDE
  </text>
  
  <!-- Tagline -->
  <text x="100" y="130" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle" opacity="0.8">
    Entrümpelung &amp; Haushaltsauflösung
  </text>
</svg>
`;

// Hinweis: Das Original-Logo befindet sich in src/assets/logos/ruempelschmiede-original.svg
// Es ist jedoch 303KB groß und sollte vor der Verwendung optimiert werden