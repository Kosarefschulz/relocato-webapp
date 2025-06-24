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

// Initialize Firebase Admin with Application Default Credentials
let db: admin.firestore.Firestore;

async function initializeFirebase() {
  try {
    console.error('Initializing Firebase with Application Default Credentials...');
    
    // Use Application Default Credentials
    admin.initializeApp({
      projectId: 'umzugsapp'
    });
    
    db = admin.firestore();
    console.error('Firebase initialized successfully with ADC');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// Copy all the helper functions and handlers from the original index.ts
// ... (rest of the code remains the same as index.ts)

// Helper functions
function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned && !cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      cleaned = '+49' + cleaned.substring(1);
    } else if (cleaned.startsWith('49')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length >= 10) {
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
        name: 'test_connection',
        description: 'Test Firebase connection',
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
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    const { name } = request.params;

    switch (name) {
      case 'test_connection': {
        try {
          const testDoc = await db.collection('customers').limit(1).get();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Firebase connection successful',
                  documentsFound: testDoc.size
                }, null, 2)
              }
            ]
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: error.message,
                  code: error.code
                }, null, 2)
              }
            ]
          };
        }
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
    await initializeFirebase();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Relocato MCP server running on stdio (with ADC)');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();