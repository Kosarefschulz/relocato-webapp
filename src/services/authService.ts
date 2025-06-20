// Dummy User type
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    // Dummy login - immer erfolgreich
    return {
      uid: 'dummy-user',
      email: credentials.email,
      displayName: credentials.email?.split('@')[0]
    };
  }

  async register(userData: RegisterData): Promise<User> {
    // Dummy register - immer erfolgreich
    return {
      uid: 'dummy-user',
      email: userData.email,
      displayName: userData.name || userData.email?.split('@')[0]
    };
  }

  async logout(): Promise<void> {
    // Nichts zu tun bei Dummy-Auth
    return Promise.resolve();
  }

  async resetPassword(email: string): Promise<void> {
    // Nichts zu tun bei Dummy-Auth
    return Promise.resolve();
  }

  async signInWithGoogle(): Promise<User> {
    // Dummy Google login
    return {
      uid: 'dummy-google-user',
      email: 'user@gmail.com',
      displayName: 'Google User'
    };
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    // Immer eingeloggt
    setTimeout(() => callback({
      uid: 'dummy-user',
      email: 'user@example.com',
      displayName: 'User'
    }), 0);
    
    // Return dummy unsubscribe function
    return () => {};
  }

  getCurrentUser(): User | null {
    // Immer eingeloggt
    return {
      uid: 'dummy-user',
      email: 'user@example.com',
      displayName: 'User'
    };
  }
}

export const authService = new AuthService();