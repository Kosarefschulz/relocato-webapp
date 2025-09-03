import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  // CRM Icons
  Business as BusinessIcon,
  Hub as HubIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
  Microsoft as MicrosoftIcon,
  // Communication Icons
  Chat as ChatIcon,
  Groups as GroupsIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  MailOutline as MailOutlineIcon,
  // Finance Icons
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Cloud as CloudIcon,
  ShoppingBag as ShoppingBagIcon,
  // Project Management Icons
  Article as ArticleIcon,
  CalendarToday as CalendarTodayIcon,
  ViewKanban as ViewKanbanIcon,
  CheckCircle as CheckCircleIcon,
  RocketLaunch as RocketLaunchIcon,
  // Marketing Icons
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Send as SendIcon,
  Campaign as CampaignIcon,
  Analytics as AnalyticsIcon,
  // Development Icons
  GitHub as GitHubIcon,
  Code as CodeIcon,
  Bolt as BoltIcon,
  Build as BuildIcon,
  Dns as DnsIcon,
} from '@mui/icons-material';
import './GlassAPIHub.css';

// API Integration Types
type APICategory = 'CRM' | 'Communication' | 'Finance' | 'ProjectMgmt' | 'Marketing' | 'Development' | 'All';
type APIStatus = 'connected' | 'disconnected' | 'error';

interface APIIntegration {
  id: string;
  name: string;
  description: string;
  category: APICategory;
  status: APIStatus;
  icon: React.ElementType;
  apiCalls?: number;
  lastSync?: string;
  rateLimit?: number;
  gradient: string;
}

