const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Entfernt Google Maps Links und URLs aus Text
 */
function removeGoogleLinks(text) {
  if (!text) return text;
  
  // Entfernt Text in eckigen Klammern mit Links
  text = text.replace(/\s*\[[^\]]*\]\([^)]*\)/g, '');
  
  // Entfernt Text in runden Klammern mit Google Maps oder "Standort auf finden"
  text = text.replace(/\s*\(Standort auf.*?\)/g, '');
  text = text.replace(/\s*\(Standort auf.*?Google Maps.*?\)/g, '');
  text = text.replace(/\s*\(Google Maps.*?\)/g, '');
  
  // Entfernt alleinstehende URLs
  text = text.replace(/https?:\/\/\S+/g, '');
  text = text.replace(/www\.\S+/g, '');
  
  // Entfernt Google-spezifische Patterns
  text = text.replace(/maps\.google\.\S+/g, '');
  text = text.replace(/google\.com\/maps\S+/g, '');
  
  // Entfernt übrige Klammern ohne Inhalt
  text = text.replace(/\s*\(\s*\)/g, '');
  text = text.replace(/\s*\[\s*\]/g, '');
  
  // Bereinigt mehrfache Leerzeichen
  return text.split(/\s+/).join(' ').trim();
}

/**
 * Parser für ImmoScout24 E-Mails
 */
