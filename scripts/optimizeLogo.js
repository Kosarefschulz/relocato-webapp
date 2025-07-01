const fs = require('fs');
const path = require('path');

// Einfache SVG-Optimierung ohne externe Dependencies
function optimizeSVG(svgContent) {
  let optimized = svgContent;
  
  // Entferne unnötige Whitespaces
  optimized = optimized.replace(/\s+/g, ' ');
  optimized = optimized.replace(/>\s+</g, '><');
  
  // Entferne Kommentare
  optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');
  
  // Entferne leere Gruppen
  optimized = optimized.replace(/<g\s*>\s*<\/g>/g, '');
  
  // Kürze Zahlen
  optimized = optimized.replace(/(\d+\.\d{3,})/g, (match) => {
    return parseFloat(match).toFixed(2);
  });
  
  // Entferne Standard-Attribute
  optimized = optimized.replace(/\s*(vector-effect|stroke-linecap|stroke-width)="[^"]*"/g, '');
  
  // Vereinfache Pfade (sehr einfache Version)
  optimized = optimized.replace(/(\d)\s+(\d)/g, '$1 $2');
  
  return optimized;
}

async function processLogo() {
  try {
    const inputPath = path.join(__dirname, '../src/assets/logos/ruempelschmiede-original.svg');
    const outputTsPath = path.join(__dirname, '../src/assets/logos/ruempelschmiedeLogo.ts');
    
    // Prüfe ob Original-Logo existiert
    if (!fs.existsSync(inputPath)) {
      console.log('Original-Logo nicht gefunden. Verwende Platzhalter-Logo.');
      return;
    }
    
    // Lese Original SVG
    const originalSvg = fs.readFileSync(inputPath, 'utf8');
    const originalSize = Buffer.byteLength(originalSvg, 'utf8');
    
    console.log(`Original SVG Größe: ${(originalSize / 1024).toFixed(2)} KB`);
    
    // Einfache Optimierung
    const optimizedSvg = optimizeSVG(originalSvg);
    const optimizedSize = Buffer.byteLength(optimizedSvg, 'utf8');
    
    console.log(`Optimierte SVG Größe: ${(optimizedSize / 1024).toFixed(2)} KB`);
    console.log(`Ersparnis: ${((1 - optimizedSize / originalSize) * 100).toFixed(2)}%`);
    
    // Extrahiere viewBox falls vorhanden
    const viewBoxMatch = optimizedSvg.match(/viewBox="([^"]*)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 1024 682';
    
    // Für sehr große Logos: Erstelle ein vereinfachtes Logo basierend auf der Hauptfarbe
    if (optimizedSize > 50 * 1024) {
      console.warn('\nLogo ist zu groß (>50KB).');
      console.log('Verwende vereinfachtes Logo mit Firmenfarben.');
      
      // Extrahiere die Hauptfarbe aus dem Logo
      const colorMatch = originalSvg.match(/(?:fill|stroke)="(#[0-9A-Fa-f]{6})"/);
      const mainColor = colorMatch ? colorMatch[1] : '#E74C3C';
      
      const simplifiedLogo = `<svg width="200" height="150" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="150" fill="${mainColor}" rx="10"/>
  <g transform="translate(100, 60)">
    <rect x="-30" y="-20" width="60" height="40" fill="white" rx="3"/>
    <rect x="-25" y="-15" width="2" height="30" fill="${mainColor}"/>
    <rect x="-10" y="-15" width="2" height="30" fill="${mainColor}"/>
    <rect x="5" y="-15" width="2" height="30" fill="${mainColor}"/>
    <rect x="20" y="-15" width="2" height="30" fill="${mainColor}"/>
    <rect x="-32" y="-25" width="64" height="8" fill="white" rx="2"/>
  </g>
  <text x="100" y="110" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
    RÜMPEL SCHMIEDE
  </text>
  <text x="100" y="130" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle" opacity="0.8">
    Entrümpelung &amp; Haushaltsauflösung
  </text>
</svg>`;
      
      const tsContent = `// Automatisch generiertes Logo
// Original war zu groß (${(originalSize / 1024).toFixed(2)} KB)
// Verwende vereinfachtes Logo mit extrahierter Farbe: ${mainColor}
// Generiert am: ${new Date().toISOString()}

export const ruempelSchmiedeLogoSVG = \`${simplifiedLogo}\`;

// Info: Das Original-Logo kann unter src/assets/logos/ruempelschmiede-original.svg gefunden werden
// Für bessere Optimierung verwenden Sie professionelle Tools wie:
// - Adobe Illustrator
// - Inkscape
// - SVGOMG (https://jakearchibald.github.io/svgomg/)
`;
      
      fs.writeFileSync(outputTsPath, tsContent);
      console.log('\nVereinfachtes Logo mit Firmenfarbe erstellt!');
      console.log(`Hauptfarbe: ${mainColor}`);
      
    } else {
      // Verwende optimiertes Logo
      const tsContent = `// Automatisch generiertes, optimiertes Logo
// Original: ${(originalSize / 1024).toFixed(2)} KB
// Optimiert: ${(optimizedSize / 1024).toFixed(2)} KB
// Generiert am: ${new Date().toISOString()}

export const ruempelSchmiedeLogoSVG = \`${optimizedSvg}\`;
`;
      
      fs.writeFileSync(outputTsPath, tsContent);
      console.log('Logo erfolgreich optimiert und gespeichert!');
    }
    
  } catch (error) {
    console.error('Fehler beim Verarbeiten des Logos:', error);
  }
}

// Führe Verarbeitung aus
processLogo();