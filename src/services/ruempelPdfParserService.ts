import { supabase } from './supabaseService';
import { offerService, Offer } from './offerService';

// ========== VALIDATION RULES ==========

const VALIDATION_RULES = {
  pflichtfelder: ['offerNumber', 'offerDate', 'pricing.grossAmount'],
  datumFormat: /^\d{2}\.\d{2}\.\d{4}$/,
  waehrung: 'EUR',
  plzFormat: /^\d{5}$/,
  mwstSaetze: [0, 7, 19],
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ParsedRuempelOffer {
  offerNumber?: string;
  customerNumber?: string;
  offerDate?: string;
  validUntil?: string;
  customer: {
    salutation?: string;
    firstName?: string;
    lastName?: string;
    street?: string;
    zipCode?: string;
    city?: string;
    fullAddress?: string;
  };
  service: {
    type?: string;
    objectSize?: string;
    rooms?: string[];
    exceptions?: string[];
    condition?: string;
  };
  pricing: {
    netAmount?: number;
    vatRate?: number;
    vatAmount?: number;
    grossAmount?: number;
    priceType?: string;
  };
  appointments?: Array<{ date?: string; time?: string }>;
  payment: {
    timing?: string;
    methods?: string[];
  };
  rawText: string;
  documentType?: string;
}

// ========== SERVICE CLASS ==========

class RuempelPdfParserService {
  private readonly FUNCTION_URL = 'parse-pdf-ruempel';

  /**
   * Validiere PDF-Datei
   */
  validatePDFFile(file: File): { valid: boolean; error?: string } {
    // Dateityp prüfen
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Nur PDF-Dateien sind erlaubt' };
    }

    // Dateigröße prüfen
    if (file.size > VALIDATION_RULES.maxFileSize) {
      return { valid: false, error: 'PDF-Datei ist zu groß (max. 10MB)' };
    }

    return { valid: true };
  }

  /**
   * Validiere geparste Daten
   */
  validateParsedData(data: ParsedRuempelOffer): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Pflichtfelder prüfen
    if (!data.offerNumber) {
      errors.push('Angebotsnummer fehlt');
    }

    if (!data.offerDate) {
      errors.push('Angebotsdatum fehlt');
    } else if (!VALIDATION_RULES.datumFormat.test(data.offerDate)) {
      errors.push(`Angebotsdatum hat falsches Format: ${data.offerDate}`);
    }

    if (!data.pricing?.grossAmount) {
      errors.push('Bruttobetrag fehlt');
    }

    // Kundendaten prüfen
    if (!data.customer.firstName && !data.customer.lastName) {
      warnings.push('Kundenname konnte nicht extrahiert werden');
    }

    if (data.customer.zipCode && !VALIDATION_RULES.plzFormat.test(data.customer.zipCode)) {
      warnings.push(`PLZ hat ungültiges Format: ${data.customer.zipCode}`);
    }

    // MwSt-Satz prüfen
    if (
      data.pricing?.vatRate &&
      !VALIDATION_RULES.mwstSaetze.includes(data.pricing.vatRate)
    ) {
      warnings.push(`Ungewöhnlicher MwSt-Satz: ${data.pricing.vatRate}%`);
    }

    // Preise validieren
    if (
      data.pricing?.netAmount &&
      data.pricing?.vatAmount &&
      data.pricing?.grossAmount
    ) {
      const calculatedGross = data.pricing.netAmount + data.pricing.vatAmount;
      const difference = Math.abs(calculatedGross - data.pricing.grossAmount);

      if (difference > 0.02) {
        // Erlaubt 2 Cent Rundungsdifferenz
        warnings.push(
          `Preisberechnung stimmt nicht überein: ${calculatedGross.toFixed(2)} ≠ ${data.pricing.grossAmount.toFixed(2)}`
        );
      }
    }

    // Gültigkeitsdatum prüfen
    if (data.validUntil && data.offerDate) {
      const offerDate = this.parseGermanDate(data.offerDate);
      const validUntil = this.parseGermanDate(data.validUntil);

      if (validUntil && offerDate && validUntil < offerDate) {
        errors.push('Gültigkeitsdatum liegt vor Angebotsdatum');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Parse deutsches Datum (DD.MM.YYYY) zu Date-Objekt
   */
  private parseGermanDate(dateStr: string): Date | null {
    const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return null;

    const [, day, month, year] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  /**
   * Konvertiere deutsches Datum zu ISO-Format (YYYY-MM-DD)
   */
  private germanDateToISO(dateStr: string): string | null {
    const date = this.parseGermanDate(dateStr);
    if (!date) return null;

    return date.toISOString().split('T')[0];
  }

  /**
   * Parse PDF und validiere Daten
   */
  async parsePDF(pdfFile: File): Promise<{
    success: boolean;
    data?: ParsedRuempelOffer;
    validation?: ValidationResult;
    error?: string;
  }> {
    try {
      console.log('📄 Parsing Rümpel Schmiede PDF...');

      // Validiere Datei
      const fileValidation = this.validatePDFFile(pdfFile);
      if (!fileValidation.valid) {
        return {
          success: false,
          error: fileValidation.error,
        };
      }

      // Konvertiere zu Base64
      const pdfBase64 = await this.fileToBase64(pdfFile);

      // Rufe Supabase Edge Function auf
      const { data, error } = await supabase.functions.invoke(this.FUNCTION_URL, {
        body: { pdfBase64 },
      });

      if (error) {
        console.error('❌ Error calling parse-pdf-ruempel function:', error);
        throw error;
      }

      if (!data.success) {
        console.error('❌ PDF parsing failed:', data.error);
        return {
          success: false,
          error: data.error,
        };
      }

      console.log('✅ PDF parsed successfully');

      // Validiere geparste Daten
      const validation = this.validateParsedData(data.data);

      if (!validation.valid) {
        console.warn('⚠️ Validation errors:', validation.errors);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Validation warnings:', validation.warnings);
      }

      return {
        success: true,
        data: data.data,
        validation,
      };
    } catch (error: any) {
      console.error('❌ Error in parsePDF:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Parse PDF und erstelle Angebot im CRM
   */
  async parsePDFAndCreateOffer(
    pdfFile: File,
    customerId: string
  ): Promise<{
    success: boolean;
    offer?: Offer;
    validation?: ValidationResult;
    error?: string;
  }> {
    try {
      // Parse PDF
      const parseResult = await this.parsePDF(pdfFile);

      if (!parseResult.success || !parseResult.data) {
        return {
          success: false,
          error: parseResult.error,
          validation: parseResult.validation,
        };
      }

      // Prüfe Validierung
      if (parseResult.validation && !parseResult.validation.valid) {
        return {
          success: false,
          error: `Validierung fehlgeschlagen: ${parseResult.validation.errors.join(', ')}`,
          validation: parseResult.validation,
        };
      }

      // Konvertiere Datums-Format
      const parsedData = parseResult.data;
      if (parsedData.offerDate) {
        const isoDate = this.germanDateToISO(parsedData.offerDate);
        if (isoDate) parsedData.offerDate = isoDate;
      }
      if (parsedData.validUntil) {
        const isoDate = this.germanDateToISO(parsedData.validUntil);
        if (isoDate) parsedData.validUntil = isoDate;
      }

      // Erstelle Angebot
      const offer = await offerService.createOfferFromPDF(
        parsedData,
        customerId,
        pdfFile.name
      );

      console.log('✅ Offer created in CRM:', offer.offer_number);

      return {
        success: true,
        offer,
        validation: parseResult.validation,
      };
    } catch (error: any) {
      console.error('❌ Error in parsePDFAndCreateOffer:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Prüfe ob Kunde mit diesen Daten bereits existiert
   */
  async findExistingCustomer(
    parsedData: ParsedRuempelOffer
  ): Promise<string | null> {
    try {
      // Suche nach Kundennummer
      if (parsedData.customerNumber) {
        const { data } = await supabase
          .from('customers')
          .select('id')
          .eq('customer_number', parsedData.customerNumber)
          .maybeSingle();

        if (data) return data.id;
      }

      // Suche nach Name + PLZ
      if (
        parsedData.customer.lastName &&
        parsedData.customer.zipCode
      ) {
        const fullName = `${parsedData.customer.firstName || ''} ${parsedData.customer.lastName}`.trim();

        const { data } = await supabase
          .from('customers')
          .select('id')
          .ilike('name', `%${fullName}%`)
          .ilike('address', `%${parsedData.customer.zipCode}%`)
          .maybeSingle();

        if (data) return data.id;
      }

      return null;
    } catch (error) {
      console.error('❌ Error finding existing customer:', error);
      return null;
    }
  }

  /**
   * Erstelle oder aktualisiere Kunden aus PDF-Daten
   */
  async upsertCustomerFromPDF(
    parsedData: ParsedRuempelOffer
  ): Promise<string> {
    try {
      // Prüfe ob Kunde existiert
      const existingCustomerId = await this.findExistingCustomer(parsedData);

      if (existingCustomerId) {
        console.log('✅ Found existing customer:', existingCustomerId);
        return existingCustomerId;
      }

      // Erstelle neuen Kunden
      const customerData: any = {
        name: `${parsedData.customer.firstName || ''} ${parsedData.customer.lastName || ''}`.trim(),
        customer_number: parsedData.customerNumber,
        address: parsedData.customer.fullAddress,
        created_at: new Date().toISOString(),
        source: 'PDF Import (Rümpel Schmiede)',
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select('id')
        .single();

      if (error) throw error;

      console.log('✅ Created new customer:', data.id);
      return data.id;
    } catch (error: any) {
      console.error('❌ Error upserting customer:', error);
      throw error;
    }
  }

  /**
   * Konvertiere Datei zu Base64
   */
  private async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Formatiere Validierungsergebnisse für Anzeige
   */
  formatValidationResults(validation: ValidationResult): string {
    const parts: string[] = [];

    if (validation.errors.length > 0) {
      parts.push('❌ Fehler:');
      validation.errors.forEach((e) => parts.push(`  - ${e}`));
    }

    if (validation.warnings.length > 0) {
      parts.push('⚠️ Warnungen:');
      validation.warnings.forEach((w) => parts.push(`  - ${w}`));
    }

    if (validation.valid) {
      parts.push('✅ Alle Pflichtfelder vorhanden');
    }

    return parts.join('\n');
  }
}

export const ruempelPdfParserService = new RuempelPdfParserService();
