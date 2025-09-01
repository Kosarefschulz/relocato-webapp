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
import { SmartSearch } from './SmartSearch';
import SyncStatus from './SyncStatus';
import LogoutButton from './LogoutButton';
import NotificationCenter from './NotificationCenter';

interface DashboardItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  gradient: string;
}

const GlassDashboard: React.FC = () => {
  const navigate = useNavigate();

  const dashboardItems: DashboardItem[] = [
    {
      title: 'Kunde suchen',
      description: 'Bestehenden Kunden finden',
      icon: <SearchIcon />,
      path: '/search-customer',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: 'Neuer Kunde',
      description: 'Kunden anlegen',
      icon: <AddIcon />,
      path: '/new-customer',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      title: 'Angebote',
      description: 'Angebote verwalten',
      icon: <DescriptionIcon />,
      path: '/quotes',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: 'Buchhaltung',
      description: 'Rechnungen & Zahlungen',
      icon: <ReceiptIcon />,
      path: '/accounting',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Kalender',
      description: 'Termine verwalten',
      icon: <CalendarIcon />,
      path: '/calendar',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      title: 'Vertrieb',
      description: 'Verkauf & Analytics',
      icon: <SalesIcon />,
      path: '/sales',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      title: 'Admin Tools',
      description: 'System verwalten',
      icon: <AdminIcon />,
      path: '/admin-tools',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    {
      title: 'E-Mail',
      description: 'Nachrichten verwalten',
      icon: <EmailIcon />,
      path: '/email-client',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
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

      {/* Dashboard Grid */}
      <div className="glass-grid">
        {dashboardItems.map((item, index) => (
          <div key={index} className="glass-card-wrapper">
            <div 
              className="glass-dashboard-card"
              onClick={() => navigate(item.path)}
              style={{ '--card-gradient': item.gradient } as React.CSSProperties}
            >
              <div className="glass-card-icon">
                {item.icon}
              </div>
              <div className="glass-card-content">
                <h3 className="glass-card-title">{item.title}</h3>
                <p className="glass-card-description">{item.description}</p>
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