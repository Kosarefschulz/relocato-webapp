import { firebaseService } from '../firebaseService';
import { sendEmail } from '../emailService';
import { pdfService } from '../pdfServiceWrapper';
import { quoteCalculationService } from '../quoteCalculation';
import { Customer, Quote } from '../../types';

export interface BackgroundTask {
  id: string;
  type: 'create_quote' | 'send_email' | 'update_customer' | 'follow_up';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: any;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class AIBackgroundService {
  private tasks: Map<string, BackgroundTask> = new Map();
  private processing = false;

  async addTask(type: BackgroundTask['type'], data: any): Promise<string> {
    const taskId = Date.now().toString();
    const task: BackgroundTask = {
      id: taskId,
      type,
      status: 'pending',
      data,
      createdAt: new Date()
    };

    this.tasks.set(taskId, task);
    this.processQueue(); // Start processing if not already running
    
    return taskId;
  }

  async getTaskStatus(taskId: string): Promise<BackgroundTask | null> {
    return this.tasks.get(taskId) || null;
  }

  private async processQueue() {
    if (this.processing) return;
    
    this.processing = true;

    while (this.tasks.size > 0) {
      const pendingTasks = Array.from(this.tasks.values())
        .filter(task => task.status === 'pending');

      if (pendingTasks.length === 0) break;

      for (const task of pendingTasks) {
        await this.processTask(task);
      }
    }

    this.processing = false;
  }

  private async processTask(task: BackgroundTask) {
    try {
      task.status = 'processing';
      this.tasks.set(task.id, task);

      switch (task.type) {
        case 'create_quote':
          task.result = await this.createQuoteAndSend(task.data);
          break;
        
        case 'send_email':
          task.result = await this.sendEmailWithRetry(task.data);
          break;
        
        case 'update_customer':
          task.result = await this.updateCustomerData(task.data);
          break;
        
        case 'follow_up':
          task.result = await this.processFollowUp(task.data);
          break;
      }

      task.status = 'completed';
      task.completedAt = new Date();
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unbekannter Fehler';
      console.error(`Task ${task.id} failed:`, error);
    }

    this.tasks.set(task.id, task);
  }

  private async createQuoteAndSend(data: {
    customerName: string;
    amount: number;
    volume?: number;
    sendEmail: boolean;
    notes?: string;
  }): Promise<any> {
    // Suche oder erstelle Kunde
    let customer: Customer | null = null;
    const customers = await firebaseService.getCustomers();
    
    customer = customers.find(c => 
      c.name.toLowerCase().includes(data.customerName.toLowerCase())
    ) || null;

    if (!customer) {
      // Erstelle neuen Kunden
      const newCustomer: Omit<Customer, 'id'> = {
        name: data.customerName,
        phone: '',
        email: '',
        fromAddress: '',
        toAddress: '',
        movingDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        apartment: {
          rooms: 0,
          area: 0,
          floor: 0,
          hasElevator: false
        }
      };
      
      const customerId = await firebaseService.addCustomer(newCustomer);
      customer = { ...newCustomer, id: customerId };
    }

    // Berechne Angebot
    const calculation = quoteCalculationService.calculateQuote(customer, {
      volume: data.volume || 30,
      distance: 50,
      packingRequested: false,
      additionalServices: [],
      notes: data.notes || '',
      boxCount: 0,
      parkingZonePrice: 0,
      storagePrice: 0,
      furnitureAssemblyPrice: 0,
      furnitureDisassemblyPrice: 0,
      cleaningService: false,
      cleaningHours: 0,
      clearanceService: false,
      clearanceVolume: 0,
      renovationService: false,
      renovationHours: 0,
      pianoTransport: false,
      heavyItemsCount: 0,
      packingMaterials: false,
      manualBasePrice: data.amount
    });

    // Erstelle Angebot
    const quote: Omit<Quote, 'id'> = {
      customerId: customer.id!,
      customerName: customer.name,
      price: data.amount,
      comment: data.notes || `Festpreis-Angebot: ${data.amount}€`,
      createdAt: new Date(),
      createdBy: 'KI-Assistent',
      status: 'draft',
      volume: data.volume || 30,
      distance: 50
    };

    const quoteId = await firebaseService.addQuote(quote);
    const savedQuote = { ...quote, id: quoteId } as Quote;

    // Sende E-Mail wenn gewünscht
    if (data.sendEmail && customer.email) {
      // Generiere PDF
      const pdfBlob = await pdfService.generatePDF(customer, savedQuote);
      
      // Konvertiere Blob zu Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
      });
      reader.readAsDataURL(pdfBlob);
      const pdfBase64 = await base64Promise;

      // Sende E-Mail
      await sendEmail({
        to: customer.email,
        subject: `Ihr Umzugsangebot von RELOCATO®`,
        content: `
          <p>Sehr geehrte/r ${customer.name},</p>
          <p>vielen Dank für Ihr Interesse an unseren Umzugsdienstleistungen.</p>
          <p>Im Anhang finden Sie Ihr persönliches Angebot über <strong>${data.amount}€</strong>.</p>
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <p>Mit freundlichen Grüßen<br>
          Ihr RELOCATO® Team</p>
        `,
        attachments: [{
          filename: `Angebot_${customer.name}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBase64,
          encoding: 'base64'
        }]
      });
    }

    return {
      customer,
      quote: savedQuote,
      emailSent: data.sendEmail && customer.email
    };
  }

  private async sendEmailWithRetry(data: any, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await sendEmail(data);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  private async updateCustomerData(data: any): Promise<any> {
    const { customerId, updates } = data;
    await firebaseService.updateCustomer(customerId, updates);
    return await firebaseService.getCustomerById(customerId);
  }

  private async processFollowUp(data: any): Promise<any> {
    // Implementiere Follow-Up Logik
    const { customerId, message } = data;
    const customer = await firebaseService.getCustomerById(customerId);
    
    if (!customer || !customer.email) {
      throw new Error('Kunde nicht gefunden oder keine E-Mail');
    }

    return await this.sendEmailWithRetry({
      to: customer.email,
      subject: 'Follow-Up: Ihr Umzugsangebot',
      content: message
    });
  }

  getAllTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values());
  }

  clearCompletedTasks(): void {
    const completed = Array.from(this.tasks.entries())
      .filter(([_, task]) => task.status === 'completed' || task.status === 'failed');
    
    completed.forEach(([id]) => this.tasks.delete(id));
  }
}