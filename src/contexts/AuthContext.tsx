import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a dummy context for compatibility
    return {
      user: { uid: 'dummy-user', email: 'user@example.com', displayName: 'User' } as User,
      login: async () => {},
      logout: async () => {},
      resetPassword: async () => {},
      loginWithGoogle: async () => {},
    };
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<User>({ 
    uid: 'dummy-user', 
    email: 'user@example.com', 
    displayName: 'User' 
  } as User);

  const value = {
    user,
    login: async () => {},
    logout: async () => {},
    resetPassword: async () => {},
    loginWithGoogle: async () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};