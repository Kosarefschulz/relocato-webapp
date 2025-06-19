import React from 'react';
import { Customer } from '../types';

interface PlainTextCustomerInfoProps {
  customer: Customer | null;
}

const PlainTextCustomerInfo: React.FC<PlainTextCustomerInfoProps> = ({ customer }) => {
  if (!customer) {
    return (
      <pre style={{ backgroundColor: 'red', color: 'white', padding: '20px' }}>
        KEIN KUNDE GELADEN!
      </pre>
    );
  }

  return (
    <pre style={{ 
      backgroundColor: 'black', 
      color: 'lime', 
      padding: '20px', 
      fontFamily: 'monospace',
      fontSize: '16px',
      border: '5px solid yellow',
      position: 'relative',
      zIndex: 99999
    }}>
{`========== PLAIN TEXT CUSTOMER DATA ==========
ID: ${customer.id || 'NONE'}
Customer Number: ${customer.customerNumber || 'NONE'}
Name: ${customer.name || 'NONE'}
Phone: ${customer.phone || 'NONE'}
Email: ${customer.email || 'NONE'}
From: ${customer.fromAddress || 'NONE'}
To: ${customer.toAddress || 'NONE'}
Date: ${customer.movingDate || 'NONE'}
Rooms: ${customer.apartment?.rooms || 'NONE'}
Area: ${customer.apartment?.area || 'NONE'}
===========================================`}
    </pre>
  );
};

export default PlainTextCustomerInfo;