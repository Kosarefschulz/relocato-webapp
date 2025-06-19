import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Customer } from '../types';

interface CustomerInfoDebugProps {
  customer: Customer;
}

const CustomerInfoDebug: React.FC<CustomerInfoDebugProps> = ({ customer }) => {
  return (
    <Paper sx={{ p: 3, mb: 2, backgroundColor: '#ffffff', color: '#000000' }}>
      <Typography variant="h5" sx={{ color: '#000000', mb: 2 }}>
        Debug: Kundendaten (Hardcoded Colors)
      </Typography>
      
      <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
        <Typography sx={{ color: '#000000', fontSize: '16px', fontWeight: 'bold' }}>
          Name: <span style={{ color: '#1976d2' }}>{customer.name || 'Kein Name'}</span>
        </Typography>
      </Box>
      
      <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
        <Typography sx={{ color: '#000000', fontSize: '16px', fontWeight: 'bold' }}>
          Telefon: <span style={{ color: '#1976d2' }}>{customer.phone || 'Keine Telefonnummer'}</span>
        </Typography>
      </Box>
      
      <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
        <Typography sx={{ color: '#000000', fontSize: '16px', fontWeight: 'bold' }}>
          E-Mail: <span style={{ color: '#1976d2' }}>{customer.email || 'Keine E-Mail'}</span>
        </Typography>
      </Box>
      
      <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
        <Typography sx={{ color: '#000000', fontSize: '16px', fontWeight: 'bold' }}>
          Von: <span style={{ color: '#1976d2' }}>{customer.fromAddress || 'Keine Startadresse'}</span>
        </Typography>
      </Box>
      
      <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
        <Typography sx={{ color: '#000000', fontSize: '16px', fontWeight: 'bold' }}>
          Nach: <span style={{ color: '#1976d2' }}>{customer.toAddress || 'Keine Zieladresse'}</span>
        </Typography>
      </Box>
      
      <Box sx={{ backgroundColor: '#ffeb3b', p: 2, borderRadius: 1, color: '#000000' }}>
        <Typography sx={{ color: '#000000', fontSize: '14px' }}>
          Kunden-ID: {customer.id}
        </Typography>
        <Typography sx={{ color: '#000000', fontSize: '14px' }}>
          Raw Data: {JSON.stringify(customer, null, 2).substring(0, 200)}...
        </Typography>
      </Box>
    </Paper>
  );
};

export default CustomerInfoDebug;