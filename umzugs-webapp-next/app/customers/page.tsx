'use client';

import { Box, Typography, Alert, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import Link from 'next/link';

export default function CustomersPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Kunden
        </Typography>
        <Button variant="contained" startIcon={<Add />}>
          Neuer Kunde
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Kundenverwaltung - Next.js 15.5 Migration erfolgreich!
      </Alert>
      
      <Link href="/dashboard">
        <Button variant="outlined">
          Zurück zum Dashboard
        </Button>
      </Link>
    </Box>
  );
}