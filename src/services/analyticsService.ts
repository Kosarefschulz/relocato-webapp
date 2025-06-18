// Google Analytics 4 Service für Event Tracking
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set',
      targetId: string,
      config?: any
    ) => void;
    dataLayer: any[];
  }
}

// Event Types für bessere Typsicherheit
export type AnalyticsEvent = 
  | 'page_view'
  | 'customer_created'
  | 'customer_updated'
  | 'customer_deleted'
  | 'quote_created'
  | 'quote_sent'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'photo_uploaded'
  | 'photo_deleted'
  | 'email_sent'
  | 'search_performed'
  | 'export_pdf'
  | 'import_started'
  | 'import_completed';

interface EventParameters {
  category?: string;
  label?: string;
  value?: number;
  customer_id?: string;
  customer_name?: string;
  quote_id?: string;
  invoice_id?: string;
  amount?: number;
  currency?: string;
  search_term?: string;
  file_type?: string;
  email_type?: string;
  [key: string]: any;
}

class AnalyticsService {
  private measurementId: string;
  private isInitialized: boolean = false;
  private debug: boolean = false;

  constructor() {
    this.measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-MQWV0M47PN';
    this.debug = process.env.NODE_ENV === 'development';
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Initialisiere dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // gtag Funktion
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    // Initialisiere mit config
    window.gtag('config', this.measurementId);

    // Konfiguriere GA4
    window.gtag('config', this.measurementId, {
      page_path: window.location.pathname,
      debug_mode: this.debug
    });

    this.isInitialized = true;
    console.log('📊 Google Analytics initialisiert:', this.measurementId);
  }

  // GTM Script dynamisch laden
  loadGTM(gtmId: string = 'GTM-XXXXXXX') {
    if (!gtmId || gtmId === 'GTM-XXXXXXX') {
      console.warn('⚠️ Keine gültige GTM ID konfiguriert');
      return;
    }

    // GTM Script
    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);

    // GTM NoScript (für Nutzer ohne JavaScript)
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);

    console.log('🏷️ Google Tag Manager geladen:', gtmId);
  }

  // Event senden
  trackEvent(eventName: AnalyticsEvent, parameters?: EventParameters) {
    if (!this.isInitialized) {
      console.warn('Analytics noch nicht initialisiert');
      return;
    }

    if (this.debug) {
      console.log(`📊 Analytics Event: ${eventName}`, parameters);
    }

    window.gtag('event', eventName, {
      ...parameters,
      send_to: this.measurementId
    });
  }

  // Seitenaufruf tracken
  trackPageView(pagePath?: string, pageTitle?: string) {
    this.trackEvent('page_view', {
      page_path: pagePath || window.location.pathname,
      page_title: pageTitle || document.title
    });
  }

  // Kunden-Events
  trackCustomerEvent(action: 'created' | 'updated' | 'deleted', customerId: string, customerName?: string) {
    this.trackEvent(`customer_${action}` as AnalyticsEvent, {
      category: 'customer',
      customer_id: customerId,
      customer_name: customerName
    });
  }

  // Angebots-Events
  trackQuoteEvent(action: 'created' | 'sent' | 'accepted' | 'rejected', quoteId: string, amount?: number) {
    this.trackEvent(`quote_${action}` as AnalyticsEvent, {
      category: 'quote',
      quote_id: quoteId,
      amount: amount,
      currency: 'EUR'
    });
  }

  // Rechnungs-Events
  trackInvoiceEvent(action: 'created' | 'sent' | 'paid', invoiceId: string, amount?: number) {
    this.trackEvent(`invoice_${action}` as AnalyticsEvent, {
      category: 'invoice',
      invoice_id: invoiceId,
      amount: amount,
      currency: 'EUR'
    });
  }

  // Foto-Events
  trackPhotoEvent(action: 'uploaded' | 'deleted', customerId: string, photoCount: number = 1) {
    this.trackEvent(`photo_${action}` as AnalyticsEvent, {
      category: 'photo',
      customer_id: customerId,
      value: photoCount
    });
  }

  // Such-Event
  trackSearch(searchTerm: string, resultCount: number) {
    this.trackEvent('search_performed', {
      category: 'search',
      search_term: searchTerm,
      value: resultCount
    });
  }

  // E-Mail Event
  trackEmail(emailType: string, customerId?: string) {
    this.trackEvent('email_sent', {
      category: 'email',
      email_type: emailType,
      customer_id: customerId
    });
  }

  // PDF Export
  trackPDFExport(documentType: 'quote' | 'invoice', documentId: string) {
    this.trackEvent('export_pdf', {
      category: 'export',
      file_type: documentType,
      label: documentId
    });
  }

  // Import Events
  trackImport(action: 'started' | 'completed', itemCount?: number) {
    this.trackEvent(`import_${action}` as AnalyticsEvent, {
      category: 'import',
      value: itemCount
    });
  }

  // Benutzer-Eigenschaften setzen
  setUserProperties(properties: { [key: string]: any }) {
    if (!this.isInitialized) return;

    window.gtag('set', 'user_properties', properties);
  }

  // E-Commerce Tracking (für Rechnungen)
  trackPurchase(invoiceId: string, amount: number, customerName?: string) {
    if (!this.isInitialized) return;

    window.gtag('event', 'purchase', {
      transaction_id: invoiceId,
      value: amount,
      currency: 'EUR',
      items: [{
        item_id: invoiceId,
        item_name: 'Umzugsservice',
        price: amount,
        quantity: 1,
        item_category: 'service'
      }],
      customer_name: customerName
    });
  }

  // Conversion Tracking
  trackConversion(conversionType: 'quote_to_invoice' | 'lead_to_customer', value?: number) {
    if (!this.isInitialized) return;

    window.gtag('event', 'conversion', {
      conversion_type: conversionType,
      value: value || 0,
      currency: 'EUR'
    });
  }
}

// Singleton Instance
const analyticsService = new AnalyticsService();
export default analyticsService;