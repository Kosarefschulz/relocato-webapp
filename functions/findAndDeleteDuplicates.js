const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Find and delete duplicate customers
 */
exports.findAndDeleteDuplicates = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
  })
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    console.log('🔍 Starting duplicate detection and deletion...');
    
    try {
      const db = admin.firestore();
      const action = req.body.action || 'find'; // 'find', 'delete', or 'merge'
      const checkBy = req.body.checkBy || 'name'; // 'name', 'email', 'phone', or 'all'
      
      // Find duplicates
      const duplicates = await findDuplicates(db, checkBy);
      
      if (action === 'find') {
        res.json({
          success: true,
          action: 'find',
          duplicateGroups: duplicates.length,
          totalDuplicates: duplicates.reduce((sum, group) => sum + group.duplicates.length, 0),
          duplicates: duplicates
        });
        return;
      }
      
      if (action === 'delete') {
        const deletionResults = await deleteDuplicates(db, duplicates);
        res.json({
          success: true,
          action: 'delete',
          ...deletionResults
        });
        return;
      }
      
      if (action === 'merge') {
        const mergeResults = await mergeDuplicates(db, duplicates);
        res.json({
          success: true,
          action: 'merge',
          ...mergeResults
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: 'Invalid action. Use "find", "delete", or "merge"'
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

async function findDuplicates(db, checkBy) {
  const duplicates = [];
  const processed = new Set();
  
  // Get all customers
  const customersSnapshot = await db.collection('customers')
    .orderBy('createdAt', 'desc')
    .get();
  
  const customers = customersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`🔍 Checking ${customers.length} customers for duplicates by ${checkBy}`);
  
  // Find duplicates
  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    if (processed.has(customer.id)) continue;
    
    const matches = [];
    
    for (let j = i + 1; j < customers.length; j++) {
      const otherCustomer = customers[j];
      let isDuplicate = false;
      let matchType = '';
      
      if (checkBy === 'all' || checkBy === 'name') {
        if (customer.name && customer.name === otherCustomer.name) {
          isDuplicate = true;
          matchType = 'name';
        }
      }
      
      if (!isDuplicate && (checkBy === 'all' || checkBy === 'email')) {
        if (customer.email && customer.email === otherCustomer.email) {
          isDuplicate = true;
          matchType = 'email';
        }
      }
      
      if (!isDuplicate && (checkBy === 'all' || checkBy === 'phone')) {
        if (customer.phone && customer.phone === otherCustomer.phone) {
          isDuplicate = true;
          matchType = 'phone';
        }
      }
      
      if (isDuplicate) {
        matches.push({
          id: otherCustomer.id,
          customerNumber: otherCustomer.customerNumber,
          name: otherCustomer.name,
          email: otherCustomer.email,
          phone: otherCustomer.phone,
          matchType: matchType,
          createdAt: otherCustomer.createdAt
        });
        processed.add(otherCustomer.id);
      }
    }
    
    if (matches.length > 0) {
      duplicates.push({
        primary: {
          id: customer.id,
          customerNumber: customer.customerNumber,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          createdAt: customer.createdAt
        },
        duplicates: matches
      });
      processed.add(customer.id);
    }
  }
  
  console.log(`✅ Found ${duplicates.length} duplicate groups`);
  return duplicates;
}

async function deleteDuplicates(db, duplicates) {
  const results = {
    deletedCustomers: 0,
    deletedQuotes: 0,
    deletedInvoices: 0,
    deletedEmails: 0,
    keptCustomers: [],
    deletedCustomersList: []
  };
  
  const batch = db.batch();
  let batchCount = 0;
  const maxBatchSize = 400;
  
  for (const group of duplicates) {
    // Keep the primary (oldest) customer
    results.keptCustomers.push({
      id: group.primary.id,
      customerNumber: group.primary.customerNumber,
      name: group.primary.name
    });
    
    // Delete all duplicates
    for (const duplicate of group.duplicates) {
      console.log(`🗑️ Deleting duplicate: ${duplicate.customerNumber} - ${duplicate.name}`);
      
      // Delete customer
      batch.delete(db.collection('customers').doc(duplicate.id));
      results.deletedCustomers++;
      results.deletedCustomersList.push({
        id: duplicate.id,
        customerNumber: duplicate.customerNumber,
        name: duplicate.name
      });
      
      // Delete associated quotes
      const quotesSnapshot = await db.collection('quotes')
        .where('customerId', '==', duplicate.id)
        .get();
      
      quotesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        results.deletedQuotes++;
      });
      
      // Delete associated invoices
      const invoicesSnapshot = await db.collection('invoices')
        .where('customerId', '==', duplicate.id)
        .get();
      
      invoicesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        results.deletedInvoices++;
      });
      
      // Delete email history
      const emailsSnapshot = await db.collection('emailHistory')
        .where('customerId', '==', duplicate.id)
        .get();
      
      emailsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        results.deletedEmails++;
      });
      
      batchCount++;
      
      // Commit batch if getting full
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        console.log(`✅ Committed batch of ${batchCount} operations`);
        batchCount = 0;
      }
    }
  }
  
  // Commit any remaining operations
  if (batchCount > 0) {
    await batch.commit();
    console.log(`✅ Committed final batch of ${batchCount} operations`);
  }
  
  console.log(`🎉 Deletion complete: ${results.deletedCustomers} customers deleted`);
  return results;
}

async function mergeDuplicates(db, duplicates) {
  const results = {
    mergedGroups: 0,
    totalMerged: 0,
    quotesTransferred: 0,
    invoicesTransferred: 0,
    emailsTransferred: 0,
    mergeDetails: []
  };
  
  for (const group of duplicates) {
    const primaryId = group.primary.id;
    const duplicateIds = group.duplicates.map(d => d.id);
    
    console.log(`🔄 Merging ${duplicateIds.length} duplicates into ${group.primary.customerNumber}`);
    
    await db.runTransaction(async (transaction) => {
      for (const duplicateId of duplicateIds) {
        // Transfer quotes
        const quotesSnapshot = await db.collection('quotes')
          .where('customerId', '==', duplicateId)
          .get();
        
        quotesSnapshot.docs.forEach(doc => {
          transaction.update(doc.ref, { 
            customerId: primaryId,
            mergedFrom: duplicateId,
            mergedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          results.quotesTransferred++;
        });
        
        // Transfer invoices
        const invoicesSnapshot = await db.collection('invoices')
          .where('customerId', '==', duplicateId)
          .get();
        
        invoicesSnapshot.docs.forEach(doc => {
          transaction.update(doc.ref, { 
            customerId: primaryId,
            mergedFrom: duplicateId,
            mergedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          results.invoicesTransferred++;
        });
        
        // Transfer emails
        const emailsSnapshot = await db.collection('emailHistory')
          .where('customerId', '==', duplicateId)
          .get();
        
        emailsSnapshot.docs.forEach(doc => {
          transaction.update(doc.ref, { 
            customerId: primaryId,
            mergedFrom: duplicateId,
            mergedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          results.emailsTransferred++;
        });
        
        // Delete duplicate customer
        transaction.delete(db.collection('customers').doc(duplicateId));
        results.totalMerged++;
      }
      
      // Update primary customer with merge info
      transaction.update(db.collection('customers').doc(primaryId), {
        mergedWith: duplicateIds,
        mergedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    results.mergedGroups++;
    results.mergeDetails.push({
      primary: group.primary,
      merged: group.duplicates.length
    });
  }
  
  console.log(`🎉 Merge complete: ${results.totalMerged} customers merged into ${results.mergedGroups} primary customers`);
  return results;
}