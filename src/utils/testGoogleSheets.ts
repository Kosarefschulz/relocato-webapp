// Test Google Sheets API directly
export const testGoogleSheetsAPI = async () => {
  console.log('=== Testing Google Sheets API ===');
  
  const apiKey = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_ID;
  
  console.log('Config:', {
    apiKey: apiKey ? '✅ SET' : '❌ MISSING',
    spreadsheetId: spreadsheetId || '❌ MISSING'
  });
  
  if (!apiKey || !spreadsheetId) {
    console.error('Missing API configuration!');
    return;
  }
  
  try {
    // Test fetching customers
    const customerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Kunden!A:L?key=${apiKey}`;
    console.log('Fetching customers from:', customerUrl);
    
    const response = await fetch(customerUrl);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      
      // Check common errors
      if (response.status === 403) {
        console.error('❌ 403 Forbidden - Possible issues:');
        console.error('1. API Key restrictions (check allowed domains)');
        console.error('2. Google Sheets API not enabled');
        console.error('3. Sheet not shared publicly');
      } else if (response.status === 400) {
        console.error('❌ 400 Bad Request - Check spreadsheet ID and range');
      }
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    console.log('Number of rows:', data.values?.length || 0);
    
    if (data.values && data.values.length > 0) {
      console.log('First row (headers):', data.values[0]);
      console.log('Number of customers:', data.values.length - 1);
    }
    
    // Test quotes
    const quotesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Angebote!A:I?key=${apiKey}`;
    const quotesResponse = await fetch(quotesUrl);
    
    if (quotesResponse.ok) {
      const quotesData = await quotesResponse.json();
      console.log('✅ Quotes loaded:', quotesData.values?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
    console.error('Possible CORS issue or network problem');
  }
};

// Check if Google Sheets is accessible
export const checkGoogleSheetsAccess = async () => {
  const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_ID;
  
  if (!spreadsheetId) {
    console.error('No spreadsheet ID configured');
    return false;
  }
  
  // Try to access the spreadsheet metadata
  try {
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${process.env.REACT_APP_GOOGLE_SHEETS_API_KEY}`;
    const response = await fetch(metadataUrl);
    
    if (response.ok) {
      const metadata = await response.json();
      console.log('✅ Spreadsheet accessible:', metadata.properties.title);
      return true;
    } else {
      console.error('❌ Cannot access spreadsheet:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking spreadsheet:', error);
    return false;
  }
};

// Make available globally
(window as any).testSheets = testGoogleSheetsAPI;
(window as any).checkSheets = checkGoogleSheetsAccess;