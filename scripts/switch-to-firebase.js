#!/usr/bin/env node

/**
 * Script to switch all components from Google Sheets service to unified database service
 * This updates all imports to use the centralized database configuration
 */

const fs = require('fs');
const path = require('path');

// Patterns to replace
const patterns = [
  {
    // Standard import
    from: /import\s+{\s*googleSheetsPublicService\s+as\s+googleSheetsService\s*}\s+from\s+['"]\.\.\/services\/googleSheetsPublic['"]/g,
    to: "import { databaseService as googleSheetsService } from '../config/database.config'"
  },
  {
    // Direct import
    from: /import\s+{\s*googleSheetsPublicService\s*}\s+from\s+['"]\.\.\/services\/googleSheetsPublic['"]/g,
    to: "import { databaseService as googleSheetsPublicService } from '../config/database.config'"
  },
  {
    // Relative path variations
    from: /import\s+{\s*googleSheetsPublicService\s+as\s+googleSheetsService\s*}\s+from\s+['"]\.\.\/\.\.\/services\/googleSheetsPublic['"]/g,
    to: "import { databaseService as googleSheetsService } from '../../config/database.config'"
  },
  {
    from: /import\s+{\s*googleSheetsPublicService\s*}\s+from\s+['"]\.\.\/\.\.\/services\/googleSheetsPublic['"]/g,
    to: "import { databaseService as googleSheetsPublicService } from '../../config/database.config'"
  }
];

// Directories to search
const searchDirs = [
  'src/components',
  'src/pages',
  'src/services',
  'src/utils'
];

// File extensions to process
const extensions = ['.ts', '.tsx'];

let filesUpdated = 0;
let totalReplacements = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileReplacements = 0;

    // Apply all patterns
    patterns.forEach(pattern => {
      const matches = content.match(pattern.from);
      if (matches) {
        content = content.replace(pattern.from, pattern.to);
        fileReplacements += matches.length;
      }
    });

    // If content changed, write it back
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath} (${fileReplacements} replacements)`);
      filesUpdated++;
      totalReplacements += fileReplacements;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        processDirectory(itemPath);
      } else if (stat.isFile() && extensions.includes(path.extname(item))) {
        // Process TypeScript files
        processFile(itemPath);
      }
    });
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
  }
}

console.log('🔄 Switching to Firebase as primary database...\n');

// Process all search directories
searchDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Processing ${dir}...`);
    processDirectory(fullPath);
  } else {
    console.log(`⚠️  Directory not found: ${dir}`);
  }
});

console.log('\n✨ Migration complete!');
console.log(`📊 Summary: ${filesUpdated} files updated with ${totalReplacements} total replacements`);
console.log('\n🎯 Next steps:');
console.log('1. Check src/config/database.config.ts to ensure USE_FIREBASE_PRIMARY is set to true');
console.log('2. Run the app and test that everything works with Firebase');
console.log('3. Consider running the migration tool to import any existing Google Sheets data');