const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

/**
 * Import customers from Google Sheets to Firebase
 */
exports.importFromGoogleSheets = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    console.log('📊 Starting Google Sheets import...');
    
    try {
      const db = admin.firestore();
      const result = await importCustomersFromSheets(db);
      
      res.json({
        success: true,
        message: 'Import completed',
        ...result
      });
    } catch (error) {
      console.error('❌ Import error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

async function importCustomersFromSheets(db) {
  const spreadsheetId = '178tpFCNqmnDZxkzOfgWQCS6BW7wn2rYyTB3hZh8H7PU';
  const stats = {
    totalRows: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0
  };
  
  try {
    // Try multiple methods to access the sheet
    const methods = [
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`,
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`,
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=0`
    ];
    
    let csvText = null;
    
    for (const url of methods) {
      try {
        console.log('🔄 Trying URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'text/csv, text/plain, */*'
          }
        });
        
        if (response.ok) {
          const text = await response.text();
          
          if (text && !text.includes('<HTML>') && !text.includes('Temporary Redirect')) {
            csvText = text;
            console.log('✅ Successfully fetched CSV data');
            break;
          }
        }
      } catch (fetchError) {
        console.log('⚠️ Method failed:', fetchError.message);
        continue;
      }
    }
    
    if (!csvText) {
      throw new Error('Could not fetch data from Google Sheets');
    }
    
    // Parse CSV
    const customers = parseCSVToCustomers(csvText);
    stats.totalRows = customers.length;
    
    console.log(`📋 Found ${customers.length} rows in Google Sheets`);
    
    // Import each customer
    for (const customer of customers) {
      try {
        // Skip if no name
        if (!customer.name || customer.name === 'Unbekannt' || customer.name === 'Kontakt Name') {
          stats.skipped++;
          continue;
        }
        
        // Check for duplicate by email or phone
        let isDuplicate = false;
        
        if (customer.email) {
          const emailCheck = await db.collection('customers')
            .where('email', '==', customer.email)
            .limit(1)
            .get();
          
          if (!emailCheck.empty) {
            isDuplicate = true;
          }
        }
        
        if (!isDuplicate && customer.phone) {
          const phoneCheck = await db.collection('customers')
            .where('phone', '==', customer.phone)
            .limit(1)
            .get();
          
          if (!phoneCheck.empty) {
            isDuplicate = true;
          }
        }
        
        if (isDuplicate) {
          console.log(`⚠️ Duplicate customer: ${customer.name}`);
          stats.duplicates++;
          continue;
        }
        
        // Generate customer number
        customer.customerNumber = await generateCustomerNumber(db);
        customer.id = customer.customerNumber;
        
        // Save to Firebase
        await db.collection('customers').doc(customer.id).set({
          ...customer,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          importedFrom: 'google-sheets',
          importDate: new Date()
        });
        
        // Create automatic quote
        await createAutomaticQuote(customer, db);
        
        console.log(`✅ Imported: ${customer.customerNumber} - ${customer.name}`);
        stats.imported++;
        
      } catch (error) {
        console.error(`❌ Error importing customer:`, error.message);
        stats.errors++;
      }
    }
    
    console.log(`\n🎉 Import completed:
    - Total rows: ${stats.totalRows}
    - Imported: ${stats.imported}
    - Duplicates: ${stats.duplicates}
    - Skipped: ${stats.skipped}
    - Errors: ${stats.errors}`);
    
    return stats;
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

function parseCSVToCustomers(csvText) {
  const lines = csvText.split('\n');
  
  if (lines.length <= 1) {
    console.warn('⚠️ No data rows found in CSV');
    return [];
  }
  
  // Skip header row
  const dataLines = lines.slice(1).filter(line => line.trim() !== '');
  
  return dataLines.map((line, index) => {
    const columns = parseCSVLine(line);
    
    // Mapping of columns:
    // 0: Kontakt Name
    // 1: Kontakt Telefon  
    // 2: Kontakt Email
    // 3: Whatsapp
    // 4: Von Adresse
    // 5: Von Etage
    // 6: Von Flaeche M2
    // 7: Nach Adresse
    // 8: Nach Etage
    // 9: Umzugstag
    // 10: Eingang
    // 11: Quelle
    // 12: Datum/Zeit
    // 13: Nachricht gesendet
    
    return {
      name: columns[0] || `Kunde ${index + 1}`,
      phone: cleanPhoneNumber(columns[1]) || '',
      email: columns[2] || '',
      whatsapp: cleanPhoneNumber(columns[3]) || '',
      fromAddress: columns[4] || '',
      fromFloor: parseNumber(columns[5]) || 0,
      toAddress: columns[7] || '',
      toFloor: parseNumber(columns[8]) || 0,
      moveDate: columns[9] || '',
      movingDate: columns[9] || '',
      apartment: {
        rooms: 3, // Default
        area: parseNumber(columns[6]) || 60,
        floor: parseNumber(columns[5]) || 0,
        hasElevator: false
      },
      services: ['Umzug'],
      source: columns[11] || 'Google Sheets',
      notes: [
        columns[11] ? `Quelle: ${columns[11]}` : '',
        columns[10] ? `Eingang: ${columns[10]}` : '',
        columns[12] ? `Datum: ${columns[12]}` : '',
        columns[13] ? `Nachricht: ${columns[13]}` : ''
      ].filter(Boolean).join(', ')
    };
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with country code
  if (cleaned && !cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      cleaned = '+49' + cleaned.substring(1);
    } else {
      cleaned = '+49' + cleaned;
    }
  }
  
  return cleaned;
}

function parseNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

async function generateCustomerNumber(db) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const counterRef = db.collection('counters').doc(`customers_${year}_${month}`);
  
  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let counter = 1;
    if (doc.exists) {
      counter = (doc.data().value || 0) + 1;
    }
    
    transaction.set(counterRef, { value: counter });
    
    return `K${year}${month}${String(counter).padStart(3, '0')}`;
  });
}

async function createAutomaticQuote(customer, db) {
  const basePrice = 450;
  const pricePerRoom = 150;
  const pricePerSqm = 8;
  const pricePerFloor = 50;
  
  let price = basePrice;
  
  if (customer.apartment?.rooms) {
    price += customer.apartment.rooms * pricePerRoom;
  }
  
  if (customer.apartment?.area) {
    price += customer.apartment.area * pricePerSqm;
  }
  
  if (customer.apartment?.floor > 0 && !customer.apartment?.hasElevator) {
    price += customer.apartment.floor * pricePerFloor;
  }
  
  const volume = (customer.apartment?.rooms || 3) * 12;
  const quoteId = `Q${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const quote = {
    id: quoteId,
    customerId: customer.id,
    customerName: customer.name,
    price: Math.round(price),
    status: 'draft',
    comment: `Automatisch erstelltes Angebot basierend auf Google Sheets Import.`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'google-sheets-import',
    volume: volume,
    distance: 25,
    moveDate: customer.moveDate,
    fromAddress: customer.fromAddress,
    toAddress: customer.toAddress,
    services: customer.services || ['Umzug']
  };
  
  await db.collection('quotes').doc(quoteId).set(quote);
  
  return quote;
}