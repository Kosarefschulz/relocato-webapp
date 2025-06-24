import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
let db: admin.firestore.Firestore;

async function initializeFirebase() {
  try {
    // Try multiple paths for service account
    let serviceAccount;
    const possiblePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      path.join(process.cwd(), '..', 'serviceAccountKey.json'),
      path.join(process.cwd(), 'serviceAccountKey.json'),
      '/Users/sergejschulz/Desktop/main/umzugs-webapp/serviceAccountKey.json'
    ].filter(Boolean);
    
    for (const accountPath of possiblePaths) {
      try {
        serviceAccount = JSON.parse(await fs.readFile(accountPath!, 'utf8'));
        console.error(`Found service account at: ${accountPath}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!serviceAccount) {
      throw new Error('Service account not found in any of the expected locations');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    db = admin.firestore();
    console.error('Firebase initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// Helper functions
function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with country code
  if (cleaned && !cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      // German number starting with 0
      cleaned = '+49' + cleaned.substring(1);
    } else if (cleaned.startsWith('49')) {
      // Already has German country code, just add +
      cleaned = '+' + cleaned;
    } else if (cleaned.length >= 10) {
      // Other number without country code
      cleaned = '+49' + cleaned;
    }
  }
  
  return cleaned;
}

async function generateCustomerNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const counterRef = db.collection('counters').doc(`customers_${year}_${month}`);
  
  return await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(counterRef);
    
    let counter = 1;
    if (doc.exists) {
      counter = (doc.data()?.value || 0) + 1;
    }
    
    transaction.set(counterRef, { value: counter });
    
    return `K${year}${month}${String(counter).padStart(3, '0')}`;
  });
}

async function createAutomaticQuote(customer: any): Promise<any> {
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
    comment: `Automatisch erstelltes Angebot über MCP.\n\nKunde: ${customer.name}\nUmzugstermin: ${customer.moveDate || 'Noch offen'}\nVon: ${customer.fromAddress || 'N/A'}\nNach: ${customer.toAddress || 'N/A'}`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'mcp-server',
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

async function extractTextFromImage(imagePath: string): Promise<string> {
  const worker = await createWorker('deu+eng');
  const { data: { text } } = await worker.recognize(imagePath);
  await worker.terminate();
  return text;
}

function parseCustomerDataFromText(text: string): any {
  const customer: any = {
    name: '',
    phone: '',
    email: '',
    fromAddress: '',
    toAddress: '',
    moveDate: '',
    apartment: {
      rooms: 3,
      area: 60,
      floor: 0,
      hasElevator: false
    },
    services: ['Umzug'],
    source: 'MCP Image Import',
    notes: 'Importiert über MCP aus Bild'
  };

  const lines = text.split('\n');
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Name patterns
    if (lowerLine.includes('name:') || lowerLine.includes('kunde:')) {
      customer.name = line.split(/[:=]/)[1]?.trim() || '';
    }
    
    // Phone patterns
    const phoneMatch = line.match(/(?:tel|telefon|handy|mobil)[\s:]*([+\d\s\-\/\(\)]+)/i);
    if (phoneMatch) {
      customer.phone = cleanPhoneNumber(phoneMatch[1]);
    } else {
      // Look for phone pattern anywhere
      const phoneInLine = line.match(/(\+?[\d\s\-\/\(\)]{10,})/);
      if (phoneInLine) {
        const cleaned = cleanPhoneNumber(phoneInLine[1]);
        if (cleaned.length >= 10) customer.phone = cleaned;
      }
    }
    
    // Email
    const emailMatch = line.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) {
      customer.email = emailMatch[0].toLowerCase();
    }
    
    // Addresses
    if (lowerLine.includes('von:') || lowerLine.includes('from:') || 
        lowerLine.includes('auszug:') || lowerLine.includes('abholadresse:')) {
      customer.fromAddress = line.split(/[:=]/)[1]?.trim() || '';
    }
    
    if (lowerLine.includes('nach:') || lowerLine.includes('to:') || 
        lowerLine.includes('einzug:') || lowerLine.includes('lieferadresse:')) {
      customer.toAddress = line.split(/[:=]/)[1]?.trim() || '';
    }
    
    // Date patterns
    const dateMatch = line.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
    if (dateMatch && (lowerLine.includes('datum') || lowerLine.includes('termin') || lowerLine.includes('umzug'))) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 2) year = '20' + year;
      customer.moveDate = `${day}.${month}.${year}`;
    }
    
    // Area
    const areaMatch = line.match(/(\d+)\s*(?:m²|qm|m2|quadratmeter)/i);
    if (areaMatch) {
      customer.apartment.area = parseInt(areaMatch[1]);
    }
    
    // Rooms
    const roomMatch = line.match(/(\d+)\s*(?:zimmer|zi\.|raum|räume|zkb|zkdb)/i);
    if (roomMatch) {
      customer.apartment.rooms = parseInt(roomMatch[1]);
    }
    
    // Floor
    const floorMatch = line.match(/(\d+)\.\s*(?:etage|stock|og|obergeschoss|eg|erdgeschoss)/i);
    if (floorMatch) {
      customer.apartment.floor = parseInt(floorMatch[1]);
    } else if (lowerLine.includes('erdgeschoss') || lowerLine.includes('eg')) {
      customer.apartment.floor = 0;
    }
    
    // Elevator
    if (lowerLine.includes('aufzug') || lowerLine.includes('fahrstuhl') || lowerLine.includes('lift')) {
      customer.apartment.hasElevator = true;
    }
  }
  
  // Add full text to notes for reference
  customer.notes += `\n\nOriginal Text:\n${text}`;
  
  return customer;
}

// Create MCP server
const server = new Server(
  {
    name: 'relocato-firebase',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_customer',
        description: 'Create a new customer in Firebase',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer name' },
            phone: { type: 'string', description: 'Phone number' },
            email: { type: 'string', description: 'Email address' },
            fromAddress: { type: 'string', description: 'Moving from address' },
            toAddress: { type: 'string', description: 'Moving to address' },
            moveDate: { type: 'string', description: 'Move date' },
            rooms: { type: 'number', description: 'Number of rooms' },
            area: { type: 'number', description: 'Area in m²' },
            floor: { type: 'number', description: 'Floor number' },
            hasElevator: { type: 'boolean', description: 'Has elevator' },
            notes: { type: 'string', description: 'Additional notes' }
          },
          required: ['name']
        }
      },
      {
        name: 'create_customer_from_image',
        description: 'Extract customer data from an image and create customer in Firebase',
        inputSchema: {
          type: 'object',
          properties: {
            imagePath: { type: 'string', description: 'Path to the image file' }
          },
          required: ['imagePath']
        }
      },
      {
        name: 'list_customers',
        description: 'List customers from Firebase',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of customers to return (default: 10)' },
            startAfter: { type: 'string', description: 'Customer ID to start after for pagination' }
          }
        }
      },
      {
        name: 'search_customers',
        description: 'Search customers by name, phone, or email',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            field: { 
              type: 'string', 
              enum: ['name', 'phone', 'email'],
              description: 'Field to search in' 
            }
          },
          required: ['query', 'field']
        }
      },
      {
        name: 'get_customer',
        description: 'Get a specific customer by ID',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: { type: 'string', description: 'Customer ID' }
          },
          required: ['customerId']
        }
      },
      {
        name: 'update_customer',
        description: 'Update customer information',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: { type: 'string', description: 'Customer ID' },
            updates: { 
              type: 'object',
              description: 'Fields to update'
            }
          },
          required: ['customerId', 'updates']
        }
      },
      {
        name: 'add_document_to_customer',
        description: 'Add a document/image to an existing customer by analyzing the image to find matching customer',
        inputSchema: {
          type: 'object',
          properties: {
            imagePath: { type: 'string', description: 'Path to the document/image' },
            documentType: { 
              type: 'string', 
              enum: ['invoice', 'quote', 'contract', 'id', 'other'],
              description: 'Type of document' 
            }
          },
          required: ['imagePath']
        }
      },
      {
        name: 'find_customer_from_image',
        description: 'Find existing customer by analyzing text in image (name, phone, email)',
        inputSchema: {
          type: 'object',
          properties: {
            imagePath: { type: 'string', description: 'Path to the image' }
          },
          required: ['imagePath']
        }
      },
      {
        name: 'delete_customer',
        description: 'Delete a customer and all associated data (quotes, invoices)',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: { type: 'string', description: 'Customer ID to delete' },
            confirm: { type: 'boolean', description: 'Confirm deletion (must be true)' }
          },
          required: ['customerId', 'confirm']
        }
      },
      {
        name: 'find_duplicate_customers',
        description: 'Find duplicate customers in the database',
        inputSchema: {
          type: 'object',
          properties: {
            checkBy: { 
              type: 'string', 
              enum: ['name', 'email', 'phone', 'all'],
              description: 'What to check for duplicates' 
            }
          }
        }
      },
      {
        name: 'merge_customers',
        description: 'Merge duplicate customers into one',
        inputSchema: {
          type: 'object',
          properties: {
            primaryCustomerId: { type: 'string', description: 'Customer ID to keep' },
            duplicateCustomerIds: { 
              type: 'array',
              items: { type: 'string' },
              description: 'Customer IDs to merge into primary' 
            }
          },
          required: ['primaryCustomerId', 'duplicateCustomerIds']
        }
      }
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const { name, arguments: args } = request.params;
    
    if (!args) {
      throw new Error('No arguments provided');
    }

    switch (name) {
      case 'create_customer': {
        const customer: any = {
          name: String(args.name || ''),
          phone: cleanPhoneNumber(String(args.phone || '')),
          email: String(args.email || ''),
          fromAddress: String(args.fromAddress || ''),
          toAddress: String(args.toAddress || ''),
          moveDate: String(args.moveDate || ''),
          apartment: {
            rooms: Number(args.rooms) || 3,
            area: Number(args.area) || 60,
            floor: Number(args.floor) || 0,
            hasElevator: Boolean(args.hasElevator) || false
          },
          services: ['Umzug'],
          source: 'MCP',
          notes: String(args.notes || ''),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Generate customer number
        customer.customerNumber = await generateCustomerNumber();
        customer.id = customer.customerNumber;

        // Save to Firebase
        await db.collection('customers').doc(customer.id).set(customer);

        // Create automatic quote
        const quote = await createAutomaticQuote(customer);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                customer: {
                  id: customer.id,
                  customerNumber: customer.customerNumber,
                  name: customer.name
                },
                quote: {
                  id: quote.id,
                  price: quote.price
                },
                message: `Customer ${customer.customerNumber} created successfully with quote ${quote.id}`
              }, null, 2)
            }
          ]
        };
      }

      case 'create_customer_from_image': {
        const imagePath = String(args.imagePath || '');
        
        // Extract text from image
        const text = await extractTextFromImage(imagePath);
        
        // Parse customer data
        const customerData = parseCustomerDataFromText(text);
        
        if (!customerData.name || customerData.name === '') {
          throw new Error('Could not extract customer name from image');
        }

        // Generate customer number
        customerData.customerNumber = await generateCustomerNumber();
        customerData.id = customerData.customerNumber;
        customerData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        customerData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        // Save to Firebase
        await db.collection('customers').doc(customerData.id).set(customerData);

        // Create automatic quote
        const quote = await createAutomaticQuote(customerData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                extractedData: {
                  name: customerData.name,
                  phone: customerData.phone,
                  email: customerData.email,
                  fromAddress: customerData.fromAddress,
                  toAddress: customerData.toAddress,
                  moveDate: customerData.moveDate
                },
                customer: {
                  id: customerData.id,
                  customerNumber: customerData.customerNumber
                },
                quote: {
                  id: quote.id,
                  price: quote.price
                },
                message: `Customer ${customerData.customerNumber} created from image with quote ${quote.id}`
              }, null, 2)
            }
          ]
        };
      }

      case 'list_customers': {
        const limit = Number(args.limit) || 10;
        let query = db.collection('customers')
          .orderBy('createdAt', 'desc')
          .limit(limit);

        if (args.startAfter) {
          const startAfterDoc = await db.collection('customers').doc(String(args.startAfter)).get();
          if (startAfterDoc.exists) {
            query = query.startAfter(startAfterDoc);
          }
        }

        const snapshot = await query.get();
        const customers = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customerNumber: data.customerNumber || '',
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            moveDate: data.moveDate || '',
            ...data
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: customers.length,
                customers: customers.map(c => ({
                  id: c.id,
                  customerNumber: c.customerNumber,
                  name: c.name,
                  phone: c.phone,
                  email: c.email,
                  moveDate: c.moveDate
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'search_customers': {
        const query = String(args.query || '');
        const field = String(args.field || 'name');
        
        const snapshot = await db.collection('customers')
          .where(field, '>=', query)
          .where(field, '<=', query + '\uf8ff')
          .limit(20)
          .get();

        const customers = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customerNumber: data.customerNumber || '',
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            ...data
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: customers.length,
                query: query,
                field: field,
                customers: customers.map(c => ({
                  id: c.id,
                  customerNumber: c.customerNumber,
                  name: c.name,
                  phone: c.phone,
                  email: c.email
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'get_customer': {
        const customerId = String(args.customerId || '');
        const doc = await db.collection('customers').doc(customerId).get();
        
        if (!doc.exists) {
          throw new Error(`Customer ${customerId} not found`);
        }

        const customer = { id: doc.id, ...doc.data() };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                customer: customer
              }, null, 2)
            }
          ]
        };
      }

      case 'update_customer': {
        const customerId = String(args.customerId || '');
        const updates: any = args.updates || {};
        
        // Add updated timestamp
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        
        // Clean phone numbers if provided
        if (updates.phone) {
          updates.phone = cleanPhoneNumber(updates.phone);
        }
        if (updates.whatsapp) {
          updates.whatsapp = cleanPhoneNumber(updates.whatsapp);
        }

        await db.collection('customers').doc(customerId).update(updates);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Customer ${customerId} updated successfully`,
                updates: updates
              }, null, 2)
            }
          ]
        };
      }

      case 'find_customer_from_image': {
        const imagePath = String(args.imagePath || '');
        
        // Extract text from image
        const text = await extractTextFromImage(imagePath);
        
        // Look for identifying information
        const identifiers = {
          name: '',
          phone: '',
          email: '',
          customerNumber: ''
        };
        
        // Extract potential matches
        const lines = text.split('\n');
        for (const line of lines) {
          // Customer number pattern (K + year + month + number)
          const customerNumberMatch = line.match(/K\d{8}/);
          if (customerNumberMatch) {
            identifiers.customerNumber = customerNumberMatch[0];
          }
          
          // Email
          const emailMatch = line.match(/[\w\.-]+@[\w\.-]+\.\w+/);
          if (emailMatch) {
            identifiers.email = emailMatch[0].toLowerCase();
          }
          
          // Phone
          const phoneMatch = line.match(/(?:\+49|0)\s*[\d\s\-\/\(\)]{10,}/);
          if (phoneMatch) {
            identifiers.phone = cleanPhoneNumber(phoneMatch[0]);
          }
          
          // Name patterns (look for common patterns)
          if (line.includes('Kunde:') || line.includes('Name:') || line.includes('Herr') || line.includes('Frau')) {
            const nameMatch = line.match(/(?:Kunde:|Name:|Herr|Frau)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)/);
            if (nameMatch) {
              identifiers.name = nameMatch[1].trim();
            }
          }
        }
        
        // Search for matching customers
        const matches = [];
        
        // Search by customer number (most accurate)
        if (identifiers.customerNumber) {
          const doc = await db.collection('customers').doc(identifiers.customerNumber).get();
          if (doc.exists) {
            matches.push({ 
              confidence: 100, 
              matchType: 'customerNumber',
              customer: { id: doc.id, ...doc.data() } 
            });
          }
        }
        
        // Search by email
        if (identifiers.email && matches.length === 0) {
          const emailQuery = await db.collection('customers')
            .where('email', '==', identifiers.email)
            .limit(1)
            .get();
          
          if (!emailQuery.empty) {
            const customer = { id: emailQuery.docs[0].id, ...emailQuery.docs[0].data() };
            matches.push({ 
              confidence: 90, 
              matchType: 'email',
              customer 
            });
          }
        }
        
        // Search by phone
        if (identifiers.phone && matches.length === 0) {
          const phoneQuery = await db.collection('customers')
            .where('phone', '==', identifiers.phone)
            .limit(1)
            .get();
          
          if (!phoneQuery.empty) {
            const customer = { id: phoneQuery.docs[0].id, ...phoneQuery.docs[0].data() };
            matches.push({ 
              confidence: 85, 
              matchType: 'phone',
              customer 
            });
          }
        }
        
        // Search by name (least accurate)
        if (identifiers.name && matches.length === 0) {
          const nameQuery = await db.collection('customers')
            .where('name', '>=', identifiers.name)
            .where('name', '<=', identifiers.name + '\uf8ff')
            .limit(5)
            .get();
          
          nameQuery.docs.forEach(doc => {
            const customer = { id: doc.id, ...doc.data() } as any;
            const similarity = customer.name?.toLowerCase().includes(identifiers.name.toLowerCase()) ? 70 : 50;
            matches.push({ 
              confidence: similarity, 
              matchType: 'name',
              customer 
            });
          });
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                identifiersFound: identifiers,
                matchesFound: matches.length,
                matches: matches.map(m => ({
                  confidence: m.confidence,
                  matchType: m.matchType,
                  customer: {
                    id: m.customer.id,
                    customerNumber: (m.customer as any).customerNumber,
                    name: (m.customer as any).name,
                    phone: (m.customer as any).phone,
                    email: (m.customer as any).email
                  }
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'add_document_to_customer': {
        const imagePath = String(args.imagePath || '');
        const documentType = String(args.documentType || 'other');
        
        // First, find the customer from the image
        const text = await extractTextFromImage(imagePath);
        
        // Use the same logic as find_customer_from_image to identify the customer
        let customerId = null;
        let customerData = null;
        
        // Look for customer number first (most reliable)
        const customerNumberMatch = text.match(/K\d{8}/);
        if (customerNumberMatch) {
          const doc = await db.collection('customers').doc(customerNumberMatch[0]).get();
          if (doc.exists) {
            customerId = doc.id;
            customerData = doc.data();
          }
        }
        
        // If not found by number, try email
        if (!customerId) {
          const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
          if (emailMatch) {
            const emailQuery = await db.collection('customers')
              .where('email', '==', emailMatch[0].toLowerCase())
              .limit(1)
              .get();
            
            if (!emailQuery.empty) {
              customerId = emailQuery.docs[0].id;
              customerData = emailQuery.docs[0].data();
            }
          }
        }
        
        if (!customerId) {
          throw new Error('Could not identify customer from document. Please use find_customer_from_image first.');
        }
        
        // Extract additional information from the document
        const documentInfo: any = {
          type: documentType,
          extractedText: text.substring(0, 500), // First 500 chars
          addedAt: admin.firestore.FieldValue.serverTimestamp(),
          addedBy: 'mcp-server'
        };
        
        // Look for specific information based on document type
        if (documentType === 'invoice' || documentType === 'quote') {
          // Look for amount
          const amountMatch = text.match(/(?:Total|Gesamt|Betrag|Summe)[\s:]*(?:€\s*)?([\d.,]+)\s*€?/i);
          if (amountMatch) {
            documentInfo.amount = parseFloat(amountMatch[1].replace(',', '.'));
          }
          
          // Look for date
          const dateMatch = text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
          if (dateMatch) {
            documentInfo.date = dateMatch[0];
          }
          
          // Look for invoice/quote number
          const numberMatch = text.match(/(?:Rechnung|Invoice|Angebot|Quote)[\s-]*(?:Nr|Number|#)?[\s:]*(\w+)/i);
          if (numberMatch) {
            documentInfo.documentNumber = numberMatch[1];
          }
        }
        
        // Add document reference to customer
        const documents = customerData?.documents || [];
        documents.push({
          ...documentInfo,
          imagePath: imagePath // Store reference to original image
        });
        
        // Update customer with new document
        await db.collection('customers').doc(customerId).update({
          documents: documents,
          lastDocumentAdded: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Document added to customer ${customerData?.customerNumber}`,
                customer: {
                  id: customerId,
                  customerNumber: customerData?.customerNumber,
                  name: customerData?.name
                },
                document: documentInfo
              }, null, 2)
            }
          ]
        };
      }

      case 'delete_customer': {
        const customerId = String(args.customerId || '');
        const confirm = Boolean(args.confirm);
        
        if (!confirm) {
          throw new Error('Deletion must be confirmed with confirm: true');
        }
        
        // Get customer data first
        const customerDoc = await db.collection('customers').doc(customerId).get();
        if (!customerDoc.exists) {
          throw new Error(`Customer ${customerId} not found`);
        }
        
        const customerData = customerDoc.data();
        
        // Delete in transaction to ensure consistency
        await db.runTransaction(async (transaction) => {
          // Delete customer
          transaction.delete(db.collection('customers').doc(customerId));
          
          // Delete associated quotes
          const quotesSnapshot = await db.collection('quotes')
            .where('customerId', '==', customerId)
            .get();
          
          quotesSnapshot.docs.forEach(doc => {
            transaction.delete(doc.ref);
          });
          
          // Delete associated invoices
          const invoicesSnapshot = await db.collection('invoices')
            .where('customerId', '==', customerId)
            .get();
          
          invoicesSnapshot.docs.forEach(doc => {
            transaction.delete(doc.ref);
          });
          
          // Delete email history
          const emailsSnapshot = await db.collection('emailHistory')
            .where('customerId', '==', customerId)
            .get();
          
          emailsSnapshot.docs.forEach(doc => {
            transaction.delete(doc.ref);
          });
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Customer ${customerId} and all associated data deleted`,
                deletedCustomer: {
                  id: customerId,
                  customerNumber: customerData?.customerNumber,
                  name: customerData?.name
                }
              }, null, 2)
            }
          ]
        };
      }

      case 'find_duplicate_customers': {
        const checkBy = String(args.checkBy || 'all');
        const duplicates: any[] = [];
        const processed = new Set<string>();
        
        // Get all customers
        const customersSnapshot = await db.collection('customers')
          .orderBy('createdAt', 'desc')
          .get();
        
        const customers = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
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
              if ((customer as any).name && (customer as any).name === (otherCustomer as any).name) {
                isDuplicate = true;
                matchType = 'name';
              }
            }
            
            if (!isDuplicate && (checkBy === 'all' || checkBy === 'email')) {
              if ((customer as any).email && (customer as any).email === (otherCustomer as any).email) {
                isDuplicate = true;
                matchType = 'email';
              }
            }
            
            if (!isDuplicate && (checkBy === 'all' || checkBy === 'phone')) {
              if ((customer as any).phone && (customer as any).phone === (otherCustomer as any).phone) {
                isDuplicate = true;
                matchType = 'phone';
              }
            }
            
            if (isDuplicate) {
              matches.push({
                id: otherCustomer.id,
                customerNumber: (otherCustomer as any).customerNumber,
                name: (otherCustomer as any).name,
                matchType: matchType,
                createdAt: (otherCustomer as any).createdAt
              });
              processed.add(otherCustomer.id);
            }
          }
          
          if (matches.length > 0) {
            duplicates.push({
              primary: {
                id: customer.id,
                customerNumber: (customer as any).customerNumber,
                name: (customer as any).name,
                email: (customer as any).email,
                phone: (customer as any).phone,
                createdAt: (customer as any).createdAt
              },
              duplicates: matches
            });
            processed.add(customer.id);
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                duplicateGroups: duplicates.length,
                totalDuplicates: duplicates.reduce((sum, group) => sum + group.duplicates.length, 0),
                duplicates: duplicates
              }, null, 2)
            }
          ]
        };
      }

      case 'merge_customers': {
        const primaryCustomerId = String(args.primaryCustomerId || '');
        const duplicateCustomerIds = args.duplicateCustomerIds as string[] || [];
        
        if (duplicateCustomerIds.length === 0) {
          throw new Error('No duplicate customer IDs provided');
        }
        
        // Get primary customer
        const primaryDoc = await db.collection('customers').doc(primaryCustomerId).get();
        if (!primaryDoc.exists) {
          throw new Error(`Primary customer ${primaryCustomerId} not found`);
        }
        
        const mergedData = {
          quotesTransferred: 0,
          invoicesTransferred: 0,
          emailsTransferred: 0,
          customersDeleted: []
        };
        
        // Merge in transaction
        await db.runTransaction(async (transaction) => {
          for (const duplicateId of duplicateCustomerIds) {
            // Transfer quotes
            const quotesSnapshot = await db.collection('quotes')
              .where('customerId', '==', duplicateId)
              .get();
            
            quotesSnapshot.docs.forEach(doc => {
              transaction.update(doc.ref, { 
                customerId: primaryCustomerId,
                mergedFrom: duplicateId,
                mergedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              mergedData.quotesTransferred++;
            });
            
            // Transfer invoices
            const invoicesSnapshot = await db.collection('invoices')
              .where('customerId', '==', duplicateId)
              .get();
            
            invoicesSnapshot.docs.forEach(doc => {
              transaction.update(doc.ref, { 
                customerId: primaryCustomerId,
                mergedFrom: duplicateId,
                mergedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              mergedData.invoicesTransferred++;
            });
            
            // Transfer emails
            const emailsSnapshot = await db.collection('emailHistory')
              .where('customerId', '==', duplicateId)
              .get();
            
            emailsSnapshot.docs.forEach(doc => {
              transaction.update(doc.ref, { 
                customerId: primaryCustomerId,
                mergedFrom: duplicateId,
                mergedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              mergedData.emailsTransferred++;
            });
            
            // Delete duplicate customer
            transaction.delete(db.collection('customers').doc(duplicateId));
            (mergedData.customersDeleted as string[]).push(duplicateId);
          }
          
          // Update primary customer with merge info
          transaction.update(db.collection('customers').doc(primaryCustomerId), {
            mergedWith: duplicateCustomerIds,
            mergedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Merged ${duplicateCustomerIds.length} duplicates into ${primaryCustomerId}`,
                primaryCustomer: primaryCustomerId,
                ...mergedData
              }, null, 2)
            }
          ]
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      error.message
    );
  }
});

// Main function
async function main() {
  try {
    // Initialize Firebase first
    await initializeFirebase();
    
    // Create and run server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Relocato MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();