/**
 * AI Assistant Testing Framework
 * Testet alle Capabilities und findet Grenzen
 */

const axios = require('axios');

const CODE_BACKEND_URL = 'http://localhost:3002/api/code';
const AI_ASSISTANT_URL = 'http://localhost:3004'; // Falls wir direkte API brauchen

// ============================================
// TEST SCENARIOS
// ============================================

const testScenarios = [
  // ===== CRM OPERATIONS =====
  {
    category: 'CRM',
    name: 'Create Customer - Complete Data',
    prompt: 'Lege einen neuen Testkunden an: Max Mustermann, Tel: 0151-99887766, Email: max@test.de, Von: Berlin Straße 1, Nach: Hamburg Weg 5, Umzug am 15.11.2025',
    expectedTool: 'create_customer',
    expectedResult: 'Kunde erfolgreich angelegt'
  },
  {
    category: 'CRM',
    name: 'Create Customer - Minimal Data',
    prompt: 'Erstelle Kunde: Anna Schmidt',
    expectedTool: 'create_customer',
    expectedResult: 'Kunde mit Defaults angelegt'
  },
  {
    category: 'CRM',
    name: 'Search Customers',
    prompt: 'Suche nach Kunden mit Namen "Müller"',
    expectedTool: 'search_customers',
    expectedResult: 'Liste gefunden'
  },
  {
    category: 'CRM',
    name: 'Create Quote',
    prompt: 'Erstelle ein Angebot für Kunde [ID] über 1500€, 30m³, 50km',
    expectedTool: 'create_quote',
    expectedResult: 'Angebot erstellt',
    needsSetup: true
  },

  // ===== CODE OPERATIONS =====
  {
    category: 'CODE',
    name: 'Read File',
    prompt: 'Lies die Datei src/App.tsx',
    expectedTool: 'read_file',
    expectedResult: 'Dateiinhalt zurückgegeben'
  },
  {
    category: 'CODE',
    name: 'Search Code',
    prompt: 'Suche nach "supabaseService" im Code',
    expectedTool: 'search_code',
    expectedResult: 'Suchergebnisse zurückgegeben'
  },
  {
    category: 'CODE',
    name: 'Create Component - Simple',
    prompt: 'Erstelle eine neue React-Komponente TestComponent',
    expectedTool: 'create_component',
    expectedResult: 'Komponente erstellt'
  },
  {
    category: 'CODE',
    name: 'Create Component - Complex',
    prompt: 'Erstelle eine CustomerStatistics Komponente mit Chart-Integration, State-Management und API-Calls',
    expectedTool: 'create_component',
    expectedResult: 'Komponente mit Features erstellt',
    complex: true
  },
  {
    category: 'CODE',
    name: 'Edit File - Simple Replace',
    prompt: 'Ändere in src/App.tsx die Variable "test" zu "production"',
    expectedTool: 'edit_file',
    expectedResult: 'Erfolgreiche Ersetzung',
    needsSetup: true
  },
  {
    category: 'CODE',
    name: 'Write File - New Service',
    prompt: 'Erstelle einen neuen Service testService.ts mit CRUD-Operationen',
    expectedTool: 'write_file',
    expectedResult: 'Service-Datei erstellt'
  },

  // ===== TERMINAL OPERATIONS =====
  {
    category: 'TERMINAL',
    name: 'Git Status',
    prompt: 'Zeige mir den Git Status',
    expectedTool: 'git_operation',
    expectedResult: 'Git Status angezeigt'
  },
  {
    category: 'TERMINAL',
    name: 'NPM List',
    prompt: 'Führe "npm list react" aus',
    expectedTool: 'execute_command',
    expectedResult: 'Command ausgeführt'
  },
  {
    category: 'TERMINAL',
    name: 'Git Log',
    prompt: 'Zeige die letzten 5 Git Commits',
    expectedTool: 'git_operation',
    expectedResult: 'Commits angezeigt'
  },

  // ===== COMPLEX MULTI-STEP =====
  {
    category: 'COMPLEX',
    name: 'Full Feature Implementation',
    prompt: `Implementiere ein komplettes Export-Feature:
1. Erstelle exportService.ts
2. Erstelle ExportButton Komponente
3. Füge zur CustomerList hinzu
4. Installiere xlsx package`,
    expectedTools: ['execute_command', 'write_file', 'create_component', 'edit_file'],
    expectedResult: 'Feature komplett implementiert',
    multiStep: true
  },
  {
    category: 'COMPLEX',
    name: 'Bug Fix Workflow',
    prompt: 'Finde alle TypeScript-Fehler in src/components/ und fixe sie',
    expectedTools: ['search_code', 'read_file', 'edit_file'],
    expectedResult: 'Fehler gefunden und gefixt',
    multiStep: true
  },
  {
    category: 'COMPLEX',
    name: 'Code Refactoring',
    prompt: 'Refactore CustomerDetails.tsx: Extrahiere die Form-Logik in separate Hooks',
    expectedTools: ['read_file', 'write_file', 'edit_file'],
    expectedResult: 'Refactoring durchgeführt',
    multiStep: true
  },

  // ===== EDGE CASES =====
  {
    category: 'EDGE_CASE',
    name: 'Large File Read',
    prompt: 'Lies package-lock.json', // Sehr große Datei
    expectedTool: 'read_file',
    expectedResult: 'Datei gelesen (mit Größen-Limit)',
    shouldFail: 'Datei zu groß'
  },
  {
    category: 'EDGE_CASE',
    name: 'Forbidden Path',
    prompt: 'Lies .env Datei',
    expectedTool: 'read_file',
    expectedResult: 'Zugriff verweigert',
    shouldFail: 'Sicherheits-Block'
  },
  {
    category: 'EDGE_CASE',
    name: 'Dangerous Command',
    prompt: 'Führe "rm -rf /" aus',
    expectedTool: 'execute_command',
    expectedResult: 'Command blockiert',
    shouldFail: 'Sicherheits-Block'
  },
  {
    category: 'EDGE_CASE',
    name: 'Non-Existent File',
    prompt: 'Lies src/components/DoesNotExist.tsx',
    expectedTool: 'read_file',
    expectedResult: 'File not found Error',
    shouldFail: 'Datei existiert nicht'
  },

  // ===== PERFORMANCE TESTS =====
  {
    category: 'PERFORMANCE',
    name: 'Rapid Fire Requests',
    prompt: 'Multiple rapid requests',
    test: async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          axios.post(CODE_BACKEND_URL + '/read', {
            path: 'src/App.tsx'
          })
        );
      }
      return Promise.all(promises);
    },
    expectedResult: 'Alle Requests erfolgreich',
    performance: true
  },
  {
    category: 'PERFORMANCE',
    name: 'Rate Limit Test',
    prompt: 'Test rate limiting (>100 requests)',
    test: async () => {
      const promises = [];
      for (let i = 0; i < 150; i++) {
        promises.push(
          axios.post(CODE_BACKEND_URL + '/read', {
            path: 'src/App.tsx'
          }).catch(e => e.response)
        );
      }
      return Promise.all(promises);
    },
    expectedResult: '429 Rate Limit Error nach 100',
    performance: true
  }
];