// Mock Data for 30 Tool Integrations
const mockIntegrations: APIIntegration[] = [
  // CRM & Sales
  { id: '1', name: 'Salesforce', description: 'Enterprise CRM Leader', category: 'CRM', status: 'connected', icon: CloudIcon, apiCalls: 1234, lastSync: '2 min', rateLimit: 85, gradient: 'linear-gradient(135deg, #00a1e0 0%, #0070d2 100%)' },
  { id: '2', name: 'HubSpot', description: 'All-in-One Marketing', category: 'CRM', status: 'connected', icon: HubIcon, apiCalls: 856, lastSync: '5 min', rateLimit: 62, gradient: 'linear-gradient(135deg, #ff7a59 0%, #ff5c35 100%)' },
  { id: '3', name: 'Pipedrive', description: 'Sales Pipeline Management', category: 'CRM', status: 'disconnected', icon: TimelineIcon, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: '4', name: 'Zoho CRM', description: 'Complete Business Suite', category: 'CRM', status: 'disconnected', icon: BusinessIcon, gradient: 'linear-gradient(135deg, #d4463b 0%, #c73e32 100%)' },
  { id: '5', name: 'Dynamics 365', description: 'Microsoft ERP', category: 'CRM', status: 'error', icon: MicrosoftIcon, gradient: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)' },
  
  // Communication
  { id: '6', name: 'Slack', description: 'Team Communication', category: 'Communication', status: 'connected', icon: ChatIcon, apiCalls: 3421, lastSync: '1 min', rateLimit: 45, gradient: 'linear-gradient(135deg, #4a154b 0%, #611f69 100%)' },
  { id: '7', name: 'Microsoft Teams', description: 'Collaboration Suite', category: 'Communication', status: 'connected', icon: GroupsIcon, apiCalls: 2156, lastSync: '3 min', rateLimit: 72, gradient: 'linear-gradient(135deg, #5059c9 0%, #7b83eb 100%)' },
  { id: '8', name: 'WhatsApp Business', description: 'Customer Messaging', category: 'Communication', status: 'disconnected', icon: WhatsAppIcon, gradient: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)' },
  { id: '9', name: 'Gmail', description: 'Google Email', category: 'Communication', status: 'connected', icon: EmailIcon, apiCalls: 5632, lastSync: 'Live', rateLimit: 30, gradient: 'linear-gradient(135deg, #ea4335 0%, #fbbc04 100%)' },
  { id: '10', name: 'Outlook', description: 'Microsoft Email', category: 'Communication', status: 'disconnected', icon: MailOutlineIcon, gradient: 'linear-gradient(135deg, #0078d4 0%, #40e0d0 100%)' },
  
  // Finance
  { id: '11', name: 'Stripe', description: 'Payment Processing', category: 'Finance', status: 'connected', icon: PaymentIcon, apiCalls: 8923, lastSync: 'Live', rateLimit: 15, gradient: 'linear-gradient(135deg, #635bff 0%, #7a73ff 100%)' },
  { id: '12', name: 'PayPal', description: 'Online Payments', category: 'Finance', status: 'connected', icon: AccountBalanceIcon, apiCalls: 4521, lastSync: '1 min', rateLimit: 38, gradient: 'linear-gradient(135deg, #003087 0%, #009cde 100%)' },
  { id: '13', name: 'QuickBooks', description: 'Accounting Software', category: 'Finance', status: 'connected', icon: ReceiptIcon, apiCalls: 2341, lastSync: '10 min', rateLimit: 55, gradient: 'linear-gradient(135deg, #2ca01c 0%, #80bc00 100%)' },
  { id: '14', name: 'Xero', description: 'Cloud Accounting', category: 'Finance', status: 'disconnected', icon: CloudIcon, gradient: 'linear-gradient(135deg, #13b5ea 0%, #0099cc 100%)' },
  { id: '15', name: 'Klarna', description: 'Buy Now Pay Later', category: 'Finance', status: 'disconnected', icon: ShoppingBagIcon, gradient: 'linear-gradient(135deg, #ffb3c7 0%, #ffa1b5 100%)' },
  
  // Project Management
  { id: '16', name: 'Notion', description: 'All-in-One Workspace', category: 'ProjectMgmt', status: 'connected', icon: ArticleIcon, apiCalls: 6234, lastSync: '2 min', rateLimit: 42, gradient: 'linear-gradient(135deg, #000000 0%, #434343 100%)' },
  { id: '17', name: 'Monday.com', description: 'Visual Project Mgmt', category: 'ProjectMgmt', status: 'connected', icon: CalendarTodayIcon, apiCalls: 3456, lastSync: '5 min', rateLimit: 68, gradient: 'linear-gradient(135deg, #ff6900 0%, #ffcc00 100%)' },
  { id: '18', name: 'Trello', description: 'Kanban Boards', category: 'ProjectMgmt', status: 'disconnected', icon: ViewKanbanIcon, gradient: 'linear-gradient(135deg, #0079bf 0%, #026aa7 100%)' },
  { id: '19', name: 'Asana', description: 'Task Management', category: 'ProjectMgmt', status: 'disconnected', icon: CheckCircleIcon, gradient: 'linear-gradient(135deg, #fc636b 0%, #fc4c5f 100%)' },
  { id: '20', name: 'Jira', description: 'Agile Development', category: 'ProjectMgmt', status: 'connected', icon: RocketLaunchIcon, apiCalls: 7891, lastSync: '1 min', rateLimit: 25, gradient: 'linear-gradient(135deg, #0052cc 0%, #2684ff 100%)' },
  
  // Marketing
  { id: '21', name: 'Shopify', description: 'E-Commerce Platform', category: 'Marketing', status: 'connected', icon: StoreIcon, apiCalls: 5421, lastSync: 'Live', rateLimit: 35, gradient: 'linear-gradient(135deg, #96bf48 0%, #7ab55c 100%)' },
  { id: '22', name: 'WooCommerce', description: 'WordPress Commerce', category: 'Marketing', status: 'disconnected', icon: ShoppingCartIcon, gradient: 'linear-gradient(135deg, #96588a 0%, #7f54b3 100%)' },
  { id: '23', name: 'Klaviyo', description: 'Email Marketing', category: 'Marketing', status: 'connected', icon: SendIcon, apiCalls: 3211, lastSync: '10 min', rateLimit: 58, gradient: 'linear-gradient(135deg, #000000 0%, #434343 100%)' },
  { id: '24', name: 'Mailchimp', description: 'Marketing Automation', category: 'Marketing', status: 'disconnected', icon: CampaignIcon, gradient: 'linear-gradient(135deg, #ffe01b 0%, #ffc933 100%)' },
  { id: '25', name: 'Google Ads', description: 'Advertising Platform', category: 'Marketing', status: 'connected', icon: AnalyticsIcon, apiCalls: 9876, lastSync: 'Live', rateLimit: 12, gradient: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)' },
  
  // Development
  { id: '26', name: 'GitHub', description: 'Code Repository', category: 'Development', status: 'connected', icon: GitHubIcon, apiCalls: 12543, lastSync: 'Live', rateLimit: 8, gradient: 'linear-gradient(135deg, #24292e 0%, #040d21 100%)' },
  { id: '27', name: 'GitLab', description: 'DevOps Platform', category: 'Development', status: 'disconnected', icon: CodeIcon, gradient: 'linear-gradient(135deg, #fc6d26 0%, #e24329 100%)' },
  { id: '28', name: 'Zapier', description: 'No-Code Automation', category: 'Development', status: 'connected', icon: BoltIcon, apiCalls: 15234, lastSync: 'Live', rateLimit: 5, gradient: 'linear-gradient(135deg, #ff6900 0%, #fcb900 100%)' },
  { id: '29', name: 'Make', description: 'Advanced Automation', category: 'Development', status: 'disconnected', icon: BuildIcon, gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
  { id: '30', name: 'Docker Hub', description: 'Container Registry', category: 'Development', status: 'connected', icon: DnsIcon, apiCalls: 4532, lastSync: '15 min', rateLimit: 48, gradient: 'linear-gradient(135deg, #2496ed 0%, #0db7ed 100%)' },
];

const GlassAPIHub: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<APICategory>('All');
  const [integrations, setIntegrations] = useState<APIIntegration[]>(mockIntegrations);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<APIIntegration | null>(null);

  // Filter integrations by category
  const filteredIntegrations = selectedCategory === 'All' 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory);

  // Calculate stats
  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const totalApiCalls = integrations.reduce((sum, i) => sum + (i.apiCalls || 0), 0);
  const avgRateLimit = Math.round(
    integrations
      .filter(i => i.rateLimit !== undefined)
      .reduce((sum, i, _, arr) => sum + (i.rateLimit || 0) / arr.length, 0)
  );

  const categories: { name: APICategory; label: string; count: number }[] = [
    { name: 'All', label: 'Alle', count: integrations.length },
    { name: 'CRM', label: 'CRM & Sales', count: integrations.filter(i => i.category === 'CRM').length },
    { name: 'Communication', label: 'Kommunikation', count: integrations.filter(i => i.category === 'Communication').length },
    { name: 'Finance', label: 'Finanzen', count: integrations.filter(i => i.category === 'Finance').length },
    { name: 'ProjectMgmt', label: 'Projektmanagement', count: integrations.filter(i => i.category === 'ProjectMgmt').length },
    { name: 'Marketing', label: 'Marketing', count: integrations.filter(i => i.category === 'Marketing').length },
    { name: 'Development', label: 'Entwicklung', count: integrations.filter(i => i.category === 'Development').length },
  ];

  const handleConnect = (integration: APIIntegration) => {
    setSelectedIntegration(integration);
    setShowApiKeyModal(true);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => 
      prev.map(i => i.id === id ? { ...i, status: 'disconnected' as APIStatus } : i)
    );
  };

  const handleSaveApiKey = () => {
    if (selectedIntegration) {
      setIntegrations(prev => 
        prev.map(i => i.id === selectedIntegration.id 
          ? { ...i, status: 'connected' as APIStatus, apiCalls: 0, lastSync: 'Jetzt', rateLimit: 100 } 
          : i
        )
      );
    }
    setShowApiKeyModal(false);
    setSelectedIntegration(null);
  };

  return (
    <div className="glass-api-hub">
      {/* Header */}
      <div className="api-hub-header">
        <h1 className="api-hub-title">Wertvoll CRM - API Hub</h1>
        <p className="api-hub-subtitle">Verbinden Sie Ihre wichtigsten Business-Tools an einem Ort</p>
        
        {/* Stats */}
        <div className="api-hub-stats">
          <div className="api-stat-card">
            <div className="api-stat-value">{connectedCount}/30</div>
            <div className="api-stat-label">Verbunden</div>
            <span className="api-stat-change positive">
              <TrendingUpIcon style={{ fontSize: '12px', marginRight: '4px' }} />
              +3 diese Woche
            </span>
          </div>
          <div className="api-stat-card">
            <div className="api-stat-value">{totalApiCalls.toLocaleString()}</div>
            <div className="api-stat-label">API Calls heute</div>
            <span className="api-stat-change positive">
              <TrendingUpIcon style={{ fontSize: '12px', marginRight: '4px' }} />
              +12%
            </span>
          </div>
          <div className="api-stat-card">
            <div className="api-stat-value">{avgRateLimit}%</div>
            <div className="api-stat-label">Ø Rate Limit</div>
            <span className="api-stat-change negative">
              <TrendingDownIcon style={{ fontSize: '12px', marginRight: '4px' }} />
              Hoch
            </span>
          </div>
          <div className="api-stat-card">
            <div className="api-stat-value">€189</div>
            <div className="api-stat-label">Gespart/Monat</div>
            <span className="api-stat-change positive">
              <TrendingUpIcon style={{ fontSize: '12px', marginRight: '4px' }} />
              Durch Automation
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="api-categories">
        {categories.map(cat => (
          <button
            key={cat.name}
            className={`api-category-tab ${selectedCategory === cat.name ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            {cat.label}
            {cat.count > 0 && (
              <span className="api-category-badge">{cat.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* API Grid */}
      <div className="api-grid">
        {filteredIntegrations.map(integration => (
          <div 
            key={integration.id} 
            className="api-connection-card"
            style={{ '--card-gradient': integration.gradient } as React.CSSProperties}
          >
            <div className="api-card-header">
              <div className="api-card-logo">
                <integration.icon style={{ fontSize: '28px', color: 'rgba(255, 255, 255, 0.9)' }} />
              </div>
              <div className={`api-card-status ${integration.status}`} />
            </div>
            
            <div className="api-card-content">
              <h3 className="api-card-name">{integration.name}</h3>
              <p className="api-card-description">{integration.description}</p>
            </div>

            {integration.status === 'connected' && (
              <div className="api-card-stats">
                <div className="api-card-stat">
                  <div className="api-card-stat-value">{integration.apiCalls?.toLocaleString()}</div>
                  <div className="api-card-stat-label">API Calls</div>
                </div>
                <div className="api-card-stat">
                  <div className="api-card-stat-value">{integration.lastSync}</div>
                  <div className="api-card-stat-label">Letzter Sync</div>
                </div>
                <div className="api-card-stat">
                  <div className="api-card-stat-value">{integration.rateLimit}%</div>
                  <div className="api-card-stat-label">Rate Limit</div>
                </div>
              </div>
            )}

            <div className="api-card-actions">
              {integration.status === 'connected' ? (
                <>
                  <button className="api-card-button">
                    <SettingsIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                    Konfigurieren
                  </button>
                  <button 
                    className="api-card-button"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    <LinkOffIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                    Trennen
                  </button>
                </>
              ) : (
                <button 
                  className="api-card-button primary"
                  onClick={() => handleConnect(integration)}
                >
                  <LinkIcon style={{ fontSize: '16px', marginRight: '4px' }} />
                  Verbinden
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add New Integration Card */}
        <div className="api-add-card">
          <div className="api-add-icon">
            <AddIcon />
          </div>
          <div className="api-add-text">Neue Integration</div>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && selectedIntegration && (
        <div className="api-key-modal" onClick={() => setShowApiKeyModal(false)}>
          <div className="api-key-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '24px', fontWeight: '600', margin: 0 }}>
                {selectedIntegration.name} verbinden
              </h2>
              <button 
                onClick={() => setShowApiKeyModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxx"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  API Secret (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Optional - für OAuth 2.0"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '14px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '12px',
                border: '0.5px solid rgba(102, 126, 234, 0.2)',
              }}>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  💡 Tipp: Sie finden Ihren API-Key in den Einstellungen von {selectedIntegration.name}. 
                  Die Verbindung wird verschlüsselt gespeichert.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveApiKey}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                    border: '0.5px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '12px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  <CheckIcon style={{ fontSize: '18px', marginRight: '8px', verticalAlign: 'middle' }} />
                  Verbinden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlassAPIHub;