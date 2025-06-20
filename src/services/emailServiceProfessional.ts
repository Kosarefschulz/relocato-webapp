import io, { Socket } from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_EMAIL_API_URL || 'http://localhost:5005/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5005';

interface EmailResponse {
  emails: any[];
  total: number;
  page: number;
  limit: number;
}

interface EmailFilters {
  folder: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class EmailService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.token = localStorage.getItem('emailToken');
    if (this.token) {
      this.connectSocket();
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.token = data.token;
    if (this.token) {
      localStorage.setItem('emailToken', this.token);
    }
    
    this.connectSocket();
    return data;
  }

  async logout() {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    this.token = null;
    localStorage.removeItem('emailToken');
    this.disconnectSocket();
  }

  // Socket connection
  private connectSocket() {
    if (!this.token) return;

    this.socket = io(SOCKET_URL, {
      auth: {
        token: this.token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to email server');
      this.socket?.emit('join-email-room', '1'); // User ID
    });

    // Forward socket events to listeners
    ['email-new', 'email-read', 'email-starred', 'email-deleted', 'email-moved'].forEach(event => {
      this.socket?.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  private disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  disconnect() {
    this.disconnectSocket();
  }

  // Event handling
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Headers
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Folders
  async getFolders() {
    const response = await fetch(`${API_BASE_URL}/folders`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }

    return response.json();
  }

  async createFolder(name: string, parent?: string) {
    const response = await fetch(`${API_BASE_URL}/folders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, parent })
    });

    if (!response.ok) {
      throw new Error('Failed to create folder');
    }

    return response.json();
  }

  // Emails
  async getEmails(filters: EmailFilters): Promise<EmailResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/emails?${params}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }

    return response.json();
  }

  async getEmail(id: string, folder: string) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}?folder=${folder}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email');
    }

    return response.json();
  }

  async sendEmail(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/emails/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return response.json();
  }

  async saveDraft(draftData: any) {
    const response = await fetch(`${API_BASE_URL}/emails/draft`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(draftData)
    });

    if (!response.ok) {
      throw new Error('Failed to save draft');
    }

    return response.json();
  }

  async markAsRead(id: string, folder: string) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/read`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ folder })
    });

    if (!response.ok) {
      throw new Error('Failed to mark as read');
    }

    return response.json();
  }

  async markAsUnread(id: string, folder: string) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/unread`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ folder })
    });

    if (!response.ok) {
      throw new Error('Failed to mark as unread');
    }

    return response.json();
  }

  async starEmail(id: string, folder: string, starred: boolean) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/star`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ folder, starred })
    });

    if (!response.ok) {
      throw new Error('Failed to star email');
    }

    return response.json();
  }

  async moveEmail(id: string, sourceFolder: string, targetFolder: string) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/move`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ sourceFolder, targetFolder })
    });

    if (!response.ok) {
      throw new Error('Failed to move email');
    }

    return response.json();
  }

  async deleteEmail(id: string, folder: string) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}?folder=${folder}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to delete email');
    }

    return response.json();
  }

  async searchEmails(query: string, folder?: string) {
    const params = new URLSearchParams({ q: query });
    if (folder) params.append('folder', folder);

    const response = await fetch(`${API_BASE_URL}/emails/search?${params}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to search emails');
    }

    return response.json();
  }

  async getEmailThread(id: string) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/thread`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email thread');
    }

    return response.json();
  }

  async replyToEmail(id: string, replyData: any) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/reply`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(replyData)
    });

    if (!response.ok) {
      throw new Error('Failed to reply to email');
    }

    return response.json();
  }

  async forwardEmail(id: string, forwardData: any) {
    const response = await fetch(`${API_BASE_URL}/emails/${id}/forward`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(forwardData)
    });

    if (!response.ok) {
      throw new Error('Failed to forward email');
    }

    return response.json();
  }

  async verifyConnection() {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to verify connection');
    }

    return response.json();
  }
}

export const emailService = new EmailService();