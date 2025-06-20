import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databaseService } from '../config/database.config';
import { CircularProgress, Box, Alert } from '@mui/material';

/**
 * This component maps old Google Sheets customer IDs to Firebase IDs
 * Old format: K2025031142_HPMJV
 * Firebase format: auto-generated alphanumeric
 */
const CustomerIDMapper: React.FC = () => {
  const { customerId, id } = useParams<{ customerId?: string; id?: string }>();
  const navigate = useNavigate();
  const actualId = customerId || id;

  useEffect(() => {
    const mapCustomerId = async () => {
      if (!actualId) return;

      console.log('🔍 CustomerIDMapper: Checking ID format:', actualId);
      
      // Check if this looks like an old Google Sheets ID
      const isOldFormat = /^K\d{10}_[A-Z]{5}$/.test(actualId);
      
      if (isOldFormat) {
        console.log('📊 Old Google Sheets ID detected, searching for customer by customerNumber...');
        
        try {
          // Load all customers and find by customerNumber
          const customers = await databaseService.getCustomers();
          const customer = customers.find(c => 
            c.customerNumber === actualId || 
            c.id === actualId
          );
          
          if (customer && customer.id !== actualId) {
            console.log('✅ Found customer with Firebase ID:', customer.id);
            // Redirect to the correct Firebase ID
            navigate(`/customer-details/${customer.id}`, { replace: true });
          } else if (!customer) {
            console.error('❌ Customer not found with ID:', actualId);
          }
        } catch (error) {
          console.error('Error mapping customer ID:', error);
        }
      }
    };

    mapCustomerId();
  }, [actualId, navigate]);

  return (
    <Box sx={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      zIndex: 9999,
      backgroundColor: 'white',
      padding: 3,
      borderRadius: 2,
      boxShadow: 3
    }}>
      <CircularProgress />
      <Alert severity="info" sx={{ mt: 2 }}>
        Überprüfe Kunden-ID...
      </Alert>
    </Box>
  );
};

export default CustomerIDMapper;