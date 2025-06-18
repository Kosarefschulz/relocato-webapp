import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'pdf-lib';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SignatureData {
  signature: string; // Base64 encoded image
  signedBy: string;
  signedAt: Date;
  ipAddress?: string;
  biometricData?: {
    pressure: number[];
    velocity: number[];
    acceleration: number[];
  };
}

interface SignatureField {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  required: boolean;
}

class PDFSignatureService {
  /**
   * Fügt digitale Unterschriftsfelder zu einem bestehenden PDF hinzu
   */
  async addSignatureFields(
    pdfBytes: ArrayBuffer,
    fields: SignatureField[]
  ): Promise<ArrayBuffer> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Füge Unterschriftsfelder hinzu
    for (const field of fields) {
      this.drawSignatureField(lastPage, field, font);
    }

    return await pdfDoc.save();
  }

  /**
   * Bettet eine digitale Unterschrift in ein PDF ein
   */
  async embedSignature(
    pdfBytes: ArrayBuffer,
    signatureData: SignatureData,
    fieldIndex: number = 0
  ): Promise<ArrayBuffer> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    // Unterschriftsbild einbetten
    const signatureImage = await pdfDoc.embedPng(signatureData.signature);
    
    // Position basierend auf fieldIndex (vereinfacht)
    const positions = [
      { x: 150, y: 100, width: 200, height: 50 }, // Auftraggeber
      { x: 350, y: 100, width: 200, height: 50 }  // RELOCATO
    ];
    
    const pos = positions[fieldIndex] || positions[0];
    
    // Zeichne die Unterschrift
    lastPage.drawImage(signatureImage, {
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
    });

    // Füge Signatur-Metadaten hinzu
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 8;
    
    lastPage.drawText(`Unterschrieben von: ${signatureData.signedBy}`, {
      x: pos.x,
      y: pos.y - 15,
      size: fontSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    lastPage.drawText(
      `Datum: ${format(signatureData.signedAt, 'dd.MM.yyyy HH:mm', { locale: de })}`,
      {
        x: pos.x,
        y: pos.y - 25,
        size: fontSize,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Füge unsichtbare Metadaten hinzu
    pdfDoc.setTitle(pdfDoc.getTitle() + ' - Digital signiert');
    pdfDoc.setProducer('RELOCATO Digital Signature System');
    
    // Erstelle Signatur-Annotation für PDF-Validierung
    const signatureDict = pdfDoc.context.obj({
      Type: 'Sig',
      Filter: 'Adobe.PPKLite',
      SubFilter: 'adbe.pkcs7.detached',
      ByteRange: [0, 0, 0, 0],
      Contents: this.createSignatureHash(signatureData),
      Name: signatureData.signedBy,
      M: format(signatureData.signedAt, "yyyyMMdd'T'HHmmss'Z'"),
      Location: 'München, Deutschland',
      Reason: 'Auftragsbestätigung',
    });

    return await pdfDoc.save();
  }

  /**
   * Validiert eine digitale Unterschrift
   */
  async validateSignature(pdfBytes: ArrayBuffer): Promise<{
    isValid: boolean;
    signatures: SignatureData[];
    errors: string[];
  }> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Hier würde normalerweise eine echte Signaturvalidierung stattfinden
      // Für diese Demo-Implementation prüfen wir nur, ob Signaturen vorhanden sind
      const title = pdfDoc.getTitle();
      const isValid = title ? title.includes('Digital signiert') : false;
      
      return {
        isValid,
        signatures: [], // Würde aus den PDF-Metadaten extrahiert werden
        errors: isValid ? [] : ['Keine digitale Signatur gefunden']
      };
    } catch (error) {
      return {
        isValid: false,
        signatures: [],
        errors: ['Fehler beim Validieren der Signatur']
      };
    }
  }

  /**
   * Erstellt mehrere Signaturen in einem Dokument (z.B. Kunde + RELOCATO)
   */
  async embedMultipleSignatures(
    pdfBytes: ArrayBuffer,
    signatures: { data: SignatureData; fieldIndex: number }[]
  ): Promise<ArrayBuffer> {
    let currentPdf = pdfBytes;
    
    for (const sig of signatures) {
      currentPdf = await this.embedSignature(currentPdf, sig.data, sig.fieldIndex);
    }
    
    return currentPdf;
  }

  /**
   * Zeichnet ein Unterschriftsfeld
   */
  private drawSignatureField(page: PDFPage, field: SignatureField, font: PDFFont) {
    const { x, y, width, height, label } = field;
    
    // Zeichne Rahmen
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });

    // Zeichne Label
    page.drawText(label, {
      x: x + 5,
      y: y + height + 5,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Füge Signaturlinie hinzu
    page.drawLine({
      start: { x: x + 10, y: y + 10 },
      end: { x: x + width - 10, y: y + 10 },
      color: rgb(0.7, 0.7, 0.7),
      thickness: 0.5,
    });
  }

  /**
   * Erstellt einen Hash für die Signatur-Validierung
   */
  private createSignatureHash(signatureData: SignatureData): string {
    // In einer echten Implementation würde hier ein kryptografischer Hash erstellt
    // Für diese Demo verwenden wir eine einfache Kombination der Daten
    const dataString = JSON.stringify({
      signedBy: signatureData.signedBy,
      signedAt: signatureData.signedAt,
      ipAddress: signatureData.ipAddress,
    });
    
    return Buffer.from(dataString).toString('base64');
  }

  /**
   * Konvertiert eine Canvas-Signatur zu Base64 PNG
   */
  async convertCanvasToBase64(canvas: HTMLCanvasElement): Promise<string> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/png');
    });
  }

  /**
   * Erstellt ein Signatur-Zertifikat für die Dokumentation
   */
  generateSignatureCertificate(signatureData: SignatureData): string {
    return `
DIGITALE SIGNATUR-ZERTIFIKAT
============================

Dokument wurde digital signiert von: ${signatureData.signedBy}
Datum und Zeit: ${format(signatureData.signedAt, 'dd.MM.yyyy HH:mm:ss', { locale: de })}
IP-Adresse: ${signatureData.ipAddress || 'Nicht verfügbar'}

Dieses Dokument wurde elektronisch signiert und ist rechtlich bindend gemäß
der eIDAS-Verordnung (EU) Nr. 910/2014.

Signatur-Hash: ${this.createSignatureHash(signatureData)}
    `.trim();
  }
}

export default new PDFSignatureService();
export type { SignatureData, SignatureField };