import { Customer } from '../types';

export interface QuoteCalculation {
  volumeBase: number;
  volumeRange: string;
  basePrice: number;
  floorSurcharge: number;
  distanceSurcharge: number;
  packingService: number;
  boxesPrice: number;
  parkingZonePrice: number;
  storagePrice: number;
  totalPrice: number;
  manualPrice?: number;
  finalPrice: number;
  priceBreakdown: {
    base: number;
    floors: number;
    distance: number;
    packing: number;
    boxes: number;
    parkingZone: number;
    storage: number;
  };
}

export interface QuoteDetails {
  volume: number;
  distance: number;
  packingRequested: boolean;
  additionalServices: string[];
  notes: string;
  boxCount: number;
  parkingZonePrice: number;
  storagePrice: number;
  manualTotalPrice?: number;
}

class QuoteCalculationService {
  // Preistabelle basierend auf Ihrem Python-Script (realistischere Bereiche)
  private priceTable = [
    { minVolume: 5, maxVolume: 10, price: 599 },
    { minVolume: 10, maxVolume: 15, price: 749 },
    { minVolume: 15, maxVolume: 20, price: 899 },
    { minVolume: 20, maxVolume: 25, price: 1099 },
    { minVolume: 25, maxVolume: 30, price: 1299 },
    { minVolume: 30, maxVolume: 35, price: 1499 },
    { minVolume: 35, maxVolume: 40, price: 1699 },
    { minVolume: 40, maxVolume: 45, price: 1899 },
    { minVolume: 45, maxVolume: 50, price: 2099 },
    { minVolume: 50, maxVolume: 60, price: 2299 },
    { minVolume: 60, maxVolume: 70, price: 2699 },
    { minVolume: 70, maxVolume: 80, price: 3099 },
    { minVolume: 80, maxVolume: 100, price: 3499 }
  ];

  // Standard-Volumen für die meisten Umzüge
  getStandardVolume(): number {
    return 20; // Standard 20 m³ für 85% der Umzüge
  }

  // Optional: Geschätzte Volumen-Berechnung basierend auf Fläche (nur zur Orientierung)
  estimateVolumeFromArea(area: number): number {
    // Realistischere Berechnung: m² / 3 = m³ (nicht * 2.5)
    return Math.max(Math.round(area / 3), 15);
  }

  // Basis-Preis ermitteln
  getBasePrice(volume: number): { price: number; range: string } {
    const priceEntry = this.priceTable.find(entry => 
      volume >= entry.minVolume && volume <= entry.maxVolume
    );
    
    if (!priceEntry) {
      // Fallback für sehr große Volumen (über 100 m³)
      const lastEntry = this.priceTable[this.priceTable.length - 1];
      const extraVolume = volume - lastEntry.maxVolume;
      const extraPrice = Math.ceil(extraVolume / 10) * 300; // €300 pro zusätzliche 10 m³
      return {
        price: lastEntry.price + extraPrice,
        range: `${volume} m³ (Sondervolumen)`
      };
    }
    
    return {
      price: priceEntry.price,
      range: `${priceEntry.minVolume}-${priceEntry.maxVolume} m³`
    };
  }

  // Etagen-Zuschlag berechnen
  calculateFloorSurcharge(fromFloor: number, toFloor: number, hasElevatorFrom: boolean, hasElevatorTo: boolean): number {
    let surcharge = 0;
    
    // Zuschlag für Auszug ohne Aufzug
    if (!hasElevatorFrom && fromFloor > 1) {
      surcharge += (fromFloor - 1) * 50;
    }
    
    // Zuschlag für Einzug ohne Aufzug  
    if (!hasElevatorTo && toFloor > 1) {
      surcharge += (toFloor - 1) * 50;
    }
    
    return surcharge;
  }

  // Entfernungs-Zuschlag berechnen
  calculateDistanceSurcharge(distance: number): number {
    if (distance <= 50) return 0;
    if (distance <= 100) return 150;
    if (distance <= 200) return 300;
    if (distance <= 300) return 450;
    return 600; // Über 300km
  }

  // Verpackungsservice-Zuschlag
  calculatePackingService(volume: number, packingRequested: boolean): number {
    if (!packingRequested) return 0;
    
    // Verpackungsservice: 15€ pro m³, mindestens 150€
    return Math.max(volume * 15, 150);
  }

  // Karton-Preis berechnen
  calculateBoxesPrice(boxCount: number): number {
    return boxCount * 2.50;
  }

