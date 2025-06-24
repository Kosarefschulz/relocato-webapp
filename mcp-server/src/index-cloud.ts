import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import * as fs from 'fs/promises';

const CLOUD_FUNCTIONS_BASE = 'https://europe-west1-umzugsapp.cloudfunctions.net';

// Helper functions
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
      customer.phone = phoneMatch[1].trim();
    }
    
    // Email
    const emailMatch = line.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) {
      customer.email = emailMatch[0].toLowerCase();
    }
    
    // Addresses
    if (lowerLine.includes('von:') || lowerLine.includes('from:')) {
      customer.fromAddress = line.split(/[:=]/)[1]?.trim() || '';
    }
    
    if (lowerLine.includes('nach:') || lowerLine.includes('to:')) {
      customer.toAddress = line.split(/[:=]/)[1]?.trim() || '';
    }
    
    // Date patterns
    const dateMatch = line.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
    if (dateMatch && (lowerLine.includes('datum') || lowerLine.includes('termin'))) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];
      if (year.length === 2) year = '20' + year;
      customer.moveDate = `${day}.${month}.${year}`;
    }
    
    // Area
    const areaMatch = line.match(/(\d+)\s*(?:m²|qm|m2)/i);
    if (areaMatch) {
      customer.apartment.area = parseInt(areaMatch[1]);
    }
    
    // Rooms
    const roomMatch = line.match(/(\d+)\s*(?:zimmer|zi\.|raum|räume)/i);
    if (roomMatch) {
      customer.apartment.rooms = parseInt(roomMatch[1]);
    }
  }
  
  customer.notes += `\n\nOriginal Text:\n${text}`;
  
  return customer;
}

// Create MCP server
const server = new Server(
  {
    name: 'relocato-cloud',
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
        name: 'create_customer_from_text',
        description: 'Create a customer from text data',
        inputSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Text containing customer data' }
          },
          required: ['text']
        }
      },
      {
        name: 'create_customer_from_image',
        description: 'Extract customer data from an image and create customer',
        inputSchema: {
          type: 'object',
          properties: {
            imagePath: { type: 'string', description: 'Path to the image file' }
          },
          required: ['imagePath']
        }
      },
      {
        name: 'import_from_google_sheets',
        description: 'Import customers from Google Sheets',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'fix_phone_numbers',
        description: 'Fix all phone numbers in the database',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    if (!args) {
      throw new Error('No arguments provided');
    }

    switch (name) {
      case 'create_customer_from_text': {
        const text = String(args.text || '');
        const customer = parseCustomerDataFromText(text);
        
        // Create a CSV format for Google Sheets import
        const csvData = `Contact Name,Phone,Email,WhatsApp,From Address,To Address,Move Date,Living Area,Rooms,Floor,Has Elevator,Notes
"${customer.name}","${customer.phone}","${customer.email}","${customer.phone}","${customer.fromAddress}","${customer.toAddress}","${customer.moveDate}","${customer.apartment.area}","${customer.apartment.rooms}","${customer.apartment.floor}","${customer.apartment.hasElevator}","${customer.notes}"`;
        
        // Call Google Sheets import function
        const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/importFromGoogleSheets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvData })
        });
        
        const result = await response.json();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: (result as any).success,
                message: `Customer created from text`,
                customer: customer,
                importResult: result
              }, null, 2)
            }
          ]
        };
      }

      case 'create_customer_from_image': {
        const imagePath = String(args.imagePath || '');
        
        // Extract text from image
        const text = await extractTextFromImage(imagePath);
        const customer = parseCustomerDataFromText(text);
        
        // Create a CSV format for Google Sheets import
        const csvData = `Contact Name,Phone,Email,WhatsApp,From Address,To Address,Move Date,Living Area,Rooms,Floor,Has Elevator,Notes
"${customer.name}","${customer.phone}","${customer.email}","${customer.phone}","${customer.fromAddress}","${customer.toAddress}","${customer.moveDate}","${customer.apartment.area}","${customer.apartment.rooms}","${customer.apartment.floor}","${customer.apartment.hasElevator}","${customer.notes}"`;
        
        // Call Google Sheets import function
        const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/importFromGoogleSheets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvData })
        });
        
        const result = await response.json();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: (result as any).success,
                message: `Customer created from image`,
                extractedText: text.substring(0, 200) + '...',
                customer: customer,
                importResult: result
              }, null, 2)
            }
          ]
        };
      }

      case 'import_from_google_sheets': {
        const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/importFromGoogleSheets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        const result = await response.json();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'fix_phone_numbers': {
        const response = await fetch(`${CLOUD_FUNCTIONS_BASE}/fixPhoneNumbers`, {
          method: 'GET'
        });
        
        const result = await response.json();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: (result as any).success,
                message: (result as any).message,
                fixed: (result as any).fixed,
                total: (result as any).totalCustomers
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
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Relocato Cloud MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();