export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  movingDate: string;
  fromAddress: string;
  toAddress: string;
  apartment: {
    rooms: number;
    area: number;
    floor: number;
    hasElevator: boolean;
  };
  services: string[];
  notes?: string;
}

export interface Quote {
  id: string;
  customerId: string;
  customerName: string;
  price: number;
  comment?: string;
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced';
}

export interface Invoice {
  id: string;
  quoteId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  price: number;
  taxAmount: number;
  totalPrice: number;
  items: InvoiceItem[];
  createdAt: Date;
  dueDate: Date;
  paidDate?: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'consultant';
}