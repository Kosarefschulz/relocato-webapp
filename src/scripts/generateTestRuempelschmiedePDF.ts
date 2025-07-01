import { generateRuempelschmiedePDF } from '../services/pdfServiceRuempelschmiede';
import { Customer } from '../types';
import fs from 'fs';
import path from 'path';

// Test-Kunde für Entrümpelung
const testCustomer: Customer = {
  id: 'test-ruempel-123',
  name: 'Max Mustermann',
  email: 'max.mustermann@example.com',
  phone: '0175 1234567',
  fromAddress: 'Hauptstraße 123, 33615 Bielefeld',
  toAddress: 'Nicht relevant',
  movingDate: new Date('2025-02-15').toISOString(),
  createdAt: new Date(),
  apartment: {
    rooms: 4,
    area: 95,
    floor: 3,
    hasElevator: false
  },
  services: [],
  salutation: 'Herr'
};

// Test-Angebot für Entrümpelung
const testQuote = {
  id: 'ENT-2025-001',
  customerId: 'test-ruempel-123',
  customerName: 'Max Mustermann',
  price: 1850.00,
  comment: 'Komplette Wohnungsauflösung inkl. Kellerraum. Besonderes Augenmerk auf alte Möbel im Dachboden. Zufahrt über Hinterhof möglich.',
  createdAt: new Date(),
  createdBy: 'System',
  status: 'sent' as const,
  volume: 45, // m³
  distance: 0, // Entfernung irrelevant bei Entrümpelung
  company: 'ruempelschmiede' as const
};

async function generateTestPDF() {
  try {
    console.log('🔄 Generiere Rümpel Schmiede Test-PDF...');
    
    // Generiere PDF
    const pdfBlob = await generateRuempelschmiedePDF(testCustomer, testQuote);
    
    // Konvertiere Blob zu Buffer
    const buffer = Buffer.from(await pdfBlob.arrayBuffer());
    
    // Speichere PDF im Downloads-Ordner
    const downloadsPath = path.join(process.env.HOME || '', 'Downloads');
    const fileName = `Test_Entruempelung_${new Date().toISOString().split('T')[0]}_NEU.pdf`;
    const filePath = path.join(downloadsPath, fileName);
    
    fs.writeFileSync(filePath, buffer);
    
    console.log(`✅ PDF erfolgreich generiert: ${filePath}`);
    console.log(`📄 Datei: ${fileName}`);
    console.log(`💾 Größe: ${(buffer.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Fehler beim Generieren des Test-PDFs:', error);
  }
}

// Führe das Skript aus
generateTestPDF();