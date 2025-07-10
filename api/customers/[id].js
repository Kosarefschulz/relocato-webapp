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
    const { id } = req.query;
    
    switch (req.method) {
      case 'GET':
        // Get single customer
        const { rows } = await pool.query(
          'SELECT * FROM customers WHERE id = $1',
          [id]
        );
        
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        const row = rows[0];
        const customer = {
          id: row.id,
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
        };
        
        return res.status(200).json(customer);
        
      case 'PUT':
        // Update customer
        const updates = req.body;
        
        const updateQuery = `
          UPDATE customers SET
            name = COALESCE($2, name),
            email = COALESCE($3, email),
            phone = COALESCE($4, phone),
            moving_date = COALESCE($5, moving_date),
            from_address = COALESCE($6, from_address),
            to_address = COALESCE($7, to_address),
            apartment_rooms = COALESCE($8, apartment_rooms),
            apartment_area = COALESCE($9, apartment_area),
            apartment_floor = COALESCE($10, apartment_floor),
            apartment_has_elevator = COALESCE($11, apartment_has_elevator),
            services = COALESCE($12, services),
            notes = COALESCE($13, notes),
            viewing_scheduled = COALESCE($14, viewing_scheduled),
            viewing_date = COALESCE($15, viewing_date),
            contacted = COALESCE($16, contacted),
            tags = COALESCE($17, tags),
            priority = COALESCE($18, priority),
            source = COALESCE($19, source),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;
        
        const values = [
          id,
          updates.name,
          updates.email,
          updates.phone,
          updates.movingDate,
          updates.fromAddress,
          updates.toAddress,
          updates.apartment?.rooms,
          updates.apartment?.area,
          updates.apartment?.floor,
          updates.apartment?.hasElevator,
          updates.services,
          updates.notes,
          updates.viewingScheduled,
          updates.viewingDate,
          updates.contacted,
          updates.tags,
          updates.priority,
          updates.source,
        ];
        
        const { rows: [updatedCustomer] } = await pool.query(updateQuery, values);
        
        if (!updatedCustomer) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        return res.status(200).json({ success: true });
        
      case 'DELETE':
        // Delete customer (only admins)
        if (user.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden' });
        }
        
        const { rowCount } = await pool.query(
          'DELETE FROM customers WHERE id = $1',
          [id]
        );
        
        if (rowCount === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        return res.status(200).json({ success: true });
        
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