import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CircularProgress, Box } from '@mui/material';
import { User } from './services/authService';
import { authService } from './services/authService';
import { usePageTracking } from './hooks/useAnalytics';
import { autoSyncService } from './services/autoSyncService';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import SimpleAuth from './components/SimpleAuth';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import CreateQuoteMultiCompany from './components/CreateQuote.multicompany';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';
import CustomerDetails from './components/CustomerDetails';
import InvoicesList from './components/InvoicesList';
import SalesPage from './pages/SalesPage';
import CalendarView from './components/CalendarView';
import CalendarImportEnhanced from './components/CalendarImportEnhanced';
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
import './utils/addCustomersFromScreenshots';
import './utils/debugEnv';
import './utils/testGoogleSheets';
import EmailImportSettings from './components/EmailImportSettings';
import FailedEmailRecovery from './components/FailedEmailRecovery';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AdminToolsPage from './pages/AdminToolsPage';
import EmailClientWrapper from './components/EmailClientWrapper';
import { EmailTestDashboard } from './components/EmailTestDashboard';
import VisibilityFix from './components/VisibilityFix';
import EmailDebugger from './components/EmailDebugger';
import EmailTestIONOS from './components/EmailTestIONOS';
import { AIAssistantChatV2 } from './components/AIAssistant';
import { aiConfigService } from './services/ai/aiConfigService';
import QuoteConfirmationPage from './pages/QuoteConfirmationPage';
import AccountingDashboard from './pages/AccountingDashboard';
import CustomerImportPage from './pages/CustomerImportPage';
import SharedCustomerView from './pages/SharedCustomerView';
import TrelloImportPage from './pages/TrelloImportPage';
import AppleToGoogleCalendarPage from './pages/AppleToGoogleCalendarPage';


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
      
      {/* Quote Confirmation Page - Public Route */}
      <Route 
        path="/quote-confirmation/:token" 
        element={<QuoteConfirmationPage />} 
      />
      
      {/* Shared Customer View - Public Route */}
      <Route 
        path="/shared/customer/:tokenId" 
        element={<SharedCustomerView />} 
      />
      
      {/* Search Customer for Quote Creation */}
      <Route 
        path="/search-customer" 
        element={<CustomerSearch />} 
      />
      
      {/* Create Quote */}
      <Route 
        path="/create-quote" 
        element={<CreateQuoteMultiCompany />} 
      />
      <Route 
        path="/create-quote/:customerId" 
        element={<CreateQuoteMultiCompany />} 
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
      
      {/* Invoices List - redirect to accounting */}
      <Route 
        path="/invoices" 
        element={<Navigate to="/accounting" />} 
      />
      
      {/* Accounting Dashboard */}
      <Route 
        path="/accounting" 
        element={<AccountingDashboard />} 
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
      
      {/* Calendar Import */}
      <Route 
        path="/calendar-import" 
        element={<CalendarImportEnhanced />} 
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
      
      {/* Customer Import Page */}
      <Route 
        path="/customer-import" 
        element={<CustomerImportPage />} 
      />
      
      {/* Trello Import Page */}
      <Route 
        path="/import-trello" 
        element={<TrelloImportPage />} 
      />
      
      {/* Apple to Google Calendar Import */}
      <Route 
        path="/apple-to-google-calendar" 
        element={<AppleToGoogleCalendarPage />} 
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
  const [aiEnabled, setAiEnabled] = useState(false);

  // Automatische Synchronisation beim App-Start
  useEffect(() => {
    // iOS-spezifische Anpassungen
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      // Status Bar konfigurieren
      StatusBar.setStyle({ style: Style.Light }).catch(console.error);
      StatusBar.setBackgroundColor({ color: '#3b82f6' }).catch(console.error);
      
      // Safe Area Insets für iOS
      document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
    }
    
    // Prüfe ob Auto-Sync aktiviert ist
    const autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';
    
    if (autoSyncEnabled) {
      console.log('🔄 Starte automatische Google Sheets Synchronisation...');
      autoSyncService.startAutoSync(5); // Alle 5 Minuten
    }
    
    // Prüfe AI Config
    checkAIConfig();
    
    // Cleanup bei Unmount
    return () => {
      autoSyncService.stopAutoSync();
    };
  }, []);

  const checkAIConfig = async () => {
    // KI ist jetzt immer aktiviert mit festem API-Key
    setAiEnabled(true);
  };

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

  // Check if we're on the quote confirmation page
  const isQuoteConfirmationPage = window.location.pathname.startsWith('/quote-confirmation/');

  return (
    <ThemeProvider>
      <Router>
        <SimpleAuth>
          <VisibilityFix />
          <AuthContext.Provider value={{ user, login, logout, resetPassword, loginWithGoogle }}>
            <AppRoutes user={user} />
            
            {/* PWA Install Prompt - Only show when user is logged in */}
            {/* {user && <PWAInstallPrompt />} */}
            
            {/* AI Assistant Chat - nur anzeigen, wenn nicht auf Angebotsbestätigungsseite */}
            {!isQuoteConfirmationPage && (
              <AIAssistantChatV2 
                initialExpanded={false}
              />
            )}
          </AuthContext.Provider>
        </SimpleAuth>
      </Router>
    </ThemeProvider>
  );
}

export default App;