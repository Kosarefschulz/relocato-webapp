import { CompanyType } from './company';

export type { CompanyType };
export type TemplateType = 'quote' | 'invoice' | 'contract' | 'receipt';

export type ContentBlockType = 
  | 'header'
  | 'footer'
  | 'logo'
  | 'company_info'
  | 'customer_info'
  | 'service_list'
  | 'pricing_table'
  | 'terms'
  | 'signature'
  | 'custom';

export interface PageSettings {
  format: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface PDFTemplate {
  id: string;
  companyType: CompanyType;
  templateType: TemplateType;
  name: string;
  description?: string;
  isActive: boolean;
  pageSettings: PageSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  contentBlocks?: TemplateContentBlock[];
}

export interface BlockSettings {
  font?: {
    family?: string;
    size?: number;
    weight?: 'normal' | 'bold';
    style?: 'normal' | 'italic';
  };
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface BlockContent {
  text?: string;
  html?: string;
  template?: string; // Handlebars or similar template
  data?: Record<string, any>;
  items?: any[]; // For lists and tables
}

export interface TemplateContentBlock {
  id: string;
  templateId: string;
  blockType: ContentBlockType;
  name: string;
  position: number;
  pageNumber: number;
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  settings: BlockSettings;
  content: BlockContent;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyBranding {
  id: string;
  companyType: CompanyType;
  logoUrl?: string;
  letterheadUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  headerSettings?: Record<string, any>;
  footerSettings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCatalogItem {
  id: string;
  companyType: CompanyType;
  serviceCode: string;
  serviceName: string;
  description?: string;
  unit?: string;
  basePrice?: number;
  category?: string;
  isActive: boolean;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  id: string;
  templateId: string;
  variableName: string;
  variableType: 'text' | 'number' | 'date' | 'boolean' | 'list';
  defaultValue?: string;
  isRequired: boolean;
  validationRules?: Record<string, any>;
  createdAt: Date;
}

export interface PDFGenerationData {
  template: PDFTemplate;
  branding: CompanyBranding;
  customer: any;
  quote?: any;
  invoice?: any;
  services?: ServiceCatalogItem[];
  variables?: Record<string, any>;
}