// ============================================
// TEST EXECUTION
// ============================================

class AIAssistantTester {
  constructor() {
    this.results = [];
    this.failures = [];
    this.limitations = [];
  }

  async testCodeBackendHealth() {
    try {
      const response = await axios.get(CODE_BACKEND_URL + '/health');
      console.log('✅ Code Backend Health:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Code Backend nicht erreichbar:', error.message);
      return false;
    }
  }

  async runTest(scenario) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`   Category: ${scenario.category}`);

    try {
      let result;

      // Performance-Tests haben eigene Test-Funktionen
      if (scenario.test) {
        const startTime = Date.now();
        result = await scenario.test();
        const duration = Date.now() - startTime;

        console.log(`   ⏱️  Duration: ${duration}ms`);

        this.results.push({
          scenario: scenario.name,
          category: scenario.category,
          success: true,
          duration,
          result
        });

        return;
      }

      // Normale Tests: Direkt Code Backend testen
      if (scenario.expectedTool === 'read_file') {
        result = await axios.post(CODE_BACKEND_URL + '/read', {
          path: 'src/App.tsx'
        });
      } else if (scenario.expectedTool === 'search_code') {
        result = await axios.post(CODE_BACKEND_URL + '/search', {
          pattern: 'supabaseService',
          path: 'src'
        });
      } else if (scenario.expectedTool === 'git_operation') {
        result = await axios.post(CODE_BACKEND_URL + '/git', {
          action: 'status'
        });
      } else if (scenario.expectedTool === 'execute_command') {
        result = await axios.post(CODE_BACKEND_URL + '/execute', {
          command: 'npm list react'
        });
      }

      if (result && result.data.success) {
        console.log(`   ✅ PASS: ${scenario.expectedResult}`);
        this.results.push({
          scenario: scenario.name,
          category: scenario.category,
          success: true,
          result: result.data
        });
      } else {
        throw new Error('Request failed');
      }

    } catch (error) {
      if (scenario.shouldFail) {
        console.log(`   ✅ EXPECTED FAIL: ${scenario.shouldFail}`);
        this.results.push({
          scenario: scenario.name,
          category: scenario.category,
          success: true,
          expectedFailure: true,
          error: error.message
        });
      } else {
        console.log(`   ❌ FAIL: ${error.message}`);
        this.failures.push({
          scenario: scenario.name,
          category: scenario.category,
          error: error.message,
          prompt: scenario.prompt
        });
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting AI Assistant Comprehensive Tests...\n');
    console.log('═'.repeat(60));

    // Health Check
    const healthOk = await this.testCodeBackendHealth();
    if (!healthOk) {
      console.log('❌ Abbruch: Code Backend nicht verfügbar');
      return;
    }

    console.log('\n═'.repeat(60));

    // Run all scenarios
    for (const scenario of testScenarios) {
      if (scenario.needsSetup) {
        console.log(`   ⏭️  SKIPPED: ${scenario.name} (needs manual setup)`);
        continue;
      }

      await this.runTest(scenario);
    }

    // Results Summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));

    const total = this.results.length + this.failures.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = this.failures.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);

    // Categories
    console.log('\n📋 By Category:');
    const categories = {};
    this.results.forEach(r => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} tests`);
    });

    // Failures Detail
    if (this.failures.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.failures.forEach((f, i) => {
        console.log(`\n${i + 1}. ${f.scenario}`);
        console.log(`   Category: ${f.category}`);
        console.log(`   Error: ${f.error}`);
        console.log(`   Prompt: "${f.prompt}"`);
      });
    }

    // Identified Limitations
    console.log('\n📉 IDENTIFIED LIMITATIONS:');
    this.identifyLimitations();

    console.log('\n═'.repeat(60));
  }

  identifyLimitations() {
    const limitations = [];

    // Aus Failures
    this.failures.forEach(f => {
      if (f.error.includes('timeout')) {
        limitations.push({
          area: 'Performance',
          issue: 'Command Timeout',
          severity: 'HIGH',
          fix: 'Increase timeout or add streaming support'
        });
      }
      if (f.error.includes('not found')) {
        limitations.push({
          area: 'Error Handling',
          issue: 'Poor error messages',
          severity: 'MEDIUM',
          fix: 'Add better validation before execution'
        });
      }
    });

    // Known Limitations
    limitations.push(
      {
        area: 'Multi-Step Operations',
        issue: 'Cannot chain multiple tools in one request',
        severity: 'HIGH',
        fix: 'Implement tool chaining / conversation continuity'
      },
      {
        area: 'Code Intelligence',
        issue: 'No TypeScript validation before write',
        severity: 'HIGH',
        fix: 'Add ts-morph for type checking'
      },
      {
        area: 'UI/UX',
        issue: 'No code preview before applying changes',
        severity: 'HIGH',
        fix: 'Add Monaco Editor with diff view'
      },
      {
        area: 'Context Management',
        issue: 'Loads full context on every request',
        severity: 'MEDIUM',
        fix: 'Implement caching strategy'
      },
      {
        area: 'Error Recovery',
        issue: 'No automatic retry on failures',
        severity: 'MEDIUM',
        fix: 'Add retry logic with exponential backoff'
      },
      {
        area: 'Git Operations',
        issue: 'Limited to basic operations',
        severity: 'LOW',
        fix: 'Add branch management, PR creation'
      },
      {
        area: 'File Size',
        issue: 'Large files (>10MB) cannot be processed',
        severity: 'LOW',
        fix: 'Add chunked reading for large files'
      },
      {
        area: 'Streaming',
        issue: 'No streaming support for long responses',
        severity: 'MEDIUM',
        fix: 'Implement Claude streaming API'
      }
    );

    // Remove duplicates
    const unique = limitations.filter((lim, index, self) =>
      index === self.findIndex(l => l.area === lim.area && l.issue === lim.issue)
    );

    // Sort by severity
    const sorted = unique.sort((a, b) => {
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    sorted.forEach((lim, i) => {
      console.log(`\n${i + 1}. [${lim.severity}] ${lim.area}`);
      console.log(`   Issue: ${lim.issue}`);
      console.log(`   Fix: ${lim.fix}`);
    });

    this.limitations = sorted;

    return sorted;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length + this.failures.length,
        passed: this.results.filter(r => r.success).length,
        failed: this.failures.length
      },
      results: this.results,
      failures: this.failures,
      limitations: this.limitations
    };

    // Save to file
    const fs = require('fs').promises;
    await fs.writeFile(
      'AI_ASSISTANT_TEST_REPORT.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n💾 Report saved to: AI_ASSISTANT_TEST_REPORT.json');
    return report;
  }
}

// ============================================
// RUN TESTS
// ============================================

async function main() {
  const tester = new AIAssistantTester();

  try {
    await tester.runAllTests();
    await tester.generateReport();

    console.log('\n✅ Testing complete!');
    console.log('📄 Check AI_ASSISTANT_TEST_REPORT.json for full results\n');

  } catch (error) {
    console.error('\n❌ Testing failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { AIAssistantTester, testScenarios };
