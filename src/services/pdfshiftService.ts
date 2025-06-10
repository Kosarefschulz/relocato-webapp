import axios from 'axios';

const PDFSHIFT_API_KEY = 'sk_14a4ecfc1ba71f54456ab30bf80897383eeb714e';
const PDFSHIFT_API_URL = 'https://api.pdfshift.io/v3/convert/pdf';

interface PDFShiftOptions {
  source: string;
  landscape?: boolean;
  use_print?: boolean;
  format?: 'A4' | 'Letter' | 'Legal';
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  wait_for?: string;
  css?: string;
}

export const generatePDFWithPDFShift = async (html: string): Promise<ArrayBuffer> => {
  try {
    const options: PDFShiftOptions = {
      source: html,
      landscape: false,
      use_print: true,
      format: 'A4',
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      },
      // Zusätzliches CSS für bessere PDF-Darstellung
      css: `
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `
    };

    // Base64 encoding for browser environment
    const authString = btoa(`api:${PDFSHIFT_API_KEY}`);

    const response = await axios.post(
      PDFSHIFT_API_URL,
      options,
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    return response.data;
  } catch (error) {
    console.error('PDFShift Error:', error);
    throw new Error('PDF-Generierung fehlgeschlagen');
  }
};