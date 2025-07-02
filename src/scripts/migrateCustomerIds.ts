/**
 * Migration script to fix customer ID mapping in quotes
 * This script analyzes quotes with customer numbers instead of Firebase IDs
 * and provides options to fix them
 */

import { databaseService } from '../config/database.config';
import { unifiedDatabaseService } from '../services/unifiedDatabaseService.optimized';

interface MigrationReport {
  totalQuotes: number;
  quotesWithCustomerNumber: number;
  quotesWithFirebaseId: number;
  quotesWithUnknownFormat: number;
  fixedQuotes: number;
  failedFixes: string[];
}

export async function analyzeQuoteCustomerIds(): Promise<MigrationReport> {
  console.log('🔍 === QUOTE CUSTOMER ID ANALYSIS ===');
  
  const report: MigrationReport = {
    totalQuotes: 0,
    quotesWithCustomerNumber: 0,
    quotesWithFirebaseId: 0,
    quotesWithUnknownFormat: 0,
    fixedQuotes: 0,
    failedFixes: []
  };
  
  try {
    // Load all data
    const [quotes, customers] = await Promise.all([
      databaseService.getQuotes(),
      databaseService.getCustomers()
    ]);
    
    report.totalQuotes = quotes.length;
    
    // Create customer lookup maps
    const customerById = new Map(customers.map(c => [c.id, c] as [string, any]));
    const customerByNumber = new Map(
      customers
        .map(c => [c.customerNumber, c] as [string | undefined, any])
        .filter((entry): entry is [string, any] => entry[0] !== undefined && entry[0] !== null)
    );
    
    console.log(`📊 Total Quotes: ${quotes.length}`);
    console.log(`👥 Total Customers: ${customers.length}`);
    console.log(`🔢 Customers with numbers: ${customerByNumber.size}`);
    
    // Analyze each quote
    const quotesToFix: Array<{ quote: any, correctCustomer: any }> = [];
    
    for (const quote of quotes) {
      const customerId = quote.customerId;
      
      if (!customerId) {
        report.quotesWithUnknownFormat++;
        continue;
      }
      
      // Check if it's a Firebase ID (20+ alphanumeric characters)
      if (customerId.match(/^[a-zA-Z0-9]{20,}$/)) {
        report.quotesWithFirebaseId++;
        // Check if customer exists
        if (!customerById.has(customerId)) {
          console.warn(`⚠️  Quote ${quote.id} has Firebase ID ${customerId} but customer not found`);
        }
      }
      // Check if it's a customer number (K followed by numbers)
      else if (customerId.match(/^K\d+$/)) {
        report.quotesWithCustomerNumber++;
        
        // Try to find the correct customer
        const customerByNum = customerByNumber.get(customerId);
        if (customerByNum) {
          quotesToFix.push({ quote, correctCustomer: customerByNum });
          console.log(`✅ Can fix: Quote ${quote.id} -> Customer ${customerByNum.id} (${customerId})`);
        } else {
          // Try robust search
          const foundCustomer = await unifiedDatabaseService.findCustomerByAnyIdentifier(
            customerId,
            { name: quote.customerName }
          );
          
          if (foundCustomer) {
            quotesToFix.push({ quote, correctCustomer: foundCustomer });
            console.log(`✅ Can fix via search: Quote ${quote.id} -> Customer ${foundCustomer.id}`);
          } else {
            console.error(`❌ Cannot fix: Quote ${quote.id} with customerId ${customerId} - customer not found`);
            report.failedFixes.push(quote.id);
          }
        }
      } else {
        report.quotesWithUnknownFormat++;
        console.warn(`⚠️  Quote ${quote.id} has unknown customer ID format: ${customerId}`);
      }
    }
    
    console.log('\n📊 Analysis Summary:');
    console.log(`  - Total Quotes: ${report.totalQuotes}`);
    console.log(`  - With Firebase IDs: ${report.quotesWithFirebaseId} (${(report.quotesWithFirebaseId/report.totalQuotes*100).toFixed(1)}%)`);
    console.log(`  - With Customer Numbers: ${report.quotesWithCustomerNumber} (${(report.quotesWithCustomerNumber/report.totalQuotes*100).toFixed(1)}%)`);
    console.log(`  - Unknown Format: ${report.quotesWithUnknownFormat}`);
    console.log(`  - Can be fixed: ${quotesToFix.length}`);
    console.log(`  - Cannot be fixed: ${report.failedFixes.length}`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  }
}

export async function migrateQuoteCustomerIds(dryRun = true): Promise<MigrationReport> {
  console.log(`\n🔧 === QUOTE CUSTOMER ID MIGRATION ${dryRun ? '(DRY RUN)' : '(LIVE)'} ===`);
  
  const report = await analyzeQuoteCustomerIds();
  
  if (!dryRun) {
    try {
      const [quotes, customers] = await Promise.all([
        databaseService.getQuotes(),
        databaseService.getCustomers()
      ]);
      
      const customerByNumber = new Map(customers.map(c => [c.customerNumber, c]).filter(([k]) => k));
      
      for (const quote of quotes) {
        if (quote.customerId?.match(/^K\d+$/)) {
          const correctCustomer = customerByNumber.get(quote.customerId) || 
            await unifiedDatabaseService.findCustomerByAnyIdentifier(
              quote.customerId,
              { name: quote.customerName }
            );
          
          if (correctCustomer) {
            console.log(`🔧 Fixing Quote ${quote.id}: ${quote.customerId} -> ${correctCustomer.id}`);
            
            const success = await databaseService.updateQuote(quote.id, {
              customerId: correctCustomer.id,
              customerNumber: quote.customerId // Preserve original customer number
            });
            
            if (success) {
              report.fixedQuotes++;
            } else {
              report.failedFixes.push(quote.id);
              console.error(`❌ Failed to update quote ${quote.id}`);
            }
          }
        }
      }
      
      console.log(`\n✅ Migration Complete: Fixed ${report.fixedQuotes} quotes`);
      if (report.failedFixes.length > 0) {
        console.log(`⚠️  Failed to fix ${report.failedFixes.length} quotes`);
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  return report;
}

// Usage instructions
console.log(`
📚 Usage Instructions:

1. To analyze quotes without making changes:
   import { analyzeQuoteCustomerIds } from './scripts/migrateCustomerIds';
   const report = await analyzeQuoteCustomerIds();

2. To perform a dry run (see what would be changed):
   import { migrateQuoteCustomerIds } from './scripts/migrateCustomerIds';
   const report = await migrateQuoteCustomerIds(true);

3. To perform the actual migration:
   import { migrateQuoteCustomerIds } from './scripts/migrateCustomerIds';
   const report = await migrateQuoteCustomerIds(false);

⚠️  IMPORTANT: Always run analysis or dry run first before actual migration!
`);