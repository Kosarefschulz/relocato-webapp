import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analyticsService from '../services/analyticsService';

// Hook für automatisches Seiten-Tracking
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view bei jedem Routenwechsel
    analyticsService.trackPageView(location.pathname);
  }, [location.pathname]); // Nur pathname als Dependency, nicht das ganze location Objekt
};

// Hook für Analytics-Funktionen
export const useAnalytics = () => {
  return {
    // Kunden-Events
    trackCustomerCreated: (customerId: string, customerName?: string) => {
      analyticsService.trackCustomerEvent('created', customerId, customerName);
    },
    
    trackCustomerUpdated: (customerId: string, customerName?: string) => {
      analyticsService.trackCustomerEvent('updated', customerId, customerName);
    },
    
    trackCustomerDeleted: (customerId: string) => {
      analyticsService.trackCustomerEvent('deleted', customerId);
    },

    // Angebots-Events
    trackQuoteCreated: (quoteId: string, amount?: number) => {
      analyticsService.trackQuoteEvent('created', quoteId, amount);
    },
    
    trackQuoteSent: (quoteId: string, amount?: number) => {
      analyticsService.trackQuoteEvent('sent', quoteId, amount);
    },
    
    trackQuoteAccepted: (quoteId: string, amount?: number) => {
      analyticsService.trackQuoteEvent('accepted', quoteId, amount);
      // Auch als Conversion tracken
      analyticsService.trackConversion('quote_to_invoice', amount);
    },
    
    trackQuoteRejected: (quoteId: string) => {
      analyticsService.trackQuoteEvent('rejected', quoteId);
    },

    // Rechnungs-Events
    trackInvoiceCreated: (invoiceId: string, amount?: number) => {
      analyticsService.trackInvoiceEvent('created', invoiceId, amount);
    },
    
    trackInvoiceSent: (invoiceId: string, amount?: number) => {
      analyticsService.trackInvoiceEvent('sent', invoiceId, amount);
    },
    
    trackInvoicePaid: (invoiceId: string, amount: number, customerName?: string) => {
      analyticsService.trackInvoiceEvent('paid', invoiceId, amount);
      analyticsService.trackPurchase(invoiceId, amount, customerName);
    },

    // Foto-Events
    trackPhotoUploaded: (customerId: string, photoCount: number = 1) => {
      analyticsService.trackPhotoEvent('uploaded', customerId, photoCount);
    },
    
    trackPhotoDeleted: (customerId: string) => {
      analyticsService.trackPhotoEvent('deleted', customerId);
    },

    // Such-Event
    trackSearch: (searchTerm: string, resultCount: number) => {
      analyticsService.trackSearch(searchTerm, resultCount);
    },

    // E-Mail Event
    trackEmailSent: (emailType: string, customerId?: string) => {
      analyticsService.trackEmail(emailType, customerId);
    },

    // PDF Export
    trackPDFExport: (documentType: 'quote' | 'invoice', documentId: string) => {
      analyticsService.trackPDFExport(documentType, documentId);
    },

    // Import Events
    trackImportStarted: (itemCount?: number) => {
      analyticsService.trackImport('started', itemCount);
    },
    
    trackImportCompleted: (itemCount?: number) => {
      analyticsService.trackImport('completed', itemCount);
    },

    // Direkte Service-Referenz für erweiterte Funktionen
    service: analyticsService
  };
};