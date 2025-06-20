import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CircularProgress, Box } from '@mui/material';
import { User } from './services/authService';
import { authService } from './services/authService';
import { usePageTracking } from './hooks/useAnalytics';
import { autoSyncService } from './services/autoSyncService';
import SimpleAuth from './components/SimpleAuth';

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
import EmailClientWrapper from './components/EmailClientWrapper';
import { EmailTestDashboard } from './components/EmailTestDashboard';
import VisibilityFix from './components/VisibilityFix';
import EmailDebugger from './components/EmailDebugger';
import EmailTestIONOS from './components/EmailTestIONOS';


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
      {/* Public routes without layout */}
      <Route path="/login" element={<Navigate to="/dashboard" />} />
      <Route path="/share/:shareId" element={<SharePage />} />
      <Route path="/share/:token" element={<SharePage />} />
      
      {/* Search Customer for Quote Creation */}
      <Route 
        path="/search-customer" 
        element={<CustomerSearch />} 
      />
      
      {/* Create Quote */}
      <Route 
        path="/create-quote" 
        element={<CreateQuote />} 
      />
      <Route 
        path="/create-quote/:customerId" 
        element={<CreateQuote />} 
      />
      
      {/* Create New Customer */}
      <Route 
        path="/new-customer" 
        element={<NewCustomer />} 
      />
      
      {/* Dashboard */}
      <Route 
        path="/dashboard" 
        element={<Dashboard />} 
      />
      
      {/* Customer List */}
      <Route 
        path="/customers" 
        element={<CustomersList />} 
      />
      
      {/* Customer Details */}
      <Route 
        path="/customer/:id" 
        element={<CustomerDetails />} 
      />
      <Route 
        path="/customer-details/:customerId" 
        element={<CustomerDetails />} 
      />
      <Route 
        path="/edit-customer/:customerId" 
        element={<CustomerDetails />} 
      />
      <Route 
        path="/customers/:customerId" 
        element={<CustomerDetails />} 
      />
      
      {/* Quotes List */}
      <Route 
        path="/quotes" 
        element={<QuotesList />} 
      />
      
      {/* Invoices List */}
      <Route 
        path="/invoices" 
        element={<InvoicesList />} 
      />
      
      {/* Sales Page */}
      <Route 
        path="/sales" 
        element={<SalesPage />} 
      />
      
      {/* Calendar View */}
      <Route 
        path="/calendar" 
        element={<CalendarView />} 
      />
      
      {/* Disposition */}
      <Route 
        path="/disposition" 
        element={<DispositionPage />} 
      />
      
      {/* Migration Tool */}
      <Route 
        path="/migration" 
        element={<MigrationTool />} 
      />
      
      {/* Admin Import Tool */}
      <Route 
        path="/admin-import" 
        element={<AdminImport />} 
      />
      
      {/* Photo Gallery */}
      <Route 
        path="/photos" 
        element={<PhotoGallery />} 
      />
      <Route 
        path="/gallery" 
        element={<PhotoGallery />} 
      />
      
      {/* Analytics Dashboard */}
      <Route 
        path="/analytics" 
        element={<AnalyticsDashboard />} 
      />
      
      {/* Quote Templates */}
      <Route 
        path="/templates" 
        element={<QuoteTemplateManager />} 
      />
      
      <Route 
        path="/email-templates" 
        element={<EmailTemplateManager />} 
      />
      
      <Route 
        path="/follow-ups" 
        element={<FollowUpManager />} 
      />
      
      {/* Email Import Monitor */}
      <Route 
        path="/import-monitor" 
        element={<EmailImportMonitor />} 
      />
      
      {/* Email Import Settings */}
      <Route 
        path="/import-settings" 
        element={<EmailImportSettings />} 
      />
      
      {/* Failed Email Recovery */}
      <Route 
        path="/failed-email-recovery" 
        element={<FailedEmailRecovery />} 
      />
      
      {/* Admin Tools */}
      <Route 
        path="/admin-tools" 
        element={<AdminToolsPage />} 
      />
      
      {/* Email Client */}
      <Route 
        path="/email-client" 
        element={<EmailClientWrapper />} 
      />
      <Route 
        path="/email" 
        element={<EmailClientWrapper />} 
      />
      
      {/* Email Test Dashboard */}
      <Route 
        path="/email-test" 
        element={<EmailTestDashboard />} 
      />
      
      {/* IONOS Email Test */}
      <Route 
        path="/email-test-ionos" 
        element={<EmailTestIONOS />} 
      />
      
      {/* Default Route */}
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" />} 
      />
    </Routes>
  );
}

function App() {
  // Dummy user - immer eingeloggt
  const user = { uid: 'dummy-user', email: 'user@example.com', displayName: 'User' } as User;

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
    // Dummy login
    await authService.login({ email, password });
  };

  const logout = async () => {
    // Dummy logout
    await authService.logout();
  };

  const resetPassword = async (email: string) => {
    // Dummy reset
    await authService.resetPassword(email);
  };

  const loginWithGoogle = async () => {
    // Dummy Google login
    await authService.signInWithGoogle();
  };

  // Loading State entfernt - nicht mehr nötig

  return (
    <ThemeProvider>
      <SimpleAuth>
        <VisibilityFix />
        <AuthContext.Provider value={{ user, login, logout, resetPassword, loginWithGoogle }}>
          <Router>
            <AppRoutes user={user} />
            
            {/* PWA Install Prompt - Only show when user is logged in */}
            {/* {user && <PWAInstallPrompt />} */}
          </Router>
        </AuthContext.Provider>
      </SimpleAuth>
    </ThemeProvider>
  );
}

export default App;