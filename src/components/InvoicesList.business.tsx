import React from 'react';
import { Typography, Box } from '@mui/material';

const InvoicesListBusiness: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Invoices</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        Business invoices list - Implementation pending
      </Typography>
    </Box>
  );
};

export default InvoicesListBusiness;