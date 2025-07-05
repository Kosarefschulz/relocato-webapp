// Layout Editor Types
export interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  pages: LayoutPage[];
  settings: TemplateSettings;
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
  company?: 'relocato' | 'wertvoll' | 'ruempelschmiede';
}

export interface LayoutPage {
  id: string;
  pageNumber: number;
  background?: string; // Briefpapier URL
  backgroundColor?: string;
  elements: LayoutElement[];
  width: number; // in mm
  height: number; // in mm
}

export interface LayoutElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'shape' | 'variable' | 'qrcode' | 'signature';
  position: Position;
  size: Size;
  rotation?: number;
  zIndex: number;
  locked?: boolean;
  visible: boolean;
  properties: ElementProperties;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TemplateSettings {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  gridSize: number;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  units: 'mm' | 'px' | 'in';
}

export type ElementProperties = 
  | TextProperties
  | ImageProperties
  | TableProperties
  | ShapeProperties
  | VariableProperties
  | QRCodeProperties
  | SignatureProperties;

export interface TextProperties {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  color: string;
  backgroundColor?: string;
  padding: number;
  borderRadius?: number;
  shadow?: {
    x: number;
    y: number;
    blur: number;
    color: string;
  };
}

export interface ImageProperties {
  type: 'image';
  src: string;
  alt?: string;
  fit: 'contain' | 'cover' | 'fill' | 'none';
  opacity?: number;
  borderRadius?: number;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
}

export interface TableProperties {
  type: 'table';
  headers: string[];
  rows: string[][];
  showHeaders: boolean;
  headerStyle: {
    backgroundColor: string;
    color: string;
    fontWeight: 'normal' | 'bold';
    fontSize: number;
  };
  cellStyle: {
    borderColor: string;
    borderWidth: number;
    padding: number;
    fontSize: number;
  };
  alternateRowColor?: string;
}

export interface ShapeProperties {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line' | 'arrow';
  fillColor?: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number; // for rectangles
  arrowHead?: 'none' | 'arrow' | 'dot'; // for lines
}

export interface VariableProperties {
  type: 'variable';
  variableName: string;
  format?: string; // e.g., 'currency', 'date', 'number'
  fallback?: string;
  style: Partial<TextProperties>;
}

export interface QRCodeProperties {
  type: 'qrcode';
  data: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  darkColor: string;
  lightColor: string;
}

export interface SignatureProperties {
  type: 'signature';
  label: string;
  lineColor: string;
  lineWidth: number;
  showDate: boolean;
  showName: boolean;
}

// Editor State
export interface EditorState {
  selectedElementId: string | null;
  selectedPageId: string;
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  isDragging: boolean;
  isResizing: boolean;
  clipboard: LayoutElement | null;
  history: {
    past: LayoutTemplate[];
    future: LayoutTemplate[];
  };
}

// Available Variables for Templates
export interface TemplateVariable {
  name: string;
  displayName: string;
  category: 'customer' | 'quote' | 'company' | 'date' | 'custom';
  format?: string;
  example: string;
}

export const AVAILABLE_VARIABLES: TemplateVariable[] = [
  // Customer Variables
  { name: 'customerName', displayName: 'Kundenname', category: 'customer', example: 'Max Mustermann' },
  { name: 'customerEmail', displayName: 'Kunden E-Mail', category: 'customer', example: 'kunde@example.com' },
  { name: 'customerPhone', displayName: 'Telefonnummer', category: 'customer', example: '+49 123 456789' },
  { name: 'customerAddress', displayName: 'Kundenadresse', category: 'customer', example: 'Musterstraße 1, 12345 Musterstadt' },
  
  // Quote Variables
  { name: 'quoteNumber', displayName: 'Angebotsnummer', category: 'quote', example: 'ANG-2024-001' },
  { name: 'totalPrice', displayName: 'Gesamtpreis', category: 'quote', format: 'currency', example: '1.234,56 €' },
  { name: 'netPrice', displayName: 'Nettopreis', category: 'quote', format: 'currency', example: '1.038,20 €' },
  { name: 'vatAmount', displayName: 'MwSt.-Betrag', category: 'quote', format: 'currency', example: '196,36 €' },
  { name: 'movingDate', displayName: 'Umzugsdatum', category: 'quote', format: 'date', example: '15.03.2024' },
  { name: 'fromAddress', displayName: 'Von Adresse', category: 'quote', example: 'Alte Straße 1, 12345 Altstadt' },
  { name: 'toAddress', displayName: 'Nach Adresse', category: 'quote', example: 'Neue Straße 2, 54321 Neustadt' },
  { name: 'volume', displayName: 'Volumen', category: 'quote', example: '45 m³' },
  { name: 'distance', displayName: 'Entfernung', category: 'quote', example: '250 km' },
  
  // Company Variables
  { name: 'companyName', displayName: 'Firmenname', category: 'company', example: 'RELOCATO®' },
  { name: 'companyAddress', displayName: 'Firmenadresse', category: 'company', example: 'Albrechtstraße 27, 33615 Bielefeld' },
  { name: 'companyPhone', displayName: 'Firmentelefon', category: 'company', example: '(0521) 1200551-0' },
  { name: 'companyEmail', displayName: 'Firmen E-Mail', category: 'company', example: 'bielefeld@relocato.de' },
  { name: 'companyWebsite', displayName: 'Webseite', category: 'company', example: 'www.relocato.de' },
  
  // Date Variables
  { name: 'currentDate', displayName: 'Aktuelles Datum', category: 'date', format: 'date', example: '05.07.2025' },
  { name: 'validUntil', displayName: 'Gültig bis', category: 'date', format: 'date', example: '19.07.2025' },
];