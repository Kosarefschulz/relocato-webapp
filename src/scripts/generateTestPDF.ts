import { generatePDF } from '../services/pdfService';
import { Customer } from '../types';
import fs from 'fs';
import path from 'path';

// Test-Kunde
const testCustomer: Customer = {
  id: 'test-123',
  name: 'Max Mustermann',
  email: 'max.mustermann@example.com',
  phone: '0521 123456',
  fromAddress: 'Musterstraße 123, 33604 Bielefeld',
  toAddress: 'Neue Straße 456, 33605 Bielefeld',
  movingDate: new Date('2025-02-15').toISOString(),
  createdAt: new Date(),
  apartment: {
    rooms: 3,
    area: 85,
    floor: 2,
    hasElevator: false
  },
  services: []
};

// Test-Angebot mit vielen Services
const testQuote = {
  customerId: 'test-123',
  customerName: 'Max Mustermann',
  price: 2499.00,
  comment: 'Bitte besonders vorsichtig mit dem Aquarium umgehen. Parkplatz vor dem Haus ist vorhanden.',
  createdAt: new Date(),
  createdBy: 'System',
  status: 'sent' as const,
  volume: 65,
  distance: 15,
  calculation: {
    basePrice: 1200,
    volumeSurcharge: 300,
    distanceSurcharge: 150,
    floorSurcharge: 200,
    packingService: 400
  },
  details: {
    packingRequested: true,
    boxCount: 50,
    furnitureAssemblyPrice: 200,
    furnitureDisassemblyPrice: 150,
    cleaningService: true,
    cleaningHours: 4,
    clearanceService: false,
    clearanceVolume: 0,
    renovationService: false,
    renovationHours: 0,
    pianoTransport: true,
    heavyItemsCount: 2,
    parkingZonePrice: 50,
    storagePrice: 0,
    packingMaterials: true
  }
};

async function generateTestPDF() {
  try {
    console.log('🔄 Generiere Test-PDF...');
    
    // Generiere PDF
    const pdfBlob = await generatePDF(testCustomer, testQuote);
    
    // Konvertiere Blob zu Buffer
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());
    
    // Speichere PDF im Downloads-Ordner
    const downloadsPath = path.join(process.env.HOME || '', 'Downloads');
    const fileName = `Test_Angebot_${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(downloadsPath, fileName);
    
    fs.writeFileSync(filePath, buffer);
    
    console.log(`✅ PDF erfolgreich generiert: ${filePath}`);
    console.log(`📄 Datei: ${fileName}`);
    
  } catch (error) {
    console.error('❌ Fehler beim Generieren des Test-PDFs:', error);
  }
}

// Führe das Skript aus
generateTestPDF();