import { supabase } from './supabaseService';

export interface ParsedPDFData {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalPrice?: number;
  services: Array<{
    name: string;
    description?: string;
    price?: number;
    quantity?: number;
  }>;
  invoiceNumber?: string;
  date?: string;
  rawText: string;
}

export interface PDFParseResult {
  success: boolean;
  data?: ParsedPDFData;
  error?: string;
}

class PDFParserService {
  private readonly FUNCTION_URL = 'parse-pdf';

  /**
   * Parst eine PDF-Datei und extrahiert Kunden- und Rechnungsinformationen
   * @param pdfFile - Die PDF-Datei als File oder Blob
   * @param customerId - Optional: ID des Kunden, dem die Daten zugeordnet werden sollen
   * @returns Geparste PDF-Daten
   */
  async parsePDF(pdfFile: File | Blob, customerId?: string): Promise<PDFParseResult> {
    try {
      console.log('📄 Starting PDF parsing...');

      // Konvertiere PDF zu Base64
      const pdfBase64 = await this.fileToBase64(pdfFile);

      // Rufe Supabase Edge Function auf
      const { data, error } = await supabase.functions.invoke(this.FUNCTION_URL, {
        body: {
          pdfBase64,
          customerId,
        },
      });

      if (error) {
        console.error('❌ Error calling parse-pdf function:', error);
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
      console.log('Extracted data:', {
        customerName: data.data.customerName,
        totalPrice: data.data.totalPrice,
        servicesCount: data.data.services.length,
      });

      return {
        success: true,
        data: data.data,
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
   * Parst eine PDF und ordnet die Daten einem bestehenden Kunden zu
   * @param pdfFile - Die PDF-Datei
   * @param customerId - ID des Kunden
   * @returns Aktualisierte Kundendaten
   */
  async parsePDFAndAssignToCustomer(pdfFile: File | Blob, customerId: string): Promise<{
    success: boolean;
    data?: ParsedPDFData;
    error?: string;
  }> {
    try {
      // Parse PDF
      const parseResult = await this.parsePDF(pdfFile, customerId);

      if (!parseResult.success || !parseResult.data) {
        return parseResult;
      }

      // Hole aktuellen Kunden
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (fetchError || !customer) {
        console.error('❌ Error fetching customer:', fetchError);
        return {
          success: false,
          error: 'Customer not found',
        };
      }

      // Aktualisiere Kundendaten mit geparsten Informationen
      const updates: any = {};

      if (parseResult.data.customerEmail && !customer.email) {
        updates.email = parseResult.data.customerEmail;
      }

      if (parseResult.data.customerPhone && !customer.phone) {
        updates.phone = parseResult.data.customerPhone;
      }

      // Speichere geparste Daten in einem JSON-Feld (falls vorhanden)
      if (parseResult.data.services.length > 0) {
        updates.parsed_services = parseResult.data.services;
      }

      if (parseResult.data.totalPrice) {
        updates.estimated_price = parseResult.data.totalPrice;
      }

      // Wenn Updates vorhanden, speichere sie
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', customerId);

        if (updateError) {
          console.error('❌ Error updating customer:', updateError);
          return {
            success: false,
            error: 'Failed to update customer',
          };
        }

        console.log('✅ Customer updated with parsed data');
      }

      return parseResult;
    } catch (error: any) {
      console.error('❌ Error in parsePDFAndAssignToCustomer:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Konvertiert eine Datei zu Base64
   * @param file - Die zu konvertierende Datei
   * @returns Base64-String
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
   * Validiert eine PDF-Datei
   * @param file - Die zu validierende Datei
   * @returns True wenn valide, sonst Error-Message
   */
  validatePDFFile(file: File): { valid: boolean; error?: string } {
    // Prüfe Dateityp
    if (file.type !== 'application/pdf') {
      return {
        valid: false,
        error: 'Nur PDF-Dateien sind erlaubt',
      };
    }

    // Prüfe Dateigröße (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'PDF-Datei ist zu groß (max. 10MB)',
      };
    }

    return { valid: true };
  }

  /**
   * Formatiert geparste Leistungen für die Anzeige
   * @param services - Array von Leistungen
   * @returns Formatierter String
   */
  formatServices(services: Array<{ name: string; description?: string; price?: number; quantity?: number }>): string {
    return services
      .map((service) => {
        let line = service.name;
        if (service.quantity) {
          line = `${service.quantity}x ${line}`;
        }
        if (service.price) {
          line += ` - ${service.price.toFixed(2)} €`;
        }
        return line;
      })
      .join('\n');
  }
}

export const pdfParserService = new PDFParserService();