  // Haupt-Kalkulationsfunktion
  calculateQuote(customer: Customer, quoteDetails: QuoteDetails): QuoteCalculation {
    const volume = quoteDetails.volume || this.estimateVolumeFromArea(customer.apartment.area);
    const basePriceInfo = this.getBasePrice(volume);
    
    // Etagen aus Adresse extrahieren oder Standardwerte verwenden
    const fromFloor = this.extractFloorFromAddress(customer.fromAddress) || customer.apartment.floor || 1;
    const toFloor = this.extractFloorFromAddress(customer.toAddress) || 1;
    
    const floorSurcharge = this.calculateFloorSurcharge(
      fromFloor, 
      toFloor, 
      customer.apartment.hasElevator, 
      false // Ziel-Aufzug-Info fehlt, konservativ annehmen
    );
    
    const distanceSurcharge = this.calculateDistanceSurcharge(quoteDetails.distance);
    const packingService = this.calculatePackingService(volume, quoteDetails.packingRequested);
    const boxesPrice = this.calculateBoxesPrice(quoteDetails.boxCount || 0);
    const parkingZonePrice = quoteDetails.parkingZonePrice || 0;
    const storagePrice = quoteDetails.storagePrice || 0;
    
    const totalPrice = basePriceInfo.price + floorSurcharge + distanceSurcharge + packingService + boxesPrice + parkingZonePrice + storagePrice;
    
    // Wenn manueller Preis gesetzt ist, diesen verwenden
    const finalPrice = quoteDetails.manualTotalPrice || totalPrice;
    
    return {
      volumeBase: volume,
      volumeRange: basePriceInfo.range,
      basePrice: basePriceInfo.price,
      floorSurcharge,
      distanceSurcharge,
      packingService,
      boxesPrice,
      parkingZonePrice,
      storagePrice,
      totalPrice,
      manualPrice: quoteDetails.manualTotalPrice,
      finalPrice,
      priceBreakdown: {
        base: basePriceInfo.price,
        floors: floorSurcharge,
        distance: distanceSurcharge,
        packing: packingService,
        boxes: boxesPrice,
        parkingZone: parkingZonePrice,
        storage: storagePrice
      }
    };
  }

  // Hilfsfunktion: Etage aus Adresse extrahieren
  private extractFloorFromAddress(address: string): number | null {
    const floorMatch = address.match(/etage\s+(\d+)|(\d+)\.\s*stock/i);
    if (floorMatch) {
      return parseInt(floorMatch[1] || floorMatch[2]);
    }
    return null;
  }