function parseImmoScout24Email(content) {
  const data = {};
  
  // --- Anfrage Info ---
  const requestInfo = content.match(/Anfrage #(\d+)\s+vom\s+(\d{2}\.\d{2}\.\d{4})\s+um\s+(\d{2}:\d{2})/);
  if (requestInfo) {
    data.anfrageNummer = requestInfo[1];
    data.anfrageDatum = requestInfo[2];
    data.anfrageUhrzeit = requestInfo[3];
  }
  
  // --- Kontaktdaten ---
  const nameMatch = content.match(/Name:\s*(.+?)(?:\n|$)/);
  data.name = nameMatch ? nameMatch[1].trim() : 'Unbekannt';
  
  const telefonMatch = content.match(/Telefon:\s*(.+?)(?:\n|$)/);
  data.phone = telefonMatch ? normalizePhone(telefonMatch[1].trim()) : '';
  
  const emailMatch = content.match(/E-Mail:\s*([\w\.\-]+@[\w\.\-]+)/);
  data.email = emailMatch ? emailMatch[1].trim() : '';
  
  const abrechnungMatch = content.match(/Abrechnung über:\s*(.+?)(?:\n|$)/);
  data.abrechnungUeber = abrechnungMatch ? abrechnungMatch[1].trim() : '';
  
  // --- Auszug Details ---
  const auszugBlock = content.match(/(Auszug.*?)(?:Einzug|Details zur Anfrage|Bei Fragen)/s);
  if (auszugBlock) {
    const auszug = auszugBlock[1];
    
    const auszugDatum = auszug.match(/am:\s*(\d{2}\.\d{2}\.\d{4})/);
    data.moveDate = auszugDatum ? parseGermanDate(auszugDatum[1]) : null;
    
    const auszugStrasse = auszug.match(/Straße:\s*(.+?)(?:\n|$)/);
    const auszugPLZ = auszug.match(/PLZ \/ Ort:\s*(.+?)(?:\n|$)/);
    
    if (auszugStrasse && auszugPLZ) {
      data.fromAddress = `${auszugStrasse[1].trim()}, ${auszugPLZ[1].trim()}`;
    }
    
    const gebaeude = auszug.match(/Gebäude:\s*(.+?)(?:\n|$)/);
    const etage = auszug.match(/Etage:\s*(.+?)(?:\n|$)/);
    const zimmer = auszug.match(/Zimmer:\s*(.+?)(?:\n|$)/);
    const flaeche = auszug.match(/Fläche:\s*(.+?)(?:\n|$)/);
    const aufzug = auszug.match(/Aufzug im Haus:\s*(Ja|Nein)/);
    
    data.apartment = {
      type: gebaeude ? gebaeude[1].trim() : '',
      floor: etage ? parseFloor(etage[1].trim()) : 0,
      rooms: zimmer ? parseFloat(zimmer[1].trim().replace(',', '.')) : 0,
      area: flaeche ? parseInt(flaeche[1].trim()) : 0,
      hasElevator: aufzug ? aufzug[1] === 'Ja' : false
    };
    
    // Services basierend auf Ja/Nein Feldern
    const services = [];
    if (auszug.match(/Einpacken:\s*Ja/)) services.push('Einpackservice');
    if (auszug.match(/Möbel Abbau:\s*Ja/)) services.push('Möbelmontage');
    if (auszug.match(/Küche Abbau:\s*Ja/)) services.push('Küchenmontage');
    if (auszug.match(/Halteverbot beantragen:\s*Ja/)) services.push('Halteverbot');
    if (auszug.match(/Keller\/ Dachboden:\s*Ja/)) services.push('Keller/Dachboden');
    data.services = services.length > 0 ? services : ['Umzug'];
  }
  
  // --- Einzug Details ---
  const einzugBlock = content.match(/(Einzug.*?)(?:Details zur Anfrage|Bei Fragen|Immobilien Scout GmbH)/s);
  if (einzugBlock) {
    const einzug = einzugBlock[1];
    
    const einzugStrasse = einzug.match(/Straße:\s*(.+?)(?:\n|$)/);
    const einzugPLZ = einzug.match(/PLZ \/ Ort:\s*(.+?)(?:\n|$)/);
    
    if (einzugStrasse && einzugPLZ) {
      data.toAddress = `${einzugStrasse[1].trim()}, ${einzugPLZ[1].trim()}`;
    }
    
    // Zusätzliche Services vom Einzug
    if (einzug.match(/Auspacken:\s*Ja/) && !data.services.includes('Einpackservice')) {
      data.services.push('Auspackservice');
    }
    if (einzug.match(/Möbel Aufbau:\s*Ja/) && !data.services.includes('Möbelmontage')) {
      data.services.push('Möbelmontage');
    }
    if (einzug.match(/Küche Aufbau:\s*Ja/) && !data.services.includes('Küchenmontage')) {
      data.services.push('Küchenmontage');
    }
    if (einzug.match(/Möbel einlagern:\s*Ja/)) {
      data.services.push('Einlagerung');
    }
  }
  
  // --- Entfernung ---
  const entfernungMatch = content.match(/Entfernung vom Auszugsort zum Einzugsort:\s*(.+?)\s*km/);
  data.distance = entfernungMatch ? parseFloat(entfernungMatch[1].trim()) : 0;
  
  // Formatiere finale Daten
  const nameParts = data.name.split(' ');
  
  return {
    source: 'ImmoScout24',
    anfrageNummer: data.anfrageNummer || '',
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    name: data.name,
    phone: data.phone,
    email: data.email,
    moveDate: data.moveDate,
    fromAddress: data.fromAddress || '',
    toAddress: data.toAddress || '',
    apartment: data.apartment || {},
    services: data.services || ['Umzug'],
    distance: data.distance,
    notes: data.abrechnungUeber ? `Abrechnung über: ${data.abrechnungUeber}` : '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'new',
    leadSource: 'immoscout24-email'
  };
}

/**
 * Parser für Umzug365 E-Mails
 */
function parseUmzug365Email(content) {
  const data = {};
  
  // --- Allgemeine Felder ---
  const umzugstagMatch = content.match(/Voraussichtlicher Umzugstag:\s*(.+?)(?:\n|$)/);
  data.moveDate = umzugstagMatch ? parseGermanDate(umzugstagMatch[1].trim()) : null;
  
  const zimmerMatch = content.match(/Zimmer:\s*(\d+)/);
  const rooms = zimmerMatch ? parseInt(zimmerMatch[1]) : 0;
  
  // --- Kontaktdaten ---
  const nameMatch = content.match(/Name:\s*(.+?)(?:\n|$)/);
  data.name = nameMatch ? nameMatch[1].trim() : 'Unbekannt';
  
  const telefonMatch = content.match(/Telefon:\s*([\d\s\+\-\(\)]+)(?:\s*Geprüft)?/);
  if (telefonMatch) {
    let telefon = telefonMatch[1].trim();
    telefon = telefon.replace(/\s*Geprüft\s*/g, '').trim();
    data.phone = normalizePhone(telefon);
  }
  
  const emailMatch = content.match(/E-Mail:\s*([\w\.\-]+@[\w\.\-]+)/);
  data.email = emailMatch ? emailMatch[1].trim() : '';
  
  // --- Von Block ---
  const vonBlock = content.match(/Von:(.*?)(?:Nach:|$)/s);
  if (vonBlock) {
    const von = vonBlock[1];
    
    // Straße mit Bereinigung
    const strasseMatch = von.match(/Straße\/\s*Nr\.:\s*(.+?)(?:\n|$)/);
    if (strasseMatch) {
      let strasse = strasseMatch[1].trim();
      strasse = removeGoogleLinks(strasse);
      
      const plzMatch = von.match(/Postleitzahl:\s*(\d{5})/);
      const ortMatch = von.match(/Ort:\s*(.+?)(?:\n|$)/);
      
      if (plzMatch && ortMatch) {
        const ort = removeGoogleLinks(ortMatch[1].trim());
        data.fromAddress = `${strasse}, ${plzMatch[1]} ${ort}`;
      } else {
        data.fromAddress = strasse;
      }
    }
    
    const immobilieMatch = von.match(/Immobilie:\s*(.+?)(?:\n|$)/);
    const etageMatch = von.match(/Etage:\s*(.+?)(?:\n|$)/);
    const aufzugMatch = von.match(/Aufzug vorhanden:\s*(Ja|Nein)/);
    const flaecheMatch = von.match(/Fläche\s*\(m²\):\s*(\d+)/);
    
    data.apartment = {
      type: immobilieMatch ? immobilieMatch[1].trim() : '',
      floor: etageMatch ? parseFloor(etageMatch[1].trim()) : 0,
      rooms: rooms,
      area: flaecheMatch ? parseInt(flaecheMatch[1]) : 0,
      hasElevator: aufzugMatch ? aufzugMatch[1] === 'Ja' : false
    };
  }
  
  // --- Nach Block ---
  const nachBlock = content.match(/Nach:(.*?)(?:Details:|$)/s);
  if (nachBlock) {
    const nach = nachBlock[1];
    
    // Verschiedene Adressformate behandeln
    const strasseMatch = nach.match(/Straße\/\s*Nr\.:\s*(.+?)(?:\n|$)/);
    if (strasseMatch) {
      // Format mit separater Straße
      let strasse = removeGoogleLinks(strasseMatch[1].trim());
      const plzMatch = nach.match(/Postleitzahl:\s*(\d{5})/);
      const ortMatch = nach.match(/Ort:\s*(.+?)(?:\n|$)/);
      
      if (plzMatch && ortMatch) {
        const ort = removeGoogleLinks(ortMatch[1].trim());
        data.toAddress = `${strasse}, ${plzMatch[1]} ${ort}`;
      } else {
        data.toAddress = strasse;
      }
    } else {
      // Format mit kombiniertem Ort-Feld
      const ortMatch = nach.match(/Ort:\s*(.+?)(?:\n|$)/);
      if (ortMatch) {
        let ortString = removeGoogleLinks(ortMatch[1].trim());
        
        // Versuche verschiedene Formate zu parsen
        // Format: PLZ Ort Straße
        const format1 = ortString.match(/^(\d{5})\s+([^\d]+?)\s+(.+)$/);
        // Format: Straße, PLZ Ort
        const format2 = ortString.match(/^(.+?),\s*(\d{5})\s+(.+)$/);
        // Format: Nur Straße (wie "Schwarzenegger 10")
        const format3 = ortString.match(/^([^,]+)$/);
        
        if (format1) {
          data.toAddress = `${format1[3]}, ${format1[1]} ${format1[2]}`;
        } else if (format2) {
          data.toAddress = ortString;
        } else if (format3 && data.fromAddress) {
          // Wenn nur Straße vorhanden, versuche PLZ/Ort von fromAddress zu übernehmen
          const fromPLZ = data.fromAddress.match(/, (\d{5}) ([^,]+)$/);
          if (fromPLZ) {
            data.toAddress = `${format3[1]}, ${fromPLZ[1]} ${fromPLZ[2]}`;
          } else {
            data.toAddress = ortString;
          }
        } else {
          data.toAddress = ortString;
        }
      }
    }
    
    const neueImmobilieMatch = nach.match(/Neue Immobilie:\s*(.+?)(?:\n|$)/);
    if (neueImmobilieMatch && data.apartment) {
      data.apartment.newType = neueImmobilieMatch[1].trim();
    }
  }
  
  // --- Details Block ---
  const detailsBlock = content.match(/Details:(.*?)(?:Diese Preisanfrage|$)/s);
  if (detailsBlock) {
    const details = detailsBlock[1];
    
    const kategorieMatch = details.match(/Kategorie:\s*(.+?)(?:\n|$)/);
    const anfrageIdMatch = details.match(/Anfrage ID:\s*(.+?)(?:\n|$)/);
    const regionMatch = details.match(/Region:\s*(.+?)(?:\n|$)/);
    
    data.kategorie = kategorieMatch ? kategorieMatch[1].trim() : '';
    data.anfrageId = anfrageIdMatch ? anfrageIdMatch[1].trim() : '';
    data.region = regionMatch ? regionMatch[1].trim() : '';
  }
  
  // --- Entfernung ---
  const entfernungMatch = content.match(/Entfernung.*?:\s*(.+?)\s*km/i);
  data.distance = entfernungMatch ? parseFloat(entfernungMatch[1].trim()) : 0;
  
  // Formatiere finale Daten
  const nameParts = data.name.split(' ');
  
  return {
    source: 'Umzug365',
    anfrageId: data.anfrageId || '',
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    name: data.name,
    phone: data.phone,
    email: data.email,
    moveDate: data.moveDate,
    fromAddress: data.fromAddress || '',
    toAddress: data.toAddress || '',
    apartment: data.apartment || {},
    services: ['Umzug'], // Umzug365 hat keine Service-Details in den Beispielen
    distance: data.distance || 0,
    notes: data.kategorie ? `Kategorie: ${data.kategorie}\nRegion: ${data.region || ''}` : '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'new',
    leadSource: 'umzug365-email'
  };
}

/**
 * Hilfsfunktionen
 */
function normalizePhone(phone) {
  if (!phone) return '';
  
  // Entferne alle nicht-numerischen Zeichen außer + am Anfang
  let normalized = phone.replace(/[^0-9+]/g, '');
  
  // Entferne führende Nullen wenn + vorhanden
  if (normalized.startsWith('+')) {
    return normalized;
  }
  
  // Füge deutsche Vorwahl hinzu wenn nötig
  if (normalized.startsWith('0')) {
    // Deutsche Nummer mit führender 0
    normalized = '+49' + normalized.substring(1);
  } else if (normalized.startsWith('49')) {
    // Hat schon deutsche Ländervorwahl, nur + hinzufügen
    normalized = '+' + normalized;
  } else if (normalized.length >= 10 && !normalized.startsWith('+')) {
    // Andere Nummer ohne Ländervorwahl
    normalized = '+49' + normalized;
  }
  
  return normalized;
}

function parseGermanDate(dateStr) {
  if (!dateStr) return null;
  
  // Bereinige den String
  dateStr = dateStr.trim();
  
  // DD.MM.YYYY Format
  const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    const date = new Date(year, month - 1, day);
    return date.toISOString();
  }
  
  return null;
}

