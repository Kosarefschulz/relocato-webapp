import { QuoteTemplate } from '../types';

class QuoteTemplateService {
  private readonly STORAGE_KEY = 'quoteTemplates';
  
  // Vordefinierte Standard-Templates
  private defaultTemplates: QuoteTemplate[] = [
    {
      id: 'standard-komplett',
      name: 'Komplett-Service',
      description: 'Umfassendes Umzugspaket mit allen Leistungen',
      isDefault: true,
      services: [
        {
          name: 'Umzugstransport',
          basePrice: 450,
          pricePerUnit: 65,
          unit: 'Stunde',
          included: true,
          category: 'transport'
        },
        {
          name: 'Umzugshelfer',
          basePrice: 0,
          pricePerUnit: 35,
          unit: 'Stunde',
          included: true,
          category: 'transport'
        },
        {
          name: 'Umzugskartons (Standard)',
          basePrice: 2.5,
          pricePerUnit: 2.5,
          unit: 'Pauschale',
          included: true,
          category: 'verpackung'
        },
        {
          name: 'Verpackungsmaterial',
          basePrice: 50,
          included: true,
          category: 'verpackung'
        },
        {
          name: 'Möbelmontage/Demontage',
          basePrice: 0,
          pricePerUnit: 65,
          unit: 'Stunde',
          included: true,
          category: 'montage'
        },
        {
          name: 'Küchenmontage',
          basePrice: 250,
          included: false,
          category: 'montage'
        },
        {
          name: 'Einpackservice',
          basePrice: 0,
          pricePerUnit: 45,
          unit: 'Stunde',
          included: false,
          category: 'verpackung'
        },
        {
          name: 'Auspackservice',
          basePrice: 0,
          pricePerUnit: 45,
          unit: 'Stunde',
          included: false,
          category: 'verpackung'
        }
      ],
      discounts: [
        {
          name: 'Frühbucherrabatt',
          type: 'percentage',
          value: 5,
          condition: 'Bei Buchung mindestens 4 Wochen im Voraus'
        }
      ],
      additionalText: {
        introduction: 'Vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot für Ihren Umzug.',
        conclusion: 'Bei Fragen stehen wir Ihnen gerne zur Verfügung. Wir freuen uns auf Ihren Auftrag!',
        terms: [
          'Alle Preise verstehen sich inklusive MwSt.',
          'Zahlung innerhalb von 14 Tagen nach Rechnungserhalt',
          'Haftpflichtversicherung bis 620€ pro cbm gemäß §451e HGB',
          'Kostenlose Stornierung bis 48h vor Umzugstermin'
        ]
      },
      priceFactors: {
        floorMultiplier: 25,
        noElevatorMultiplier: 1.15,
        distanceBaseKm: 50,
        pricePerExtraKm: 1.2
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'System'
    },
    {
      id: 'budget-selbstpacker',
      name: 'Budget - Selbstpacker',
      description: 'Günstiges Angebot für Selbstpacker',
      services: [
        {
          name: 'Umzugstransport',
          basePrice: 350,
          pricePerUnit: 55,
          unit: 'Stunde',
          included: true,
          category: 'transport'
        },
        {
          name: 'Möbeltransport',
          basePrice: 0,
          included: true,
          category: 'transport'
        },
        {
          name: 'Umzugskartons (Miete)',
          basePrice: 1.5,
          pricePerUnit: 1.5,
          unit: 'Pauschale',
          included: false,
          category: 'verpackung'
        },
        {
          name: 'Tragehilfe',
          basePrice: 0,
          pricePerUnit: 35,
          unit: 'Stunde',
          included: false,
          category: 'transport'
        }
      ],
      discounts: [
        {
          name: 'Online-Buchungsrabatt',
          type: 'percentage',
          value: 3,
          condition: 'Bei Online-Buchung'
        }
      ],
      additionalText: {
        introduction: 'Hier unser günstiges Angebot für Selbstpacker.',
        conclusion: 'Sparen Sie mit unserem Budget-Angebot!',
        terms: [
          'Verpackung erfolgt durch den Kunden',
          'Möbel müssen demontiert bereitgestellt werden',
          'Zahlung in bar am Umzugstag oder Vorkasse'
        ]
      },
      priceFactors: {
        floorMultiplier: 20,
        noElevatorMultiplier: 1.1,
        distanceBaseKm: 30,
        pricePerExtraKm: 1.0
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'System'
    },
    {
      id: 'premium-sorglos',
      name: 'Premium Sorglos-Paket',
      description: 'All-inclusive Umzug mit Premium-Service',
      services: [
        {
          name: 'Premium Umzugstransport',
          basePrice: 650,
          pricePerUnit: 85,
          unit: 'Stunde',
          included: true,
          category: 'transport'
        },
        {
          name: 'Vollständiger Verpackungsservice',
          basePrice: 200,
          pricePerUnit: 55,
          unit: 'Stunde',
          included: true,
          category: 'verpackung'
        },
        {
          name: 'Premium Verpackungsmaterial',
          basePrice: 150,
          included: true,
          category: 'verpackung'
        },
        {
          name: 'Möbelmontage/Demontage (komplett)',
          basePrice: 150,
          included: true,
          category: 'montage'
        },
        {
          name: 'Küchen Ab- und Aufbau',
          basePrice: 350,
          included: true,
          category: 'montage'
        },
        {
          name: 'Reinigungsservice (alte Wohnung)',
          basePrice: 250,
          included: true,
          category: 'sonstiges'
        },
        {
          name: 'Handwerker-Service',
          basePrice: 0,
          pricePerUnit: 75,
          unit: 'Stunde',
          included: false,
          category: 'sonstiges'
        },
        {
          name: 'Einlagerung (pro Woche)',
          basePrice: 0,
          pricePerUnit: 15,
          unit: 'qm',
          included: false,
          category: 'sonstiges'
        }
      ],
      discounts: [],
      additionalText: {
        introduction: 'Für Ihren stressfreien Umzug bieten wir Ihnen unser Premium Sorglos-Paket an.',
        conclusion: 'Lehnen Sie sich zurück - wir kümmern uns um alles!',
        terms: [
          'Persönlicher Umzugsberater',
          'Versicherungsschutz bis 2.500€ pro cbm',
          'Garantierte Termineinhaltung',
          'Nachbetreuung inklusive',
          '100% Zufriedenheitsgarantie'
        ]
      },
      priceFactors: {
        floorMultiplier: 0, // Bereits im Preis enthalten
        noElevatorMultiplier: 1.0, // Kein Zuschlag
        distanceBaseKm: 100,
        pricePerExtraKm: 0.8
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'System'
    }
  ];

  // Alle Templates abrufen
  async getTemplates(): Promise<QuoteTemplate[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        // Initialisiere mit Standard-Templates
        await this.saveTemplates(this.defaultTemplates);
        return this.defaultTemplates;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error);
      return this.defaultTemplates;
    }
  }

  // Template nach ID abrufen
  async getTemplateById(id: string): Promise<QuoteTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  // Neues Template erstellen
  async createTemplate(template: Omit<QuoteTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuoteTemplate> {
    const templates = await this.getTemplates();
    
    const newTemplate: QuoteTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    templates.push(newTemplate);
    await this.saveTemplates(templates);
    
    return newTemplate;
  }

  // Template aktualisieren
  async updateTemplate(id: string, updates: Partial<QuoteTemplate>): Promise<QuoteTemplate | null> {
    const templates = await this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    // System-Templates können nicht bearbeitet werden
    if (templates[index].createdBy === 'System') {
      throw new Error('System-Templates können nicht bearbeitet werden');
    }
    
    templates[index] = {
      ...templates[index],
      ...updates,
      id: templates[index].id, // ID kann nicht geändert werden
      createdAt: templates[index].createdAt, // Erstelldatum bleibt
      updatedAt: new Date()
    };
    
    await this.saveTemplates(templates);
    return templates[index];
  }

  // Template löschen
  async deleteTemplate(id: string): Promise<boolean> {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === id);
    
    // System-Templates können nicht gelöscht werden
    if (template?.createdBy === 'System') {
      throw new Error('System-Templates können nicht gelöscht werden');
    }
    
    const filtered = templates.filter(t => t.id !== id);
    
    if (filtered.length < templates.length) {
      await this.saveTemplates(filtered);
      return true;
    }
    
    return false;
  }

  // Template duplizieren
  async duplicateTemplate(id: string, newName: string): Promise<QuoteTemplate | null> {
    const template = await this.getTemplateById(id);
    if (!template) return null;
    
    const duplicate = {
      ...template,
      name: newName,
      description: `Kopie von ${template.name}`,
      isDefault: false,
      createdBy: 'User'
    };
    
    delete (duplicate as any).id;
    delete (duplicate as any).createdAt;
    delete (duplicate as any).updatedAt;
    
    return await this.createTemplate(duplicate);
  }

  // Default-Template setzen
  async setDefaultTemplate(id: string): Promise<boolean> {
    const templates = await this.getTemplates();
    
    // Alle anderen als nicht-default markieren
    templates.forEach(t => {
      t.isDefault = t.id === id;
    });
    
    await this.saveTemplates(templates);
    return true;
  }

  // Templates speichern
  private async saveTemplates(templates: QuoteTemplate[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Fehler beim Speichern der Templates:', error);
      throw error;
    }
  }

  // Templates zurücksetzen
  async resetToDefaults(): Promise<void> {
    await this.saveTemplates(this.defaultTemplates);
  }
}

export const quoteTemplateService = new QuoteTemplateService();