import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon, 
  PersonAdd as PersonAddIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as SalesIcon,
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Photo as PhotoIcon,
  Assignment as DispositionIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import './GlassSidebar.css';

interface SidebarItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  section: string;
}

interface GlassSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const GlassSidebar: React.FC<GlassSidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const sidebarItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      section: 'main'
    },
    {
      title: 'Kunde suchen',
      icon: <SearchIcon />,
      path: '/search-customer',
      section: 'customers'
    },
    {
      title: 'Neuer Kunde',
      icon: <PersonAddIcon />,
      path: '/new-customer',
      section: 'customers'
    },
    {
      title: 'Kundenliste',
      icon: <PeopleIcon />,
      path: '/customers',
      section: 'customers'
    },
    {
      title: 'Angebote',
      icon: <DescriptionIcon />,
      path: '/quotes',
      badge: '3',
      section: 'business'
    },
    {
      title: 'Buchhaltung',
      icon: <ReceiptIcon />,
      path: '/accounting',
      section: 'business'
    },
    {
      title: 'Vertrieb',
      icon: <SalesIcon />,
      path: '/sales',
      section: 'business'
    },
    {
      title: 'Kalender',
      icon: <CalendarIcon />,
      path: '/calendar',
      section: 'tools'
    },
    {
      title: 'E-Mail',
      icon: <EmailIcon />,
      path: '/email-client',
      badge: '12',
      section: 'tools'
    },
    {
      title: 'Disposition',
      icon: <DispositionIcon />,
      path: '/disposition',
      section: 'tools'
    },
    {
      title: 'Galerie',
      icon: <PhotoIcon />,
      path: '/gallery',
      section: 'tools'
    },
    {
      title: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics',
      section: 'tools'
    },
    {
      title: 'Admin Tools',
      icon: <AdminIcon />,
      path: '/admin-tools',
      section: 'admin'
    },
    {
      title: 'API Hub',
      icon: <SettingsIcon />,
      path: '/api-hub',
      badge: '30',
      section: 'admin'
    },
    {
      title: 'Workflow Builder',
      icon: <SettingsIcon />,
      path: '/workflow-builder',
      badge: 'NEU',
      section: 'admin'
    },
    {
      title: 'Einstellungen',
      icon: <SettingsIcon />,
      path: '/settings',
      section: 'admin'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onToggle();
  };

  const handleLogout = () => {
    // Add logout logic here
    navigate('/login');
  };

  const groupedItems = {
    main: sidebarItems.filter(item => item.section === 'main'),
    customers: sidebarItems.filter(item => item.section === 'customers'),
    business: sidebarItems.filter(item => item.section === 'business'),
    tools: sidebarItems.filter(item => item.section === 'tools'),
    admin: sidebarItems.filter(item => item.section === 'admin')
  };

  const sectionTitles = {
    main: '',
    customers: 'Kunden',
    business: 'Geschäft',
    tools: 'Werkzeuge',
    admin: 'Verwaltung'
  };

  useEffect(() => {
    // Close sidebar on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onToggle]);

  return (
    <>
      {/* Menu Toggle Button */}
      <button 
        className={`menu-toggle ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
        aria-label="Toggle menu"
      >
        <MenuIcon />
      </button>

      {/* Sidebar Container */}
      <div className={`glass-sidebar-container ${isOpen ? 'active' : ''}`}>
        {/* Overlay */}
        <div 
          className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
          onClick={onToggle}
        />

        {/* Sidebar */}
        <aside className={`glass-sidebar ${isOpen ? 'active' : ''}`}>
          {/* Header */}
          <div className="sidebar-header">
            <div className="sidebar-logo">Wertvoll CRM</div>
            <button className="sidebar-close" onClick={onToggle}>
              <CloseIcon />
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            {Object.entries(groupedItems).map(([section, items]) => (
              items.length > 0 && (
                <div key={section} className="sidebar-section">
                  {sectionTitles[section as keyof typeof sectionTitles] && (
                    <div className="sidebar-section-title">
                      {sectionTitles[section as keyof typeof sectionTitles]}
                    </div>
                  )}
                  {items.map((item) => (
                    <a
                      key={item.path}
                      className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <div className="sidebar-item-icon">
                        {item.icon}
                      </div>
                      <span className="sidebar-item-text">{item.title}</span>
                      {item.badge && (
                        <span className="sidebar-item-badge">{item.badge}</span>
                      )}
                    </a>
                  ))}
                </div>
              )
            ))}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">A</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">Admin</div>
                <div className="sidebar-user-role">Administrator</div>
              </div>
            </div>
            <a 
              className="sidebar-item" 
              onClick={handleLogout}
              style={{ marginTop: '12px' }}
            >
              <div className="sidebar-item-icon">
                <LogoutIcon />
              </div>
              <span className="sidebar-item-text">Abmelden</span>
            </a>
          </div>
        </aside>
      </div>
    </>
  );
};

export default GlassSidebar;