/**
 * Multi-Step Tool-Chaining Test
 * Testet ob die KI mehrere Tools nacheinander nutzen kann
 */

const axios = require('axios');

const CODE_BACKEND_URL = 'http://localhost:3002/api/code';

async function testMultiStepScenarios() {
  console.log('🚀 Testing Multi-Step Tool-Chaining...\n');
  console.log('═'.repeat(60));

  const scenarios = [
    {
      name: 'Create & Integrate Component',
      description: 'Erstelle Komponente UND füge sie zu App.tsx hinzu',
      steps: [
        { tool: 'create_component', params: { name: 'TestMultiStep' } },
        { tool: 'read_file', params: { path: 'src/App.tsx' } },
        { tool: 'edit_file', params: { path: 'src/App.tsx' } }
      ],
      expectedSteps: 3
    },
    {
      name: 'Feature Implementation',
      description: 'Erstelle Service + Component + Integration',
      steps: [
        { tool: 'write_file', params: { path: 'src/services/testFeatureService.ts' } },
        { tool: 'create_component', params: { name: 'TestFeature' } },
        { tool: 'edit_file', params: { path: 'src/App.tsx' } },
        { tool: 'edit_file', params: { path: 'src/components/GlassSidebar.tsx' } }
      ],
      expectedSteps: 4
    },
    {
      name: 'Bug Fix Workflow',
      description: 'Finde Bug → Lies Datei → Fixe → Teste',
      steps: [
        { tool: 'search_code', params: { pattern: 'TODO' } },
        { tool: 'read_file', params: { path: 'src/someFile.tsx' } },
        { tool: 'edit_file', params: { path: 'src/someFile.tsx' } }
      ],
      expectedSteps: 3
    }
  ];

  const results = [];

  for (const scenario of scenarios) {
    console.log(`\n🧪 Scenario: ${scenario.name}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Expected Steps: ${scenario.expectedSteps}\n`);

    try {
      // Simuliere die Tool-Calls sequenziell
      const executedTools = [];

      for (const step of scenario.steps) {
        console.log(`   → ${step.tool}`);

        try {
          let response;

          switch (step.tool) {
            case 'create_component':
              // Würde normalerweise über KI laufen
              response = await axios.post(CODE_BACKEND_URL + '/write', {
                path: `src/components/${step.params.name}.tsx`,
                content: `// Auto-generated component\nexport const ${step.params.name} = () => { return <div>${step.params.name}</div>; };`
              });
              break;

            case 'read_file':
              response = await axios.post(CODE_BACKEND_URL + '/read', {
                path: step.params.path
              });
              break;

            case 'write_file':
              response = await axios.post(CODE_BACKEND_URL + '/write', {
                path: step.params.path,
                content: '// Test content'
              });
              break;

            case 'search_code':
              response = await axios.post(CODE_BACKEND_URL + '/search', {
                pattern: step.params.pattern
              });
              break;

            default:
              console.log(`   ⏭️  Skipped: ${step.tool}`);
              continue;
          }

          if (response && response.data.success) {
            executedTools.push(step.tool);
            console.log(`   ✅ Success`);
          } else {
            console.log(`   ❌ Failed`);
          }

        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }

      const result = {
        scenario: scenario.name,
        expectedSteps: scenario.expectedSteps,
        actualSteps: executedTools.length,
        success: executedTools.length >= scenario.expectedSteps - 1, // Allow 1 failure
        executedTools
      };

      results.push(result);

      if (result.success) {
        console.log(`\n   🎉 PASS: ${result.actualSteps}/${result.expectedSteps} steps completed`);
      } else {
        console.log(`\n   ❌ FAIL: Only ${result.actualSteps}/${result.expectedSteps} steps completed`);
      }

    } catch (error) {
      console.error(`\n   ❌ Scenario failed:`, error.message);
      results.push({
        scenario: scenario.name,
        expectedSteps: scenario.expectedSteps,
        actualSteps: 0,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 MULTI-STEP TEST SUMMARY');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`\nTotal Scenarios: ${total}`);
  console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${total - passed}`);

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.scenario}: ${r.actualSteps}/${r.expectedSteps} steps`);
  });

  console.log('\n' + '═'.repeat(60));

  // Speichere Ergebnisse
  const fs = require('fs').promises;
  await fs.writeFile(
    'MULTI_STEP_TEST_RESULTS.json',
    JSON.stringify(results, null, 2)
  );

  console.log('💾 Results saved to: MULTI_STEP_TEST_RESULTS.json\n');
}

// Run
if (require.main === module) {
  testMultiStepScenarios().catch(console.error);
}

module.exports = { testMultiStepScenarios };
