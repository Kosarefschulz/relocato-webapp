import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as SalesIcon,
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import './GlassDashboard.css';
import GlassAICard from './GlassAICard';
import GlassInventoryCard from './GlassInventoryCard';
import GlassDispositionCard from './GlassDispositionCard';
import { SmartSearch } from './SmartSearch';
import SyncStatus from './SyncStatus';
import LogoutButton from './LogoutButton';
import NotificationCenter from './NotificationCenter';

interface DashboardItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const GlassDashboard: React.FC = () => {
  const navigate = useNavigate();

  const dashboardItems: DashboardItem[] = [
    {
      title: 'Pipeline',
      description: 'Kunden nach Phasen',
      icon: <MenuIcon />,
      path: '/pipeline'
    },
    {
      title: 'Kunde suchen',
      description: 'Bestehenden Kunden finden',
      icon: <SearchIcon />,
      path: '/search-customer'
    },
    {
      title: 'Neuer Kunde',
      description: 'Kunden anlegen',
      icon: <AddIcon />,
      path: '/new-customer'
    },
    {
      title: 'Angebote',
      description: 'Angebote verwalten',
      icon: <DescriptionIcon />,
      path: '/quotes'
    },
    {
      title: 'Buchhaltung',
      description: 'Rechnungen & Zahlungen',
      icon: <ReceiptIcon />,
      path: '/accounting'
    },
    {
      title: 'Kalender',
      description: 'Termine verwalten',
      icon: <CalendarIcon />,
      path: '/calendar'
    },
    {
      title: 'Vertrieb',
      description: 'Verkauf & Analytics',
      icon: <SalesIcon />,
      path: '/sales'
    },
    {
      title: 'Admin Tools',
      description: 'System verwalten',
      icon: <AdminIcon />,
      path: '/admin-tools'
    },
    {
      title: 'E-Mail',
      description: 'Nachrichten verwalten',
      icon: <EmailIcon />,
      path: '/email-client'
    }
  ];

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return new Date().toLocaleDateString('de-DE', options);
  };

  return (
    <div className="glass-dashboard">
      
      {/* Navigation Bar */}
      <nav className="glass-nav" style={{ display: 'none' }}>
        <div className="glass-nav-content">
          <h1>Relocato Dashboard</h1>
          <div className="glass-nav-actions">
            <NotificationCenter />
            <SyncStatus />
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Welcome Section */}
      <div className="glass-welcome" style={{ marginTop: '20px' }}>
        <h2>Willkommen zurück!</h2>
        <p>{formatDate()}</p>
      </div>

      {/* Smart Search */}
      <div className="glass-search-container">
        <div className="glass-search">
          <SmartSearch />
        </div>
      </div>

      {/* Customer Button */}
      <div style={{ maxWidth: '1400px', margin: '0 auto 40px', padding: '0 20px' }}>
        <button
          onClick={() => navigate('/customers')}
          style={{
            width: '100%',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
        >
          <SearchIcon />
          Alle Kunden
        </button>
      </div>

      {/* Dashboard Grid with AI Card */}
      <div className="glass-grid liquid-glass-grid">
        {/* AI Intelligence Card */}
        <div className="glass-card-wrapper">
          <GlassAICard />
        </div>
        
        {/* Material & Inventory Card */}
        <div className="glass-card-wrapper">
          <GlassInventoryCard />
        </div>
        
        {/* Disposition Card */}
        <div className="glass-card-wrapper">
          <GlassDispositionCard />
        </div>
        
        {/* Other Dashboard Cards */}
        {dashboardItems.map((item, index) => (
          <div key={index} className="glass-card-wrapper">
            <div 
              className="glass-dashboard-card liquid-glass"
              onClick={() => navigate(item.path)}
            >
              <div className="liquid-glass-overlay" />
              <div className="liquid-glass-content">
                <div className="glass-card-icon">
                  {item.icon}
                </div>
                <div className="glass-card-content">
                  <h3 className="glass-card-title">{item.title}</h3>
                  <p className="glass-card-description">{item.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="glass-fab" onClick={() => navigate('/new-customer')}>
        <AddIcon />
      </div>
    </div>
  );
};

export default GlassDashboard;