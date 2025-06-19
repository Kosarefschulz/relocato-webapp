import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { databaseService } from '../config/database.config';

const CustomerDataTester: React.FC = () => {
  const { customerId, id } = useParams<{ customerId?: string; id?: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  const actualId = customerId || id;

  useEffect(() => {
    const testDataLoading = async () => {
      console.log('🔍 CustomerDataTester started');
      console.log('Params:', { customerId, id, actualId });
      
      try {
        // Test 1: Direct console log
        console.log('Test 1: URL params', window.location.pathname);
        
        // Test 2: Try to load customers
        console.log('Test 2: Loading customers...');
        const customers = await databaseService.getCustomers();
        console.log('All customers:', customers);
        
        // Test 3: Find specific customer
        const customer = customers.find(c => c.id === actualId);
        console.log('Found customer:', customer);
        
        setData({
          actualId,
          customerCount: customers.length,
          customer,
          allIds: customers.map(c => c.id)
        });
      } catch (err) {
        console.error('Error:', err);
        setError(String(err));
      }
    };
    
    testDataLoading();
  }, [actualId, customerId, id]);

  // Ultra-simple HTML without any styling frameworks
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'yellow',
      color: 'black',
      padding: '20px',
      border: '3px solid red',
      zIndex: 99999,
      maxWidth: '400px',
      fontSize: '14px',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: 'red', margin: '0 0 10px 0' }}>🚨 DATA TESTER</h2>
      
      <div style={{ backgroundColor: 'white', padding: '10px', marginBottom: '10px' }}>
        <strong>URL Path:</strong> {window.location.pathname}
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '10px', marginBottom: '10px' }}>
        <strong>Customer ID:</strong> {actualId || 'NONE'}
      </div>
      
      {error && (
        <div style={{ backgroundColor: 'red', color: 'white', padding: '10px', marginBottom: '10px' }}>
          <strong>ERROR:</strong> {error}
        </div>
      )}
      
      {data && (
        <>
          <div style={{ backgroundColor: 'white', padding: '10px', marginBottom: '10px' }}>
            <strong>Total Customers:</strong> {data.customerCount}
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '10px', marginBottom: '10px' }}>
            <strong>Customer Found:</strong> {data.customer ? 'YES' : 'NO'}
          </div>
          
          {data.customer && (
            <div style={{ backgroundColor: 'lightgreen', padding: '10px', marginBottom: '10px' }}>
              <strong>Customer Data:</strong><br/>
              Name: {data.customer.name}<br/>
              Phone: {data.customer.phone}<br/>
              Email: {data.customer.email}
            </div>
          )}
          
          <details>
            <summary style={{ cursor: 'pointer', backgroundColor: 'lightblue', padding: '5px' }}>
              All Customer IDs ({data.allIds?.length || 0})
            </summary>
            <div style={{ backgroundColor: 'white', padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
              {data.allIds?.map((id: string) => (
                <div key={id} style={{ color: id === actualId ? 'red' : 'black' }}>
                  {id} {id === actualId && '← CURRENT'}
                </div>
              ))}
            </div>
          </details>
        </>
      )}
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: 'gray' }}>
        Check browser console for more details
      </div>
    </div>
  );
};

export default CustomerDataTester;