import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Box } from '@mui/material';
import { User } from './services/authService';
import { authService } from './services/authService';
import { usePageTracking } from './hooks/useAnalytics';
import { autoSyncService } from './services/autoSyncService';
import { lexwareSyncService } from './services/lexwareSyncService';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import SimpleAuth from './components/SimpleAuth';
import ErrorBoundary from './components/ErrorBoundary';
import { usePresence } from './hooks/useRealtime';
import { RealtimeNotifications } from './components/RealtimeNotifications';
import { OnlineUsers } from './components/OnlineUsers';
import { realtimeService } from './services/realtimeService';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CustomerSearch from './components/CustomerSearch';
import CreateQuote from './components/CreateQuote';
import CreateQuoteMultiCompany from './components/CreateQuote.multicompany';
import NewCustomer from './components/NewCustomer';
import QuotesList from './components/QuotesList';
import CustomersList from './components/CustomersList';
import CustomerDetails from './components/CustomerDetails';
import CustomerDetailView from './components/CustomerDetailView';
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
import PDFTemplateManager from './components/PDFTemplateManager';
import VolumeScanner from './components/VolumeScanner';
// Import test utils for development
import './utils/emailTestUtils';
import './utils/addCustomersFromScreenshots';
import './utils/debugEnv';
import './utils/testGoogleSheets';
import { startHealthMonitoring } from './utils/startHealthMonitoring';
import EmailImportSettings from './components/EmailImportSettings';
import FailedEmailRecovery from './components/FailedEmailRecovery';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import AdminToolsPage from './pages/AdminToolsPage';
import EmailClientWrapper from './components/EmailClientWrapper';
import { EmailTestDashboard } from './components/EmailTestDashboard';
import VisibilityFix from './components/VisibilityFix';
import EmailDebugger from './components/EmailDebugger';
import EmailTestIONOS from './components/EmailTestIONOS';
import EmailTestPage from './components/EmailTestPage';
import EmailTestComplete from './components/EmailTestComplete';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import PhoenixDashboard from './components/PhoenixEngine/PhoenixDashboard';
import GenesisEye from './components/PhoenixEngine/GenesisEye';
import EmailDebug from './components/EmailDebug';
import EmailTestTool from './pages/EmailTestTool';
import EmailDebugTest from './pages/EmailDebugTest';
import { AIAssistantChatV2 } from './components/AIAssistant';
import { aiConfigService } from './services/ai/aiConfigService';
import QuoteConfirmationPage from './pages/QuoteConfirmationPage';
import AccountingDashboard from './pages/AccountingDashboard';
import CustomerImportPage from './pages/CustomerImportPage';
import SharedCustomerView from './pages/SharedCustomerView';
import TrelloImportPage from './pages/TrelloImportPage';
import DebugShareLinksPage from './pages/DebugShareLinksPage';
import RealtimeDashboard from './components/RealtimeDashboard';
import QuoteLayoutEditor from './components/QuoteLayoutEditor/QuoteLayoutEditor';
import WhatsAppClient from './components/WhatsAppClient';


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
  
  // Initialize presence tracking
  usePresence(user?.uid || 'anonymous', user?.displayName || 'Gast');

  return (
    <Routes>
      {/* Public routes without layout */}
      <Route path="/login" element={<Navigate to="/dashboard" />} />
      <Route path="/share/:shareId" element={<SharePage />} />
      
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
      <Route 
        path="/customer-search" 
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
      
      {/* Volume Scanner */}
      <Route 
        path="/volume-scanner/:customerId" 
        element={<VolumeScanner />} 
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
      
      {/* Customer Details - Neue moderne Ansicht */}
      <Route 
        path="/customers/:customerId" 
        element={<CustomerDetailView />} 
      />
      <Route 
        path="/customer/:customerId" 
        element={<CustomerDetailView />} 
      />
      <Route 
        path="/customer-details/:customerId" 
        element={<CustomerDetails />} 
      />
      <Route 
        path="/edit-customer/:customerId" 
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
      
      {/* PDF Templates */}
      <Route 
        path="/pdf-templates" 
        element={<PDFTemplateManager />} 
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

      {/* WhatsApp Client */}
      <Route 
        path="/whatsapp" 
        element={<WhatsAppClient />} 
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
      
      {/* Supabase Email Test */}
      <Route 
        path="/email-test-supabase" 
        element={<EmailTestPage />} 
      />
      
      {/* Complete Email Test */}
      <Route 
        path="/email-test-complete" 
        element={<EmailTestComplete />} 
      />
      
      {/* Email Test Tool */}
      <Route 
        path="/email-test-tool" 
        element={<EmailTestTool />} 
      />
      
      {/* Email Debug Test */}
      <Route 
        path="/email-debug-test" 
        element={<EmailDebugTest />} 
      />
      
      {/* System Health Monitor */}
      <Route 
        path="/health" 
        element={<SystemHealthMonitor />} 
      />
      
      {/* Phoenix Engine Dashboard */}
      <Route 
        path="/phoenix" 
        element={<PhoenixDashboard />} 
      />
      
      {/* Genesis Eye */}
      <Route 
        path="/genesis-eye" 
        element={<GenesisEye />} 
      />
      
      {/* Email Debug */}
      <Route 
        path="/email-debug" 
        element={<EmailDebug />} 
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
      
      {/* Debug ShareLinks Page (nur für Entwicklung) */}
      <Route 
        path="/debug-sharelinks" 
        element={<DebugShareLinksPage />} 
      />
      
      {/* Realtime Dashboard */}
      <Route 
        path="/realtime" 
        element={<RealtimeDashboard />} 
      />
      
      {/* Quote Layout Editor */}
      <Route 
        path="/quote-designer" 
        element={<QuoteLayoutEditor />} 
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
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

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
    
    // LEXWARE AUTO-SYNC - IMMER AKTIV!
    console.log('🚀 Starte automatische Lexware Synchronisation...');
    lexwareSyncService.startAutoSync(5); // Alle 5 Minuten automatisch
    
    // Führe sofort erste Synchronisation durch
    lexwareSyncService.performSync().then(() => {
      console.log('✅ Erste Lexware Synchronisation abgeschlossen');
    }).catch(error => {
      console.error('❌ Fehler bei der ersten Lexware Synchronisation:', error);
    });
    
    // Prüfe AI Config
    checkAIConfig();
    
    // Start health monitoring if enabled
    startHealthMonitoring();
    
    // Initialize realtime service
    if (user) {
      realtimeService.initialize(user.uid, user.displayName || user.email || 'Unknown User').then(() => {
        console.log('✅ Realtime service initialized');
      });
    }
    
    // Check if online users should be shown
    const savedShowOnlineUsers = localStorage.getItem('showOnlineUsers');
    if (savedShowOnlineUsers === 'true') {
      setShowOnlineUsers(true);
    }
    
    // Listen for showOnlineUsers changes
    const handleShowOnlineUsersChange = (event: any) => {
      setShowOnlineUsers(event.detail);
    };
    window.addEventListener('showOnlineUsersChanged', handleShowOnlineUsersChange);
    
    // Cleanup bei Unmount
    return () => {
      autoSyncService.stopAutoSync();
      lexwareSyncService.stopAutoSync(); // Stoppe Lexware Sync beim Beenden
      window.removeEventListener('showOnlineUsersChanged', handleShowOnlineUsersChange);
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
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
        <SimpleAuth>
          <VisibilityFix />
          <AuthContext.Provider value={{ user, login, logout, resetPassword, loginWithGoogle }}>
            <AppRoutes user={user} />
            
            {/* Real-time Notifications */}
            <RealtimeNotifications />
            
            {/* Online Users Widget */}
            {showOnlineUsers && (
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 80,
                  right: 20,
                  maxWidth: 300,
                  zIndex: 1000
                }}
              >
                <OnlineUsers />
              </Box>
            )}
            
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
    </ErrorBoundary>
  );
}

export default App;