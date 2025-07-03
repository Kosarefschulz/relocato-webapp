// Notification Service Stub - Firebase disabled
// This provides empty implementations for backward compatibility

export interface Notification {
  id?: string;
  type: 'quote_confirmed' | 'new_customer' | 'quote_sent' | 'invoice_created';
  title: string;
  message: string;
  customerId?: string;
  customerName?: string;
  quoteId?: string;
  read: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

class NotificationService {
  private logDisabled(operation: string) {
    console.log(`⚠️ Notification operation "${operation}" called but Firebase is disabled - notifications not available`);
  }

  async addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<void> {
    this.logDisabled('addNotification');
    console.log('📝 Would create notification:', notification.title);
  }

  async getNotifications(limit = 50): Promise<Notification[]> {
    this.logDisabled('getNotifications');
    return [];
  }

  async getAllNotifications(limit = 50): Promise<Notification[]> {
    this.logDisabled('getAllNotifications');
    return [];
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    this.logDisabled('getUnreadNotifications');
    return [];
  }

  async markAsRead(notificationId: string): Promise<void> {
    this.logDisabled('markAsRead');
  }

  async markAllAsRead(): Promise<void> {
    this.logDisabled('markAllAsRead');
  }

  subscribeToNotifications(callback: (notifications: Notification[]) => void): () => void {
    this.logDisabled('subscribeToNotifications');
    // Return empty notifications immediately
    setTimeout(() => callback([]), 0);
    return () => {}; // Empty unsubscribe function
  }

  async getUnreadCount(): Promise<number> {
    this.logDisabled('getUnreadCount');
    return 0;
  }

  // Notification helpers
  async notifyQuoteConfirmed(customerId: string, customerName: string, quoteId: string): Promise<void> {
    this.logDisabled('notifyQuoteConfirmed');
    console.log(`📝 Would notify: Quote confirmed for ${customerName}`);
  }

  async notifyNewCustomer(customerId: string, customerName: string): Promise<void> {
    this.logDisabled('notifyNewCustomer');
    console.log(`📝 Would notify: New customer ${customerName} added`);
  }

  async notifyQuoteSent(customerId: string, customerName: string, quoteId: string): Promise<void> {
    this.logDisabled('notifyQuoteSent');
    console.log(`📝 Would notify: Quote sent to ${customerName}`);
  }

  async notifyInvoiceCreated(customerId: string, customerName: string, invoiceId: string): Promise<void> {
    this.logDisabled('notifyInvoiceCreated');
    console.log(`📝 Would notify: Invoice created for ${customerName}`);
  }

  async createQuoteConfirmedNotification(customerName: string, customerId: string, quoteId: string): Promise<void> {
    this.logDisabled('createQuoteConfirmedNotification');
    console.log(`📝 Would create quote confirmed notification for ${customerName}`);
  }
}

export const notificationService = new NotificationService();