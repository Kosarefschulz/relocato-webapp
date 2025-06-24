import { googleSheetsService } from '../services/googleSheetsService';
import { Customer } from '../types';

export const addCustomersFromScreenshots = async () => {
  const customers = [
    {
      name: 'Carolina Klein',
      phone: '+49 177 5305094',
      email: '',
      movingDate: '2025-07-17',
      fromAddress: 'Viktoriastraße 27, Bielefeld (3. OG ohne Fahrstuhl)',
      toAddress: 'Obernstraße 1, Bielefeld (4. OG mit Fahrstuhl)',
      apartment: {
        rooms: 3,
        area: 70,
        floor: 3,
        hasElevator: false
      },
      services: ['Umzug', 'Verpackung', 'Montage'],
      notes: 'ca. 17 Kubik, Möbelmontage, 3 Lampen, Einpackservice Küche & Arbeitszimmer, 50 Kartons, USM Haller Möbel, hochwertige Kaffeemaschine',
      quotePrice: 1900
    },
    {
      name: 'Doris Mattson',
      phone: '+49 170 1120639',
      email: '',
      movingDate: '2025-07-18',
      fromAddress: 'Alte Verler Straße 22, Sennestadt, Bielefeld',
      toAddress: 'Solmser Weg 13, 61169 Friedberg (Hessen), EG',
      apartment: {
        rooms: 3,
        area: 80,
        floor: 0,
        hasElevator: false
      },
      services: ['Umzug', 'Montage'],
      notes: 'Möbelmontage, Gartentisch, Box, Waschmaschine, Trockner, Holzregale mit Lebensmitteln, 30 Kartons, Juli (in den Ferien), Tochter krank',
      quotePrice: 2897
    },
    {
      name: 'Lars Schuerstedt',
      phone: '+49 157 39103228',
      email: '',
      movingDate: '2025-07-18',
      fromAddress: 'An der Else 11, Kirchlengern',
      toAddress: 'An der Else 11, Kirchlengern',
      apartment: {
        rooms: 4,
        area: 100,
        floor: 1,
        hasElevator: false
      },
      services: ['Umzug', 'Material'],
      notes: '5m Sockelleiste und Arbeitsplatte 3,50m müssen besorgt werden',
      quotePrice: 5498.10
    },
    {
      name: 'André Fischer',
      phone: '',
      email: 'Mdivani.irma@gmail.com',
      movingDate: '2025-07-19',
      fromAddress: 'Landerweg 23, Oerlinghausen (EG, 86 qm)',
      toAddress: 'Stukenbrocker Weg 7, 33813 Oerlinghausen (1. OG)',
      apartment: {
        rooms: 3,
        area: 86,
        floor: 0,
        hasElevator: false
      },
      services: ['Montage'],
      notes: 'Budget 800 €, nur Möbelmontage, ca. 15 Kubik',
      quotePrice: 980
    }
  ];

  try {
    console.log('Adding customers from screenshots...');
    
    for (const customerData of customers) {
      // Create customer
      const newCustomer: Omit<Customer, 'id'> = {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        movingDate: customerData.movingDate,
        fromAddress: customerData.fromAddress,
        toAddress: customerData.toAddress,
        apartment: customerData.apartment,
        services: customerData.services,
        notes: customerData.notes,
        contacted: true,
        source: 'Telefon',
        status: 'lead',
        viewingScheduled: false
      };

      const success = await googleSheetsService.addCustomer(newCustomer);
      const customerId = Date.now().toString();
      console.log(`Created customer: ${customerData.name} with ID: ${customerId} - Success: ${success}`);

      // Wait a bit to ensure unique IDs
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create quote for the customer
      if (customerData.quotePrice > 0) {
        const quoteData = {
          customerId: customerId,
          customerName: customerData.name,
          price: customerData.quotePrice,
          comment: customerData.notes,
          createdAt: new Date(),
          createdBy: 'System Import',
          status: 'draft' as const
        };

        const quoteSuccess = await googleSheetsService.addQuote(quoteData);
        const quoteId = Date.now().toString();
        console.log(`Created quote for ${customerData.name} with ID: ${quoteId}, Price: €${customerData.quotePrice} - Success: ${quoteSuccess}`);
      }
    }

    console.log('All customers added successfully!');
    alert('Alle Kunden wurden erfolgreich hinzugefügt! Bitte die Seite neu laden.');
    return true;
  } catch (error) {
    console.error('Error adding customers:', error);
    alert('Fehler beim Hinzufügen der Kunden. Siehe Konsole für Details.');
    return false;
  }
};

// Function to be called from console
(window as any).addCustomersFromScreenshots = addCustomersFromScreenshots;