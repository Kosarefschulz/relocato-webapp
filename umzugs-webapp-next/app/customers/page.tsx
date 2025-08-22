'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CustomersPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to search-customer
    router.replace('/search-customer');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#e6eed6'
    }}>
      <h2 style={{ color: '#090c02' }}>Weiterleitung zur Kundensuche...</h2>
    </div>
  );
}