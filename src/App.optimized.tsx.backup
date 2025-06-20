import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CircularProgress, Box } from '@mui/material';
import { User } from 'firebase/auth';
import { authService } from './services/authService';
import { usePageTracking } from './hooks/useAnalytics';
import { autoSyncService } from './services/autoSyncService';

// Core components (loaded immediately)
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';
import CustomerDetails from './components/CustomerDetails';
import InvoicesList from './components/InvoicesList';
import CalendarView from './components/CalendarView';

// Lazy loaded components
import {
  EmailClient,
  PhotoGallery,
  AnalyticsDashboard,
  MigrationTool,
  AdminImport,
  QuoteTemplateManager,
  EmailTemplateManager,
  FollowUpManager,
  EmailImportMonitor,
  EmailImportSettings,
  FailedEmailRecovery,
  SalesPage,
  DispositionPage,
  SharePage,
  AdminToolsPage
} from './components/LazyComponents';

// Loading component for lazy loaded routes
const LoadingFallback = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="60vh"
  >
    <CircularProgress size={40} />
  </Box>
);

export const AuthContext = React.createContext<{
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}>({
  user: null,
  login: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  loginWithGoogle: async () => {},
});

// Separate component for routes that uses usePageTracking
function AppRoutes({ user }: { user: User | null }) {
  // Analytics Page Tracking - now inside Router context
  usePageTracking();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" />} 
        />

        {/* Core Routes - No lazy loading for frequently used pages */}
        <Route 
          path="/search-customer" 
          element={user ? <CustomerSearch /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/create-quote" 
          element={user ? <CreateQuote /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/create-quote/:customerId" 
          element={user ? <CreateQuote /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/new-customer" 
          element={user ? <NewCustomer /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/customers" 
          element={user ? <CustomersList /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/customer/:id" 
          element={user ? <CustomerDetails /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/customer-details/:customerId" 
          element={user ? <CustomerDetails /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/edit-customer/:customerId" 
          element={user ? <CustomerDetails /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/customers/:customerId" 
          element={user ? <CustomerDetails /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/quotes" 
          element={user ? <QuotesList /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/invoices" 
          element={user ? <InvoicesList /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/calendar" 
          element={user ? <CalendarView /> : <Navigate to="/login" />} 
        />
        
        {/* Lazy Loaded Routes */}
        <Route 
          path="/sales" 
          element={user ? <SalesPage /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/disposition" 
          element={user ? <DispositionPage /> : <Navigate to="/login" />} 
        />
        
        {/* Share Page (Public Route) */}
        <Route path="/share/:shareId" element={<SharePage />} />
        <Route path="/share/:token" element={<SharePage />} />
        
        <Route 
          path="/migration" 
          element={user ? <MigrationTool /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/admin-import" 
          element={user ? <AdminImport /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/photos" 
          element={user ? <PhotoGallery /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/gallery" 
          element={user ? <PhotoGallery /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/analytics" 
          element={user ? <AnalyticsDashboard /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/templates" 
          element={user ? <QuoteTemplateManager /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/email-templates" 
          element={user ? <EmailTemplateManager /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/follow-ups" 
          element={user ? <FollowUpManager /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/import-monitor" 
          element={user ? <EmailImportMonitor /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/import-settings" 
          element={user ? <EmailImportSettings /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/failed-email-recovery" 
          element={user ? <FailedEmailRecovery /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/admin-tools" 
          element={user ? <AdminToolsPage /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/email-client" 
          element={user ? <EmailClient /> : <Navigate to="/login" />} 
        />
        
        {/* Default Route */}
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Automatische Synchronisation beim App-Start
  useEffect(() => {
    // Prüfe ob Auto-Sync aktiviert ist
    const autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';
    
    if (autoSyncEnabled) {
      console.log('🔄 Starte automatische Google Sheets Synchronisation...');
      autoSyncService.startAutoSync(5); // Alle 5 Minuten
    }
    
    // Cleanup bei Unmount
    return () => {
      autoSyncService.stopAutoSync();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthError('');
      await authService.login({ email, password });
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setAuthError('');
      await authService.resetPassword(email);
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setAuthError('');
      await authService.signInWithGoogle();
    } catch (error: any) {
      setAuthError(error.message);
      throw error;
    }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
        >
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, login, logout, resetPassword, loginWithGoogle }}>
        <Router>
          <AppRoutes user={user} />
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;