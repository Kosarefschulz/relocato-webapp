import { Pool } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Helper function to verify JWT token
async function verifyToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Helper function to handle CORS
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Verify authentication
    const user = await verifyToken(req);
    
    switch (req.method) {
      case 'GET':
        // Get all quotes
        const customerId = req.query.customerId;
        
        let query, params;
        if (customerId) {
          query = `
            SELECT q.*, c.name as customer_name 
            FROM quotes q
            JOIN customers c ON q.customer_id = c.id
            WHERE c.firebase_id = $1 OR c.id::text = $1
            ORDER BY q.created_at DESC
          `;
          params = [customerId];
        } else {
          query = `
            SELECT q.*, c.name as customer_name 
            FROM quotes q
            JOIN customers c ON q.customer_id = c.id
            ORDER BY q.created_at DESC
          `;
          params = [];
        }
        
        const { rows } = await pool.query(query, params);
        
        // Transform database rows to match frontend format
        const quotes = rows.map(row => ({
          id: row.firebase_id || row.id,
          customerId: row.customer_id,
          customerName: row.customer_name,
          price: parseFloat(row.price),
          comment: row.comment,
          status: row.status,
          volume: row.volume ? parseFloat(row.volume) : undefined,
          distance: row.distance ? parseFloat(row.distance) : undefined,
          version: row.version,
          parentQuoteId: row.parent_quote_id,
          isLatestVersion: row.is_latest_version,
          templateId: row.template_id,
          templateName: row.template_name,
          createdAt: row.created_at,
          createdBy: row.created_by,
        }));
        
        return res.status(200).json(quotes);
        
      case 'POST':
        // Create new quote
        const quote = req.body;
        
        // Get customer ID from firebase_id
        const { rows: customerRows } = await pool.query(
          'SELECT id FROM customers WHERE firebase_id = $1 OR id::text = $1',
          [quote.customerId]
        );
        
        if (customerRows.length === 0) {
          return res.status(400).json({ error: 'Customer not found' });
        }
        
        const insertQuery = `
          INSERT INTO quotes (
            customer_id, price, comment, status,
            volume, distance, version, is_latest_version,
            template_id, template_name, created_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
          RETURNING *
        `;
        
        const values = [
          customerRows[0].id,
          quote.price,
          quote.comment,
          quote.status || 'draft',
          quote.volume,
          quote.distance,
          quote.version || 1,
          quote.isLatestVersion !== false,
          quote.templateId,
          quote.templateName,
          user.id,
        ];
        
        const { rows: [newQuote] } = await pool.query(insertQuery, values);
        
        return res.status(201).json({
          id: newQuote.id,
          ...quote,
        });
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    return res.status(500).json({ error: error.message });
  }
}