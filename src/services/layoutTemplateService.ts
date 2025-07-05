import { LayoutTemplate } from '../types/layoutEditor';

const STORAGE_KEY = 'quoteLayoutTemplates';

// Default templates
export const getDefaultTemplates = (): LayoutTemplate[] => [
  {
    id: 'default-classic',
    name: 'Klassisches Angebot',
    description: 'Traditionelles Layout mit Header und strukturierter Aufstellung',
    isDefault: true,
    company: 'relocato',
    pages: [
      {
        id: 'page-1',
        pageNumber: 1,
        width: 210,
        height: 297,
        elements: [
          // Company Logo
          {
            id: 'logo',
            type: 'text',
            position: { x: 25, y: 20 },
            size: { width: 60, height: 20 },
            zIndex: 1,
            locked: false,
            visible: true,
            properties: {
              type: 'text',
              content: 'RELOCATO®',
              fontFamily: 'Helvetica',
              fontSize: 24,
              fontWeight: 'bold',
              fontStyle: 'normal',
              textAlign: 'left',
              lineHeight: 1,
              letterSpacing: 0,
              color: '#333333',
              padding: 0,
            },
          },
          // Title
          {
            id: 'title',
            type: 'text',
            position: { x: 25, y: 50 },
            size: { width: 160, height: 15 },
            zIndex: 2,
            locked: false,
            visible: true,
            properties: {
              type: 'text',
              content: 'Umzugsangebot',
              fontFamily: 'Helvetica',
              fontSize: 20,
              fontWeight: 'bold',
              fontStyle: 'normal',
              textAlign: 'center',
              lineHeight: 1,
              letterSpacing: 0,
              color: '#8BC34A',
              padding: 0,
            },
          },
          // Customer Info
          {
            id: 'customer-info',
            type: 'variable',
            position: { x: 25, y: 80 },
            size: { width: 80, height: 40 },
            zIndex: 3,
            locked: false,
            visible: true,
            properties: {
              type: 'variable',
              variableName: 'customerName',
              style: {
                fontFamily: 'Helvetica',
                fontSize: 12,
                fontWeight: 'normal',
                color: '#000000',
              },
            },
          },
          // Quote Details Table
          {
            id: 'quote-table',
            type: 'table',
            position: { x: 25, y: 130 },
            size: { width: 160, height: 80 },
            zIndex: 4,
            locked: false,
            visible: true,
            properties: {
              type: 'table',
              headers: ['Leistung', 'Beschreibung', 'Preis'],
              rows: [
                ['Umzugsservice', 'Kompletter Umzug inkl. Transport', '{{totalPrice}}'],
                ['Verpackung', 'Professionelle Verpackung', 'Inklusive'],
                ['Montage', 'Möbelmontage/-demontage', 'Inklusive'],
              ],
              showHeaders: true,
              headerStyle: {
                backgroundColor: '#f5f5f5',
                color: '#000000',
                fontWeight: 'bold',
                fontSize: 11,
              },
              cellStyle: {
                borderColor: '#dddddd',
                borderWidth: 0.5,
                padding: 5,
                fontSize: 10,
              },
            },
          },
          // QR Code
          {
            id: 'qr-code',
            type: 'qrcode',
            position: { x: 150, y: 230 },
            size: { width: 35, height: 35 },
            zIndex: 5,
            locked: false,
            visible: true,
            properties: {
              type: 'qrcode',
              data: 'https://relocato.de/confirm/{{quoteNumber}}',
              errorCorrectionLevel: 'M',
              margin: 2,
              darkColor: '#000000',
              lightColor: '#ffffff',
            },
          },
          // Signature Field
          {
            id: 'signature',
            type: 'signature',
            position: { x: 25, y: 240 },
            size: { width: 80, height: 40 },
            zIndex: 6,
            locked: false,
            visible: true,
            properties: {
              type: 'signature',
              label: 'Unterschrift Kunde',
              lineColor: '#000000',
              lineWidth: 0.5,
              showDate: true,
              showName: true,
            },
          },
        ],
      },
    ],
    settings: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      gridSize: 5,
      snapToGrid: true,
      showRulers: true,
      showGuides: true,
      units: 'mm',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'default-modern',
    name: 'Modernes Design',
    description: 'Zeitgemäßes Layout mit Seitenleiste und modernen Elementen',
    isDefault: true,
    company: 'relocato',
    pages: [
      {
        id: 'page-1',
        pageNumber: 1,
        width: 210,
        height: 297,
        backgroundColor: '#f8f9fa',
        elements: [
          // Sidebar
          {
            id: 'sidebar',
            type: 'shape',
            position: { x: 0, y: 0 },
            size: { width: 60, height: 297 },
            zIndex: 1,
            locked: true,
            visible: true,
            properties: {
              type: 'shape',
              shapeType: 'rectangle',
              fillColor: '#1976d2',
              strokeColor: '#1976d2',
              strokeWidth: 0,
              strokeStyle: 'solid',
            },
          },
          // Logo in sidebar
          {
            id: 'logo-sidebar',
            type: 'text',
            position: { x: 10, y: 20 },
            size: { width: 40, height: 30 },
            zIndex: 2,
            locked: true,
            visible: true,
            properties: {
              type: 'text',
              content: 'R',
              fontFamily: 'Helvetica',
              fontSize: 36,
              fontWeight: 'bold',
              fontStyle: 'normal',
              textAlign: 'center',
              lineHeight: 1,
              letterSpacing: 0,
              color: '#ffffff',
              padding: 0,
            },
          },
          // Main content area
          {
            id: 'main-title',
            type: 'text',
            position: { x: 80, y: 30 },
            size: { width: 110, height: 20 },
            zIndex: 3,
            locked: false,
            visible: true,
            properties: {
              type: 'text',
              content: 'Ihr persönliches Angebot',
              fontFamily: 'Helvetica',
              fontSize: 22,
              fontWeight: 'light',
              fontStyle: 'normal',
              textAlign: 'left',
              lineHeight: 1,
              letterSpacing: 0,
              color: '#333333',
              padding: 0,
            },
          },
        ],
      },
    ],
    settings: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 0, right: 20, bottom: 20, left: 0 },
      gridSize: 5,
      snapToGrid: true,
      showRulers: true,
      showGuides: true,
      units: 'mm',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'default-ruempelschmiede',
    name: 'Rümpel Schmiede',
    description: 'Template für Entrümpelungsangebote',
    isDefault: true,
    company: 'ruempelschmiede',
    pages: [
      {
        id: 'page-1',
        pageNumber: 1,
        width: 210,
        height: 297,
        backgroundColor: '#2c3e50',
        elements: [
          // Background accent
          {
            id: 'bg-accent',
            type: 'shape',
            position: { x: 0, y: 0 },
            size: { width: 210, height: 100 },
            zIndex: 1,
            locked: true,
            visible: true,
            properties: {
              type: 'shape',
              shapeType: 'rectangle',
              fillColor: '#34495e',
              strokeColor: '#34495e',
              strokeWidth: 0,
              strokeStyle: 'solid',
            },
          },
          // Company name
          {
            id: 'company-name',
            type: 'text',
            position: { x: 25, y: 30 },
            size: { width: 160, height: 30 },
            zIndex: 2,
            locked: false,
            visible: true,
            properties: {
              type: 'text',
              content: 'RÜMPEL SCHMIEDE',
              fontFamily: 'Helvetica',
              fontSize: 28,
              fontWeight: 'bold',
              fontStyle: 'normal',
              textAlign: 'center',
              lineHeight: 1,
              letterSpacing: 2,
              color: '#ecf0f1',
              padding: 0,
            },
          },
        ],
      },
    ],
    settings: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      gridSize: 5,
      snapToGrid: true,
      showRulers: true,
      showGuides: true,
      units: 'mm',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Load templates from localStorage
export const loadTemplates = async (): Promise<LayoutTemplate[]> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const templates = JSON.parse(stored);
      // Convert date strings back to Date objects
      return templates.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Error loading templates:', error);
  }
  return [];
};

// Save templates to localStorage
export const saveTemplates = async (templates: LayoutTemplate[]): Promise<void> => {
  try {
    // Only save custom templates (not default ones)
    const customTemplates = templates.filter(t => !t.isDefault);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates));
  } catch (error) {
    console.error('Error saving templates:', error);
  }
};

// Save a single template
export const saveTemplate = async (template: LayoutTemplate): Promise<void> => {
  const templates = await loadTemplates();
  const index = templates.findIndex(t => t.id === template.id);
  
  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }
  
  await saveTemplates(templates);
};

// Delete a template
export const deleteTemplate = async (templateId: string): Promise<void> => {
  const templates = await loadTemplates();
  const filtered = templates.filter(t => t.id !== templateId);
  await saveTemplates(filtered);
};