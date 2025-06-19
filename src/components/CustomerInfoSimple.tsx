import React from 'react';
import { Customer } from '../types';

interface CustomerInfoSimpleProps {
  customer: Customer;
}

const CustomerInfoSimple: React.FC<CustomerInfoSimpleProps> = ({ customer }) => {
  const containerStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const titleStyle: React.CSSProperties = {
    color: '#000000',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    display: 'block'
  };

  const rowStyle: React.CSSProperties = {
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  };

  const labelStyle: React.CSSProperties = {
    color: '#666666',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'inline-block',
    width: '120px'
  };

  const valueStyle: React.CSSProperties = {
    color: '#000000',
    fontSize: '16px',
    display: 'inline-block'
  };

  return (
    <div style={containerStyle}>
      <span style={titleStyle}>Kundendaten (Inline Styles)</span>
      
      <div style={rowStyle}>
        <span style={labelStyle}>Name:</span>
        <span style={valueStyle}>{customer.name || 'Kein Name'}</span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>Telefon:</span>
        <span style={valueStyle}>{customer.phone || 'Keine Telefonnummer'}</span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>E-Mail:</span>
        <span style={valueStyle}>{customer.email || 'Keine E-Mail'}</span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>Von:</span>
        <span style={valueStyle}>{customer.fromAddress || 'Keine Startadresse'}</span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>Nach:</span>
        <span style={valueStyle}>{customer.toAddress || 'Keine Zieladresse'}</span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>Umzugsdatum:</span>
        <span style={valueStyle}>{customer.movingDate || 'Kein Datum'}</span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>Zimmer:</span>
        <span style={valueStyle}>{customer.apartment?.rooms || '-'}</span>
      </div>
      
      <div style={rowStyle}>
        <span style={labelStyle}>Fläche:</span>
        <span style={valueStyle}>{customer.apartment?.area ? `${customer.apartment.area} m²` : '-'}</span>
      </div>
    </div>
  );
};

export default CustomerInfoSimple;