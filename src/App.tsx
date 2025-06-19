import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CircularProgress, Box } from '@mui/material';
import { User } from 'firebase/auth';
import { authService } from './services/authService';
import { usePageTracking } from './hooks/useAnalytics';
import { autoSyncService } from './services/autoSyncService';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';
import CustomerDetails from './components/CustomerDetails';
import InvoicesList from './components/InvoicesList';
import SalesPage from './pages/SalesPage';
import CalendarView from './components/CalendarView';
import DispositionPage from './pages/DispositionPage';
import SharePage from './pages/SharePage';
import MigrationTool from './components/MigrationTool';
import AdminImport from './components/AdminImport';
import PhotoGallery from './components/PhotoGallery';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import QuoteTemplateManager from './components/QuoteTemplateManager';
import EmailTemplateManager from './components/EmailTemplateManager';
import FollowUpManager from './components/FollowUpManager';
import EmailImportMonitor from './components/EmailImportMonitor';
// Import test utils for development
import './utils/emailTestUtils';
import EmailImportSettings from './components/EmailImportSettings';
import FailedEmailRecovery from './components/FailedEmailRecovery';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AdminToolsPage from './pages/AdminToolsPage';
import EmailClient from './components/EmailClient';
import { EmailTestDashboard } from './components/EmailTestDashboard';
import VisibilityFix from './components/VisibilityFix';


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
    <Routes>
      {/* Login Route */}
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to="/dashboard" />} 
      />

      {/* Search Customer for Quote Creation */}
      <Route 
        path="/search-customer" 
        element={user ? <CustomerSearch /> : <Navigate to="/login" />} 
      />
      
      {/* Create Quote */}
      <Route 
        path="/create-quote" 
        element={user ? <CreateQuote /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/create-quote/:customerId" 
        element={user ? <CreateQuote /> : <Navigate to="/login" />} 
      />
      
      {/* Create New Customer */}
      <Route 
        path="/new-customer" 
        element={user ? <NewCustomer /> : <Navigate to="/login" />} 
      />
      
      {/* Dashboard */}
      <Route 
        path="/dashboard" 
        element={user ? <Dashboard /> : <Navigate to="/login" />} 
      />
      
      {/* Customer List */}
      <Route 
        path="/customers" 
        element={user ? <CustomersList /> : <Navigate to="/login" />} 
      />
      
      {/* Customer Details */}
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
      
      {/* Quotes List */}
      <Route 
        path="/quotes" 
        element={user ? <QuotesList /> : <Navigate to="/login" />} 
      />
      
      {/* Invoices List */}
      <Route 
        path="/invoices" 
        element={user ? <InvoicesList /> : <Navigate to="/login" />} 
      />
      
      {/* Sales Page */}
      <Route 
        path="/sales" 
        element={user ? <SalesPage /> : <Navigate to="/login" />} 
      />
      
      {/* Calendar View */}
      <Route 
        path="/calendar" 
        element={user ? <CalendarView /> : <Navigate to="/login" />} 
      />
      
      {/* Disposition */}
      <Route 
        path="/disposition" 
        element={user ? <DispositionPage /> : <Navigate to="/login" />} 
      />
      
      {/* Share Page (Public Route) */}
      <Route path="/share/:shareId" element={<SharePage />} />
      <Route path="/share/:token" element={<SharePage />} />
      
      {/* Migration Tool */}
      <Route 
        path="/migration" 
        element={user ? <MigrationTool /> : <Navigate to="/login" />} 
      />
      
      {/* Admin Import Tool */}
      <Route 
        path="/admin-import" 
        element={user ? <AdminImport /> : <Navigate to="/login" />} 
      />
      
      {/* Photo Gallery */}
      <Route 
        path="/photos" 
        element={user ? <PhotoGallery /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/gallery" 
        element={user ? <PhotoGallery /> : <Navigate to="/login" />} 
      />
      
      {/* Analytics Dashboard */}
      <Route 
        path="/analytics" 
        element={user ? <AnalyticsDashboard /> : <Navigate to="/login" />} 
      />
      
      {/* Quote Templates */}
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
      
      {/* Email Import Monitor */}
      <Route 
        path="/import-monitor" 
        element={user ? <EmailImportMonitor /> : <Navigate to="/login" />} 
      />
      
      {/* Email Import Settings */}
      <Route 
        path="/import-settings" 
        element={user ? <EmailImportSettings /> : <Navigate to="/login" />} 
      />
      
      {/* Failed Email Recovery */}
      <Route 
        path="/failed-email-recovery" 
        element={user ? <FailedEmailRecovery /> : <Navigate to="/login" />} 
      />
      
      {/* Admin Tools */}
      <Route 
        path="/admin-tools" 
        element={user ? <AdminToolsPage /> : <Navigate to="/login" />} 
      />
      
      {/* Email Client */}
      <Route 
        path="/email-client" 
        element={user ? <EmailClient /> : <Navigate to="/login" />} 
      />
      
      {/* Email Test Dashboard */}
      <Route 
        path="/email-test" 
        element={user ? <EmailTestDashboard /> : <Navigate to="/login" />} 
      />
      
      {/* Default Route */}
      <Route 
        path="/" 
        element={<Navigate to={user ? "/dashboard" : "/login"} />} 
      />
    </Routes>
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
      <VisibilityFix />
      <AuthContext.Provider value={{ user, login, logout, resetPassword, loginWithGoogle }}>
        <Router>
          <AppRoutes user={user} />
          
          {/* PWA Install Prompt - Only show when user is logged in */}
          {/* {user && <PWAInstallPrompt />} */}
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;