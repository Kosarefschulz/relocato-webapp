/**
 * Utility to analyze customer mapping issues
 * Run this in the console to understand the data structure
 */

export async function analyzeCustomerMapping(googleSheetsService: any) {
  console.log('🔍 === CUSTOMER MAPPING ANALYSIS ===');
  
  try {
    // Load all data
    const [customers, quotes] = await Promise.all([
      googleSheetsService.getCustomers(),
      googleSheetsService.getQuotes()
    ]);
    
    console.log(`📊 Total Customers: ${customers.length}`);
    console.log(`📊 Total Quotes: ${quotes.length}`);
    
    // Analyze customer ID formats
    const customerIdFormats = {
      firebaseIds: [] as string[],
      customerNumbers: [] as string[],
      other: [] as string[]
    };
    
    customers.forEach((c: any) => {
      if (c.id?.match(/^[a-zA-Z0-9]{20,}/)) {
        customerIdFormats.firebaseIds.push(c.id);
      } else if (c.customerNumber?.startsWith('K')) {
        customerIdFormats.customerNumbers.push(c.customerNumber);
      } else {
        customerIdFormats.other.push(c.id || 'NO_ID');
      }
    });
    
    console.log('\n📋 Customer ID Formats:');
    console.log(`  - Firebase IDs: ${customerIdFormats.firebaseIds.length} (e.g., ${customerIdFormats.firebaseIds[0]?.substring(0, 10)}...)`);
    console.log(`  - Customer Numbers: ${customerIdFormats.customerNumbers.length} (e.g., ${customerIdFormats.customerNumbers[0]})`);
    console.log(`  - Other: ${customerIdFormats.other.length}`);
    
    // Analyze quote customerIds
    const quoteCustomerIds = quotes.map((q: any) => q.customerId).filter((id: any): id is string => Boolean(id));
    const uniqueQuoteCustomerIds: string[] = [...new Set(quoteCustomerIds)];
    
    console.log('\n📋 Quote Customer IDs:');
    console.log(`  - Total: ${quoteCustomerIds.length}`);
    console.log(`  - Unique: ${uniqueQuoteCustomerIds.length}`);
    console.log(`  - Examples: ${uniqueQuoteCustomerIds.slice(0, 5).join(', ')}`);
    
    // Check mapping success rate
    let mappingSuccess = 0;
    let mappingFailures = [] as any[];
    
    for (const quote of quotes.slice(0, 20)) { // Check first 20 quotes
      const customer = customers.find((c: any) => 
        c.id === quote.customerId || 
        c.customerNumber === quote.customerId
      );
      
      if (customer) {
        mappingSuccess++;
      } else {
        mappingFailures.push({
          quoteId: quote.id,
          customerId: quote.customerId,
          customerName: quote.customerName
        });
      }
    }
    
    console.log('\n📊 Mapping Analysis (first 20 quotes):');
    console.log(`  - Success: ${mappingSuccess}/20 (${(mappingSuccess/20*100).toFixed(1)}%)`);
    console.log(`  - Failures: ${mappingFailures.length}`);
    
    if (mappingFailures.length > 0) {
      console.log('\n❌ Failed Mappings:');
      mappingFailures.slice(0, 5).forEach(f => {
        console.log(`  - Quote ${f.quoteId}: customerId="${f.customerId}", name="${f.customerName || 'N/A'}"`);
      });
    }
    
    // Suggest fixes
    console.log('\n💡 Suggested Fixes:');
    
    // Check if quotes use customer numbers but customers only have Firebase IDs
    const sampleQuoteId = uniqueQuoteCustomerIds[0] as string | undefined;
    const isCustomerNumber = sampleQuoteId?.startsWith('K');
    const hasFirebaseIds = customerIdFormats.firebaseIds.length > 0;
    
    if (isCustomerNumber && hasFirebaseIds) {
      console.log('  ⚠️  Quotes use customer numbers (K...) but customers have Firebase IDs');
      console.log('  ✅ Solution: Map quotes to customers using customerNumber field');
    }
    
    // Check for missing customerNumber field
    const customersWithoutNumber = customers.filter((c: any) => !c.customerNumber).length;
    if (customersWithoutNumber > 0) {
      console.log(`  ⚠️  ${customersWithoutNumber} customers missing customerNumber field`);
      console.log('  ✅ Solution: Ensure all customers have customerNumber field populated');
    }
    
    return {
      customers: customers.length,
      quotes: quotes.length,
      mappingSuccessRate: (mappingSuccess / 20 * 100).toFixed(1) + '%',
      issues: mappingFailures
    };
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return null;
  }
}

// Usage in console:
// import { analyzeCustomerMapping } from './utils/analyzeCustomerMapping';
// import { databaseService } from './config/database.config';
// analyzeCustomerMapping(databaseService);