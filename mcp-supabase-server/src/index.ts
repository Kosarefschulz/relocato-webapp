import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://kmxipuaqierjqaikuimi.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Optional for admin operations

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// Helper function to generate customer number
function generateCustomerNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RS-${timestamp}-${random}`;
}

// Create MCP server
const server = new Server(
  {
    name: 'mcp-supabase-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'test-connection',
        description: 'Test the connection to Supabase',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list-customers',
        description: 'List all customers from Supabase',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of customers to return',
              default: 100,
            },
            offset: {
              type: 'number',
              description: 'Number of customers to skip',
              default: 0,
            },
          },
        },
      },
      {
        name: 'count-customers',
        description: 'Get the total count of customers',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get-customer',
        description: 'Get a specific customer by ID or customer number',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Customer ID or customer number',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'search-customers',
        description: 'Search customers by name, email, or phone',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'import-customers-csv',
        description: 'Import customers from a CSV file',
        inputSchema: {
          type: 'object',
          properties: {
            csvPath: {
              type: 'string',
              description: 'Path to the CSV file',
            },
          },
          required: ['csvPath'],
        },
      },
      {
        name: 'create-customer',
        description: 'Create a new customer',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Customer name',
            },
            email: {
              type: 'string',
              description: 'Customer email',
            },
            phone: {
              type: 'string',
              description: 'Customer phone',
            },
            from_address: {
              type: 'string',
              description: 'Moving from address',
            },
            to_address: {
              type: 'string',
              description: 'Moving to address',
            },
            notes: {
              type: 'string',
              description: 'Additional notes',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'delete-all-customers',
        description: 'Delete all customers (use with caution!)',
        inputSchema: {
          type: 'object',
          properties: {
            confirm: {
              type: 'boolean',
              description: 'Confirm deletion of all customers',
            },
          },
          required: ['confirm'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'test-connection': {
        const { data, error } = await supabase
          .from('customers')
          .select('id')
          .limit(1);

        if (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Connection failed: ${error.message}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ Successfully connected to Supabase!\nURL: ${supabaseUrl}\nDatabase is accessible`,
            },
          ],
        };
      }

      case 'list-customers': {
        const limit = (args?.limit as number) || 100;
        const offset = (args?.offset as number) || 0;

        const { data, error, count } = await supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`Failed to fetch customers: ${error.message}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: count,
                  returned: data?.length || 0,
                  customers: data || [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'count-customers': {
        const { count, error } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });

        if (error) {
          throw new Error(`Failed to count customers: ${error.message}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Total customers in database: ${count || 0}`,
            },
          ],
        };
      }

      case 'get-customer': {
        const id = args?.id;
        if (!id) {
          throw new Error('Customer ID is required');
        }

        // Try to find by ID first
        let { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();

        // If not found, try by customer_number
        if (!data) {
          const result = await supabase
            .from('customers')
            .select('*')
            .eq('customer_number', id)
            .single();
          data = result.data;
          error = result.error;
        }

        if (error) {
          throw new Error(`Customer not found: ${error.message}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'search-customers': {
        const query = args?.query;
        if (!query) {
          throw new Error('Search query is required');
        }

        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Search failed: ${error.message}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  found: data?.length || 0,
                  customers: data || [],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'import-customers-csv': {
        const csvPath = args?.csvPath as string;
        if (!csvPath) {
          throw new Error('CSV file path is required');
        }

        const csvContent = await fs.readFile(csvPath, 'utf-8');
        const records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });

        const customers = records.map((row: any) => {
          const firstName = row['First Name'] || '';
          const lastName = row['Last Name'] || '';
          const fullName = `${firstName} ${lastName}`.trim() || row['Account Name'] || 'Unbekannt';

          return {
            customer_number: generateCustomerNumber(),
            name: fullName,
            email: (row['Email'] || '').toLowerCase(),
            phone: row['Phone'] || '',
            from_address: 'Noch nicht angegeben',
            to_address: 'Noch nicht angegeben',
            moving_date: null,
            apartment: 0,
            services: ['Umzug'],
            sales_status: 'lead',
            status: 'active',
            is_deleted: false,
            notes: row['Description'] || '',
            source: 'CSV Import - Zoho CRM',
          };
        });

        // Import in batches
        const batchSize = 50;
        let imported = 0;
        let failed = 0;

        for (let i = 0; i < customers.length; i += batchSize) {
          const batch = customers.slice(i, i + batchSize);
          const { error } = await supabase.from('customers').insert(batch);

          if (error) {
            console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
            failed += batch.length;
          } else {
            imported += batch.length;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: `Import complete:\n✅ Successfully imported: ${imported}\n❌ Failed: ${failed}\n📊 Total processed: ${customers.length}`,
            },
          ],
        };
      }

      case 'create-customer': {
        const customerData = {
          customer_number: generateCustomerNumber(),
          name: args?.name || 'Unbekannt',
          email: args?.email || '',
          phone: args?.phone || '',
          from_address: args?.from_address || 'Noch nicht angegeben',
          to_address: args?.to_address || 'Noch nicht angegeben',
          apartment: 0,
          services: ['Umzug'],
          sales_status: 'lead',
          status: 'active',
          is_deleted: false,
          notes: args?.notes || '',
          source: 'MCP Server',
        };

        const { data, error } = await supabase
          .from('customers')
          .insert([customerData])
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create customer: ${error.message}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: `Customer created successfully:\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'delete-all-customers': {
        if (args?.confirm !== true) {
          throw new Error('Confirmation required to delete all customers');
        }

        const { error } = await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          throw new Error(`Failed to delete customers: ${error.message}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: '⚠️ All customers have been deleted',
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Start the server
async function main() {
  console.error('Starting MCP Supabase Server...');
  console.error(`Supabase URL: ${supabaseUrl}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Supabase Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});