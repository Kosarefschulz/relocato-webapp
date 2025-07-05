/**
 * Test script to validate customer mapping functionality
 * Run this to ensure the robust customer search is working correctly
 */

import { unifiedDatabaseService } from '../services/unifiedDatabaseService';
import { databaseService } from '../config/database.config';

interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  details?: any;
}

export async function testCustomerMapping(): Promise<TestResult[]> {
  console.log('🧪 === CUSTOMER MAPPING TESTS ===\n');
  
  const results: TestResult[] = [];
  
  try {
    // Load test data
    const [customers, quotes] = await Promise.all([
      databaseService.getCustomers(),
      databaseService.getQuotes()
    ]);
    
    // Test 1: Direct ID lookup
    console.log('Test 1: Direct ID lookup');
    if (customers.length > 0) {
      const testCustomer = customers[0];
      const found = await unifiedDatabaseService.getCustomer(testCustomer.id);
      results.push({
        testName: 'Direct ID lookup',
        success: found?.id === testCustomer.id,
        message: found ? `✅ Found customer ${found.name}` : '❌ Customer not found',
        details: { searchId: testCustomer.id, found: found?.id }
      });
    }
    
    // Test 2: Customer number lookup
    console.log('\nTest 2: Customer number lookup');
    const customerWithNumber = customers.find(c => c.customerNumber);
    if (customerWithNumber) {
      const found = await unifiedDatabaseService.getCustomer(customerWithNumber.customerNumber!);
      results.push({
        testName: 'Customer number lookup',
        success: found?.id === customerWithNumber.id,
        message: found ? `✅ Found customer ${found.name} by number` : '❌ Customer not found by number',
        details: { searchNumber: customerWithNumber.customerNumber, found: found?.id }
      });
    }
    
    // Test 3: Robust search with partial match
    console.log('\nTest 3: Robust search with partial match');
    if (customerWithNumber?.customerNumber) {
      const partialNumber = customerWithNumber.customerNumber.slice(-6);
      const found = await unifiedDatabaseService.getCustomer(partialNumber);
      results.push({
        testName: 'Partial number search',
        success: found?.id === customerWithNumber.id,
        message: found ? `✅ Found customer by partial number` : '❌ Customer not found by partial',
        details: { searchPartial: partialNumber, found: found?.id }
      });
    }
    
    // Test 4: Name-based search
    console.log('\nTest 4: Name-based search');
    if (customers.length > 0) {
      const testCustomer = customers[0];
      const searchResults = await unifiedDatabaseService.searchCustomers(testCustomer.name);
      const found = searchResults && searchResults.length > 0 ? searchResults[0] : null;
      results.push({
        testName: 'Name-based search',
        success: found?.id === testCustomer.id,
        message: found ? `✅ Found customer by name` : '❌ Customer not found by name',
        details: { searchName: testCustomer.name, found: found?.name }
      });
    }
    
    // Test 5: Quote customer mapping
    console.log('\nTest 5: Quote customer mapping');
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted' || q.status === 'confirmed');
    let mappingSuccesses = 0;
    let mappingFailures = 0;
    
    for (const quote of acceptedQuotes.slice(0, 5)) { // Test first 5
      let customer = await unifiedDatabaseService.getCustomer(quote.customerId);
      
      // If not found by ID, try searching by name
      if (!customer && quote.customerName) {
        const searchResults = await unifiedDatabaseService.searchCustomers(quote.customerName);
        if (searchResults && searchResults.length > 0) {
          customer = searchResults[0];
        }
      }
      
      if (customer) {
        mappingSuccesses++;
      } else {
        mappingFailures++;
        console.log(`  ❌ Failed to map quote ${quote.id} with customerId: ${quote.customerId}`);
      }
    }
    
    results.push({
      testName: 'Quote customer mapping',
      success: mappingFailures === 0,
      message: `Mapped ${mappingSuccesses}/${mappingSuccesses + mappingFailures} quotes successfully`,
      details: { successes: mappingSuccesses, failures: mappingFailures }
    });
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    
    let totalPassed = 0;
    results.forEach(result => {
      console.log(`${result.success ? '✅' : '❌'} ${result.testName}: ${result.message}`);
      if (result.success) totalPassed++;
    });
    
    console.log(`\n🎯 Total: ${totalPassed}/${results.length} tests passed`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    throw error;
  }
}

// Run specific customer lookup test
export async function testSpecificCustomerLookup(identifier: string): Promise<void> {
  console.log(`\n🔍 Testing lookup for: "${identifier}"`);
  
  try {
    // Method 1: Direct getCustomer
    console.log('\n1. Using getCustomer():');
    const direct = await unifiedDatabaseService.getCustomer(identifier);
    if (direct) {
      console.log(`  ✅ Found: ${direct.name} (ID: ${direct.id}, Number: ${direct.customerNumber || 'N/A'})`);
    } else {
      console.log('  ❌ Not found');
    }
    
    // Method 2: getCustomer (also handles customer numbers)
    console.log('\n2. Using getCustomer() with customer number:');
    const byIdOrNumber = await unifiedDatabaseService.getCustomer(identifier);
    if (byIdOrNumber) {
      console.log(`  ✅ Found: ${byIdOrNumber.name} (ID: ${byIdOrNumber.id})`);
    } else {
      console.log('  ❌ Not found');
    }
    
    // Method 3: getCustomer
    console.log('\n3. Using getCustomer():');
    const robust = await unifiedDatabaseService.getCustomer(identifier);
    if (robust) {
      console.log(`  ✅ Found: ${robust.name} (ID: ${robust.id})`);
    } else {
      console.log('  ❌ Not found');
    }
    
  } catch (error) {
    console.error('❌ Lookup failed:', error);
  }
}

// Usage
console.log(`
🧪 Test Usage:

1. Run all tests:
   import { testCustomerMapping } from './scripts/testCustomerMapping';
   await testCustomerMapping();

2. Test specific customer lookup:
   import { testSpecificCustomerLookup } from './scripts/testCustomerMapping';
   await testSpecificCustomerLookup('K2025061711');
`);