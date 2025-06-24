import React, { useState } from 'react';
import { unifiedDatabaseService } from '../services/unifiedDatabaseService';
import { Customer, Quote } from '../types';
import { Button } from '@mui/material';

const AddCustomersFromScreenshots: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const handleAddCustomers = async () => {
    setLoading(true);
    setResult('Starte das Hinzufügen der Kunden...\n');

    try {
      // Customer 1: Carolina Klein
      const customer1: Customer = {
        id: generateId(),
        name: 'Carolina Klein',
        email: '',
        phone: '0177 5305094',
        movingDate: '2025-07-17',
        fromAddress: 'Viktoriastraße 27, Bielefeld',
        toAddress: 'Obernstraße 1, Bielefeld',
        apartment: {
          rooms: 2,
          area: 60,
          floor: 3,
          hasElevator: false
        },
        services: ['Umzug', 'Möbelmontage', 'Einpackservice', 'Lampenmontage'],
        notes: 'ca. 17 Kubik, 3 Lampen, Einpackservice Küche & Arbeitszimmer, 50 Kartons, USM Haller Möbel, hochwertige Kaffeemaschine. Nach: 4. OG mit Fahrstuhl',
        priority: 'high',
        source: 'Telefonisch',
        status: 'Angebot erstellt'
      };

      // Customer 2: Doris Mattson
      const customer2: Customer = {
        id: generateId(),
        name: 'Doris Mattson',
        email: '',
        phone: '0170 1120639',
        movingDate: '2025-07-18',
        fromAddress: 'Alte Verler Straße 22, Sennestadt, Bielefeld',
        toAddress: 'Solmser Weg 13, 61169 Friedberg (Hessen)',
        apartment: {
          rooms: 3,
          area: 75,
          floor: 0,
          hasElevator: false
        },
        services: ['Umzug', 'Möbelmontage'],
        notes: 'Fernumzug nach Hessen. Nach: EG. Gartentisch, Box, Waschmaschine, Trockner, Holzregale mit Lebensmitteln, 30 Kartons. Juli (in den Ferien), Tochter krank',
        priority: 'high',
        source: 'Telefonisch',
        status: 'Angebot erstellt'
      };

      // Customer 3: Lars Schuerstedt
      const customer3: Customer = {
        id: generateId(),
        name: 'Lars Schuerstedt',
        email: '',
        phone: '0157 39103228',
        movingDate: '2025-07-18',
        fromAddress: 'An der Else 11, Kirchlengern',
        toAddress: 'An der Else 11, Kirchlengern',
        apartment: {
          rooms: 3,
          area: 80,
          floor: 0,
          hasElevator: false
        },
        services: ['Umzug', 'Handwerkerleistungen'],
        notes: '5m Sockelleiste und Arbeitsplatte 3,50m müssen besorgt werden',
        priority: 'medium',
        source: 'Telefonisch',
        status: 'Angebot erstellt'
      };

      // Customer 4: André Fischer
      const customer4: Customer = {
        id: generateId(),
        name: 'André Fischer',
        email: 'Mdivani.irma@gmail.com',
        phone: '',
        movingDate: '2025-07-19',
        fromAddress: 'Landerweg 23, Oerlinghausen',
        toAddress: 'Stukenbrocker Weg 7, 33813 Oerlinghausen',
        apartment: {
          rooms: 3,
          area: 86,
          floor: 0,
          hasElevator: false
        },
        services: ['Umzug', 'Möbelmontage'],
        notes: 'Budget 800 €, nur Möbelmontage, ca. 15 Kubik. Von: EG, 86 qm. Nach: 1. OG',
        priority: 'medium',
        source: 'Email',
        status: 'Angebot erstellt'
      };

      const customers = [customer1, customer2, customer3, customer4];
      const addedCustomers: { id: string; name: string }[] = [];

      // Kunden hinzufügen
      for (const customer of customers) {
        try {
          const success = await unifiedDatabaseService.addCustomer(customer);
          if (success) {
            setResult(prev => prev + `✓ Kunde ${customer.name} erfolgreich hinzugefügt\n`);
            addedCustomers.push({ id: customer.id, name: customer.name });
          } else {
            setResult(prev => prev + `✗ Fehler beim Hinzufügen von ${customer.name}\n`);
          }
        } catch (error) {
          setResult(prev => prev + `✗ Fehler beim Hinzufügen von ${customer.name}: ${error}\n`);
        }
      }

      // Angebote erstellen
      setResult(prev => prev + '\nErstelle Angebote für die hinzugefügten Kunden...\n');

      const quotes: Quote[] = [
        {
          id: generateId(),
          customerId: customer1.id,
          customerName: customer1.name,
          price: 1900,
          comment: 'ca. 17 Kubik, Möbelmontage, 3 Lampen, Einpackservice Küche & Arbeitszimmer, 50 Kartons, USM Haller Möbel, hochwertige Kaffeemaschine',
          createdAt: new Date(),
          createdBy: 'System',
          status: 'draft',
          company: 'relocato'
        },
        {
          id: generateId(),
          customerId: customer2.id,
          customerName: customer2.name,
          price: 2897,
          comment: 'Fernumzug nach Friedberg (Hessen), Möbelmontage, inkl. Gartentisch, Box, Waschmaschine, Trockner, Holzregale mit Lebensmitteln, 30 Kartons',
          createdAt: new Date(),
          createdBy: 'System',
          status: 'draft',
          company: 'relocato'
        },
        {
          id: generateId(),
          customerId: customer3.id,
          customerName: customer3.name,
          price: 5498.10,
          comment: '5m Sockelleiste und Arbeitsplatte 3,50m müssen besorgt werden',
          createdAt: new Date(),
          createdBy: 'System',
          status: 'draft',
          company: 'relocato'
        },
        {
          id: generateId(),
          customerId: customer4.id,
          customerName: customer4.name,
          price: 980,
          comment: 'Budget 800 €, nur Möbelmontage, ca. 15 Kubik',
          createdAt: new Date(),
          createdBy: 'System',
          status: 'draft',
          company: 'relocato'
        }
      ];

      // Nur Angebote für erfolgreich hinzugefügte Kunden erstellen
      for (const quote of quotes) {
        const customerAdded = addedCustomers.find(c => c.id === quote.customerId);
        if (customerAdded) {
          try {
            const success = await unifiedDatabaseService.addQuote(quote);
            if (success) {
              setResult(prev => prev + `✓ Angebot für ${quote.customerName} (${quote.price} €) erfolgreich erstellt\n`);
            } else {
              setResult(prev => prev + `✗ Fehler beim Erstellen des Angebots für ${quote.customerName}\n`);
            }
          } catch (error) {
            setResult(prev => prev + `✗ Fehler beim Erstellen des Angebots für ${quote.customerName}: ${error}\n`);
          }
        }
      }

      setResult(prev => prev + `\nAlle Kunden und Angebote wurden verarbeitet!\nHinzugefügte Kunden: ${addedCustomers.length}\n`);
    } catch (error) {
      setResult(prev => prev + `\nFehler: ${error}\n`);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Kunden aus Screenshots hinzufügen</h2>
      <Button 
        variant="contained" 
        onClick={handleAddCustomers} 
        disabled={loading}
      >
        {loading ? 'Füge Kunden hinzu...' : 'Kunden hinzufügen'}
      </Button>
      <pre style={{ marginTop: '20px', background: '#f5f5f5', padding: '10px' }}>
        {result}
      </pre>
    </div>
  );
};

export default AddCustomersFromScreenshots;