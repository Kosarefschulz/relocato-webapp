/**
 * Authentication Service for Vercel
 * Replaces Firebase Auth with JWT-based authentication
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'consultant';
  emailAccess?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class AuthServiceVercel {
  private currentUser: User | null = null;
  private authChangeCallbacks: ((user: User | null) => void)[] = [];
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || '/api';
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Check for stored token and validate it
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const user = await this.validateToken(token);
        if (user) {
          this.currentUser = user;
          this.notifyAuthStateChange(user);
        }
      } catch (error) {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
      }
    }
  }

  private async validateToken(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  private notifyAuthStateChange(user: User | null) {
    this.authChangeCallbacks.forEach(callback => callback(user));
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token
      localStorage.setItem('authToken', data.token);
      
      // Update current user
      this.currentUser = data.user;
      this.notifyAuthStateChange(data.user);
      
      return data.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token
      localStorage.setItem('authToken', data.token);
      
      // Update current user
      this.currentUser = data.user;
      this.notifyAuthStateChange(data.user);
      
      return data.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Notify server about logout
        await fetch(`${this.apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data
      localStorage.removeItem('authToken');
      this.currentUser = null;
      this.notifyAuthStateChange(null);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = `${this.apiUrl}/auth/google`;
      
      // The server will redirect back with a token
      // This will be handled by a callback route
      return new Promise((resolve, reject) => {
        // This promise will be resolved when the user returns from Google
        reject(new Error('Google sign-in requires page redirect'));
      });
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authChangeCallbacks.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.authChangeCallbacks = this.authChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.apiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Profile update failed');
      }

      const updatedUser = await response.json();
      this.currentUser = updatedUser;
      this.notifyAuthStateChange(updatedUser);
      
      return updatedUser;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  private handleAuthError(error: any): Error {
    let message = 'Ein unbekannter Fehler ist aufgetreten';
    
    if (error.message) {
      // Map common error messages to German
      const errorMap: { [key: string]: string } = {
        'Invalid credentials': 'Ungültige Anmeldedaten',
        'User not found': 'Benutzer nicht gefunden',
        'Wrong password': 'Falsches Passwort',
        'Email already exists': 'Email-Adresse wird bereits verwendet',
        'Weak password': 'Passwort ist zu schwach',
        'Invalid email': 'Ungültige Email-Adresse',
        'Account disabled': 'Benutzerkonto wurde deaktiviert',
        'Too many attempts': 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut',
        'Network error': 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung',
      };
      
      message = errorMap[error.message] || error.message;
    }
    
    return new Error(message);
  }
}

export const authServiceVercel = new AuthServiceVercel();