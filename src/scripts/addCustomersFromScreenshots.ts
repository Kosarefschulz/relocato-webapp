import { unifiedDatabaseService } from '../services/unifiedDatabaseService';
import { Customer, Quote } from '../types';

// Hilfsfunktion zum Generieren einer eindeutigen ID
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

async function addCustomersFromScreenshots() {
  console.log('Starte das Hinzufügen der Kunden aus den Screenshots...');

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
      rooms: 2, // Geschätzt basierend auf 17 Kubik
      area: 60, // Geschätzt
      floor: 3,
      hasElevator: false // 3. OG ohne Fahrstuhl
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
      rooms: 3, // Geschätzt
      area: 75, // Geschätzt
      floor: 0, // EG angenommen für Von-Adresse
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
    toAddress: 'An der Else 11, Kirchlengern', // Gleiche Adresse, vermutlich Renovierung
    apartment: {
      rooms: 3, // Geschätzt
      area: 80, // Geschätzt
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
      rooms: 3, // Basierend auf 86 qm
      area: 86,
      floor: 0, // EG
      hasElevator: false
    },
    services: ['Umzug', 'Möbelmontage'],
    notes: 'Budget 800 €, nur Möbelmontage, ca. 15 Kubik. Von: EG, 86 qm. Nach: 1. OG',
    priority: 'medium',
    source: 'Email',
    status: 'Angebot erstellt'
  };

  // Kunden zur Datenbank hinzufügen
  const customers = [customer1, customer2, customer3, customer4];
  const addedCustomers: string[] = [];

  for (const customer of customers) {
    try {
      const result = await unifiedDatabaseService.createCustomer(customer);
      if (result) {
        console.log(`✓ Kunde ${customer.name} erfolgreich hinzugefügt`);
        addedCustomers.push(result.id);
      } else {
        console.error(`✗ Fehler beim Hinzufügen von ${customer.name}`);
      }
    } catch (error) {
      console.error(`✗ Fehler beim Hinzufügen von ${customer.name}:`, error);
    }
  }

  console.log('\nErstelle Angebote für die hinzugefügten Kunden...');

  // Angebote erstellen
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

  for (const quote of quotes) {
    try {
      const quoteResult = await unifiedDatabaseService.createQuote(quote);
      if (quoteResult) {
        console.log(`✓ Angebot für ${quote.customerName} (${quote.price} €) erfolgreich erstellt`);
      } else {
        console.error(`✗ Fehler beim Erstellen des Angebots für ${quote.customerName}`);
      }
    } catch (error) {
      console.error(`✗ Fehler beim Erstellen des Angebots für ${quote.customerName}:`, error);
    }
  }

  console.log('\nAlle Kunden und Angebote wurden verarbeitet!');
  console.log(`Hinzugefügte Kunden: ${addedCustomers.length}`);
}

// Funktion ausführen
addCustomersFromScreenshots().catch(console.error);