function parseFloor(floorStr) {
  if (!floorStr) return 0;
  
  const floorMap = {
    'erdgeschoss': 0,
    'eg': 0,
    'parterre': 0,
    'souterrain': -1,
    'keller': -1,
    'dachgeschoss': 99,
    'dg': 99
  };
  
  const lower = floorStr.toLowerCase();
  if (floorMap[lower] !== undefined) {
    return floorMap[lower];
  }
  
  // Versuche Zahl zu extrahieren
  const match = floorStr.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

/**
 * Hauptfunktion zum Erkennen und Parsen der E-Mail
 */
function parseEmail(emailData) {
  const { from, subject, text, html } = emailData;
  const content = text || html || '';
  
  console.log('🔍 E-Mail-Erkennung:');
  console.log('  Von:', from);
  console.log('  Betreff:', subject);
  
  // Erkenne Quelle anhand verschiedener Kriterien
  if (from?.toLowerCase().includes('immoscout24') || 
      from?.toLowerCase().includes('immobilienscout24') || 
      subject?.toLowerCase().includes('immoscout24') ||
      content.includes('Immobilien Scout GmbH')) {
    console.log('  → Erkannt als: ImmoScout24');
    return parseImmoScout24Email(content);
  } else if (from?.toLowerCase().includes('umzug365') || 
             from?.toLowerCase().includes('umzug-365') || 
             subject?.toLowerCase().includes('umzug365') ||
             content.includes('umzug365.de')) {
    console.log('  → Erkannt als: Umzug365');
    return parseUmzug365Email(content);
  }
  
  // Fallback basierend auf Inhalt
  if (content.includes('Anfrage #') && content.includes('Auszug') && content.includes('Einzug')) {
    console.log('  → Erkannt als: ImmoScout24 (durch Struktur)');
    return parseImmoScout24Email(content);
  } else if (content.includes('Voraussichtlicher Umzugstag:') && content.includes('Von:') && content.includes('Nach:')) {
    console.log('  → Erkannt als: Umzug365 (durch Struktur)');
    return parseUmzug365Email(content);
  }
  
  // Wenn nichts erkannt wird, versuche generisches Parsing
  console.warn('  ⚠️ Unbekannte E-Mail-Quelle, versuche generisches Parsing');
  return parseGenericEmail(content, emailData);
}

/**
 * Generischer Parser für unbekannte E-Mail-Formate
 */
function parseGenericEmail(content, emailData) {
  const data = {
    source: 'Unbekannt',
    name: 'Unbekannt',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    moveDate: null,
    fromAddress: '',
    toAddress: '',
    apartment: {},
    services: ['Umzug'],
    distance: 0,
    notes: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'new',
    leadSource: 'unknown-email'
  };

  // Versuche Namen zu finden
  const namePatterns = [
    /Name:\s*(.+?)(?:\n|$)/i,
    /Kunde:\s*(.+?)(?:\n|$)/i,
    /Absender:\s*(.+?)(?:\n|$)/i,
    /Von:\s*(.+?)(?:\n|$)/i,
    /Herr\s+([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)/,
    /Frau\s+([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)/
  ];
  
  for (const pattern of namePatterns) {
    const match = content.match(pattern);
    if (match && match[1].trim() !== '') {
      data.name = match[1].trim();
      const nameParts = data.name.split(' ');
      data.firstName = nameParts[0] || '';
      data.lastName = nameParts.slice(1).join(' ') || '';
      break;
    }
  }

  // Versuche E-Mail zu finden
  const emailMatch = content.match(/[\w\.\-]+@[\w\.\-]+\.\w+/);
  if (emailMatch) {
    data.email = emailMatch[0];
  } else if (emailData.from) {
    // Extrahiere E-Mail aus From-Header
    const fromEmailMatch = emailData.from.match(/<?([\w\.\-]+@[\w\.\-]+\.\w+)>?/);
    if (fromEmailMatch) {
      data.email = fromEmailMatch[1];
    }
  }

  // Versuche Telefon zu finden
  const phonePatterns = [
    /Telefon:\s*([\d\s\+\-\(\)\/]+)(?:\n|$)/i,
    /Tel\.?:\s*([\d\s\+\-\(\)\/]+)(?:\n|$)/i,
    /Handy:\s*([\d\s\+\-\(\)\/]+)(?:\n|$)/i,
    /Mobile:\s*([\d\s\+\-\(\)\/]+)(?:\n|$)/i,
    /\+49[\d\s\-\(\)\/]{10,}/,
    /0[\d\s\-\(\)\/]{9,}/
  ];
  
  for (const pattern of phonePatterns) {
    const match = content.match(pattern);
    if (match) {
      data.phone = normalizePhone(match[1] || match[0]);
      break;
    }
  }

  // Versuche Adressen zu finden
  const addressPattern = /([A-ZÄÖÜ][a-zäöüß]+(?:straße|str\.|weg|platz|allee|gasse))\s+(\d+\w?),?\s*(\d{5})\s+([A-ZÄÖÜ][a-zäöüß]+)/g;
  const addresses = [...content.matchAll(addressPattern)];
  
  if (addresses.length > 0) {
    data.fromAddress = `${addresses[0][1]} ${addresses[0][2]}, ${addresses[0][3]} ${addresses[0][4]}`;
    if (addresses.length > 1) {
      data.toAddress = `${addresses[1][1]} ${addresses[1][2]}, ${addresses[1][3]} ${addresses[1][4]}`;
    }
  }

  // Versuche Datum zu finden
  const datePatterns = [
    /Umzug.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
    /Termin.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
    /Datum.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
    /(\d{1,2}\.\d{1,2}\.\d{4})/
  ];
  
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      data.moveDate = parseGermanDate(match[1]);
      break;
    }
  }

  // Versuche Entfernung zu finden
  const distancePatterns = [
    /Entfernung.*?:\s*(.+?)\s*km/i,
    /Distanz.*?:\s*(.+?)\s*km/i,
    /Strecke.*?:\s*(.+?)\s*km/i,
    /(\d+)\s*km/i
  ];
  
  for (const pattern of distancePatterns) {
    const match = content.match(pattern);
    if (match) {
      data.distance = parseFloat(match[1]) || 0;
      break;
    }
  }
  
  // Füge Original-Text als Notiz hinzu
  data.notes = `E-Mail konnte nicht automatisch geparst werden.\n\nOriginal-Betreff: ${emailData.subject || ''}\n\nInhalt:\n${content.substring(0, 500)}...`;

  return data;
}

module.exports = {
  parseEmail,
  parseImmoScout24Email,
  parseUmzug365Email,
  removeGoogleLinks,
  normalizePhone,
  parseGermanDate
};