  // HTML-Template für PDF basierend auf Ihrem Python-Script
  generateQuoteHTML(customer: Customer, calculation: QuoteCalculation, quoteDetails: QuoteDetails): string {
    const currentDate = new Date().toLocaleDateString('de-DE');
    
    return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Umzugsangebot - RELOCATO®</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #e74c3c;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #e74c3c;
            margin-bottom: 10px;
        }
        .company-info {
            font-size: 14px;
            color: #666;
        }
        .customer-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .quote-details {
            margin-bottom: 25px;
        }
        .price-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .price-table th,
        .price-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .price-table th {
            background-color: #e74c3c;
            color: white;
        }
        .total-row {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .total-price {
            font-size: 24px;
            color: #e74c3c;
            text-align: center;
            margin: 25px 0;
            padding: 15px;
            border: 2px solid #e74c3c;
            border-radius: 8px;
        }
        .conditions {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">RELOCATO®</div>
        <div class="company-info">
            Ihr zuverlässiger Partner für stressfreie Umzüge<br>
            📞 0521 / 329 777 30 | 📧 bielefeld@relocato.de
        </div>
    </div>

    <h1 style="color: #e74c3c; text-align: center;">Umzugsangebot</h1>

    <div class="customer-section">
        <h2>Kundeninformationen</h2>
        <p><strong>Name:</strong> ${customer.name}</p>
        <p><strong>Telefon:</strong> ${customer.phone}</p>
        <p><strong>E-Mail:</strong> ${customer.email}</p>
        <p><strong>Von:</strong> ${customer.fromAddress}</p>
        <p><strong>Nach:</strong> ${customer.toAddress}</p>
        <p><strong>Umzugsdatum:</strong> ${customer.movingDate}</p>
    </div>

    <div class="quote-details">
        <h2>Umzugsdetails</h2>
        <p><strong>Geschätztes Volumen:</strong> ca. ${calculation.volumeBase} m³ (${calculation.volumeRange})</p>
        <p><strong>Wohnfläche:</strong> ${customer.apartment.area} m²</p>
        <p><strong>Zimmer:</strong> ${customer.apartment.rooms}</p>
        <p><strong>Entfernung:</strong> ca. ${quoteDetails.distance} km</p>
        ${quoteDetails.packingRequested ? '<p><strong>Verpackungsservice:</strong> Ja</p>' : ''}
    </div>

    <table class="price-table">
        <thead>
            <tr>
                <th>Position</th>
                <th>Beschreibung</th>
                <th>Preis</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Basis-Umzug</td>
                <td>${calculation.volumeRange} - Transport, Be- und Entladung</td>
                <td>€ ${calculation.priceBreakdown.base.toFixed(2).replace('.', ',')}</td>
            </tr>
            ${calculation.priceBreakdown.floors > 0 ? `
            <tr>
                <td>Etagen-Zuschlag</td>
                <td>Zusätzliche Stockwerke ohne Aufzug</td>
                <td>€ ${calculation.priceBreakdown.floors.toFixed(2).replace('.', ',')}</td>
            </tr>
            ` : ''}
            ${calculation.priceBreakdown.distance > 0 ? `
            <tr>
                <td>Entfernungs-Zuschlag</td>
                <td>Zusätzliche Entfernung über 50km</td>
                <td>€ ${calculation.priceBreakdown.distance.toFixed(2).replace('.', ',')}</td>
            </tr>
            ` : ''}
            ${calculation.priceBreakdown.packing > 0 ? `
            <tr>
                <td>Verpackungsservice</td>
                <td>Professionelle Verpackung Ihrer Gegenstände</td>
                <td>€ ${calculation.priceBreakdown.packing.toFixed(2).replace('.', ',')}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
                <td colspan="2"><strong>Gesamtpreis</strong></td>
                <td><strong>€ ${calculation.totalPrice.toFixed(2).replace('.', ',')}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="total-price">
        <strong>Ihr Umzugspreis: € ${calculation.finalPrice.toFixed(2).replace('.', ',')} 🚛</strong>
    </div>

    <div class="conditions">
        <h3>Leistungen & Bedingungen</h3>
        <ul>
            <li>✅ Professionelle Möbelpacker</li>
            <li>✅ Vollständig versicherter Transport</li>
            <li>✅ Moderne Fahrzeugflotte</li>
            <li>✅ Kostenlose Besichtigung vor Ort</li>
            <li>📋 Angebot gültig für 30 Tage</li>
            <li>💰 Zahlung nach erfolgreicher Durchführung</li>
        </ul>
        
        ${quoteDetails.notes ? `
        <h4>Zusätzliche Hinweise:</h4>
        <p>${quoteDetails.notes}</p>
        ` : ''}
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <p><strong>Haben Sie Fragen? Rufen Sie uns an!</strong></p>
        <p style="font-size: 18px; color: #e74c3c;">📞 0521 / 329 777 30</p>
    </div>

    <div class="footer">
        <p>RELOCATO® - Ihr Partner für stressfreie Umzüge</p>
        <p>Angebot erstellt am: ${currentDate}</p>
    </div>
</body>
</html>`;
  }

  // E-Mail Text basierend auf Ihrem Python-Script
  generateEmailText(customer: Customer, calculation: QuoteCalculation): string {
    return `Liebe/r ${customer.name},

vielen Dank für Ihr Vertrauen in RELOCATO®!

Hiermit übersenden wir Ihnen wie besprochen Ihr persönliches Umzugsangebot:

🏠 Von: ${customer.fromAddress}
🏠 Nach: ${customer.toAddress}
📅 Umzugsdatum: ${customer.movingDate}
📦 Geschätztes Volumen: ca. ${calculation.volumeBase} m³

💰 Ihr Umzugspreis: € ${calculation.finalPrice.toFixed(2).replace('.', ',')}

Im Anhang finden Sie die detaillierte Aufstellung aller Leistungen.

Unsere Leistungen auf einen Blick:
✅ Professionelle Möbelpacker
✅ Vollständig versicherter Transport  
✅ Moderne Fahrzeugflotte
✅ Kostenlose Besichtigung vor Ort

Das Angebot ist 30 Tage gültig. Bei Fragen stehen wir Ihnen jederzeit zur Verfügung!

Mit freundlichen Grüßen
Ihr RELOCATO® Team

📞 0521 / 329 777 30
📧 bielefeld@relocato.de
🌐 www.relocato.de

---
RELOCATO® - Ihr zuverlässiger Partner für stressfreie Umzüge`;
  }
}

export const quoteCalculationService = new QuoteCalculationService();