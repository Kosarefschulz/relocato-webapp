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
        // Get all customers or search
        const searchQuery = req.query.q;
        
        let query, params;
        if (searchQuery) {
          query = `
            SELECT * FROM customers 
            WHERE name ILIKE $1 
               OR email ILIKE $1 
               OR phone ILIKE $1 
               OR customer_number ILIKE $1
            ORDER BY created_at DESC
          `;
          params = [`%${searchQuery}%`];
        } else {
          query = 'SELECT * FROM customers ORDER BY created_at DESC';
          params = [];
        }
        
        const { rows } = await pool.query(query, params);
        
        // Transform database rows to match frontend format
        const customers = rows.map(row => ({
          id: row.firebase_id || row.id,
          customerNumber: row.customer_number,
          name: row.name,
          email: row.email,
          phone: row.phone,
          movingDate: row.moving_date,
          fromAddress: row.from_address,
          toAddress: row.to_address,
          apartment: {
            rooms: row.apartment_rooms,
            area: row.apartment_area,
            floor: row.apartment_floor,
            hasElevator: row.apartment_has_elevator,
          },
          services: row.services || [],
          notes: row.notes,
          viewingScheduled: row.viewing_scheduled,
          viewingDate: row.viewing_date,
          contacted: row.contacted,
          tags: row.tags || [],
          priority: row.priority,
          source: row.source,
          createdAt: row.created_at,
        }));
        
        return res.status(200).json(customers);
        
      case 'POST':
        // Create new customer
        const customer = req.body;
        
        const insertQuery = `
          INSERT INTO customers (
            customer_number, name, email, phone,
            moving_date, from_address, to_address,
            apartment_rooms, apartment_area, apartment_floor, apartment_has_elevator,
            services, notes, viewing_scheduled, viewing_date, contacted,
            tags, priority, source
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17, $18, $19
          )
          RETURNING *
        `;
        
        const values = [
          customer.customerNumber || `CUST-${Date.now()}`,
          customer.name,
          customer.email,
          customer.phone,
          customer.movingDate,
          customer.fromAddress,
          customer.toAddress,
          customer.apartment?.rooms,
          customer.apartment?.area,
          customer.apartment?.floor,
          customer.apartment?.hasElevator,
          customer.services || [],
          customer.notes,
          customer.viewingScheduled || false,
          customer.viewingDate,
          customer.contacted || false,
          customer.tags || [],
          customer.priority || 'medium',
          customer.source,
        ];
        
        const { rows: [newCustomer] } = await pool.query(insertQuery, values);
        
        return res.status(201).json({
          id: newCustomer.id,
          ...customer,
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