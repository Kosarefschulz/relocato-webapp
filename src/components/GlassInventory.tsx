import React, { useState } from 'react';
import {
  Inventory as InventoryIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as CartIcon,
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  BarChart as ChartIcon,
  Settings as SettingsIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import './GlassInventory.css';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location: string;
  lastOrdered: string;
  supplier: string;
  price: number;
  status: 'ok' | 'low' | 'critical' | 'overstocked';
  trend: 'up' | 'down' | 'stable';
  monthlyUsage: number;
}

const GlassInventory: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = [
    { id: 'all', name: 'Alle Artikel', count: 87 },
    { id: 'kartons', name: 'Kartons', count: 24 },
    { id: 'verpackung', name: 'Verpackungsmaterial', count: 18 },
    { id: 'werkzeug', name: 'Werkzeuge', count: 15 },
    { id: 'schutz', name: 'Schutzmaterial', count: 12 },
    { id: 'transport', name: 'Transporthilfen', count: 10 },
    { id: 'sonstiges', name: 'Sonstiges', count: 8 }
  ];

  const inventoryItems: InventoryItem[] = [
    {
      id: '1',
      name: 'Umzugskarton Standard',
      category: 'kartons',
      sku: 'KAR-001',
      currentStock: 450,
      minStock: 200,
      maxStock: 800,
      unit: 'Stück',
      location: 'Lager A - Regal 3',
      lastOrdered: '15.08.2024',
      supplier: 'PackPro GmbH',
      price: 2.50,
      status: 'ok',
      trend: 'stable',
      monthlyUsage: 120
    },
    {
      id: '2',
      name: 'Luftpolsterfolie 100m',
      category: 'verpackung',
      sku: 'VER-012',
      currentStock: 85,
      minStock: 100,
      maxStock: 300,
      unit: 'Rollen',
      location: 'Lager B - Regal 1',
      lastOrdered: '22.08.2024',
      supplier: 'FoilTech AG',
      price: 18.90,
      status: 'low',
      trend: 'down',
      monthlyUsage: 25
    },
    {
      id: '3',
      name: 'Packpapier 80g/m²',
      category: 'verpackung',
      sku: 'VER-003',
      currentStock: 12,
      minStock: 50,
      maxStock: 200,
      unit: 'Rollen',
      location: 'Lager A - Regal 2',
      lastOrdered: '01.08.2024',
      supplier: 'PaperWorld',
      price: 8.50,
      status: 'critical',
      trend: 'down',
      monthlyUsage: 40
    },
    {
      id: '4',
      name: 'Möbelroller 600kg',
      category: 'transport',
      sku: 'TRA-021',
      currentStock: 24,
      minStock: 10,
      maxStock: 30,
      unit: 'Stück',
      location: 'Lager C - Eingang',
      lastOrdered: '10.07.2024',
      supplier: 'TransportTech',
      price: 45.00,
      status: 'ok',
      trend: 'up',
      monthlyUsage: 2
    },
    {
      id: '5',
      name: 'Klebeband transparent 50mm',
      category: 'verpackung',
      sku: 'VER-008',
      currentStock: 180,
      minStock: 100,
      maxStock: 400,
      unit: 'Rollen',
      location: 'Lager A - Regal 1',
      lastOrdered: '28.08.2024',
      supplier: 'TapeMaster',
      price: 3.20,
      status: 'ok',
      trend: 'stable',
      monthlyUsage: 60
    },
    {
      id: '6',
      name: 'Stretchfolie 500mm',
      category: 'verpackung',
      sku: 'VER-015',
      currentStock: 320,
      minStock: 50,
      maxStock: 200,
      unit: 'Rollen',
      location: 'Lager B - Regal 3',
      lastOrdered: '20.08.2024',
      supplier: 'WrapPro',
      price: 12.80,
      status: 'overstocked',
      trend: 'up',
      monthlyUsage: 15
    }
  ];

  const stats = {
    totalValue: 45780,
    lowStockItems: 12,
    criticalItems: 3,
    pendingOrders: 5,
    monthlyConsumption: 8920,
    supplierCount: 14
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ok': return 'status-ok';
      case 'low': return 'status-low';
      case 'critical': return 'status-critical';
      case 'overstocked': return 'status-overstocked';
      default: return '';
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="glass-inventory">
      {/* Header */}
      <div className="inventory-header">
        <div className="inventory-header-content">
          <div className="inventory-title-section">
            <div className="inventory-icon-wrapper">
              <InventoryIcon />
            </div>
            <div>
              <h1 className="inventory-title">Material & Lagerbestand</h1>
              <p className="inventory-subtitle">Verwalten Sie Ihr Umzugsmaterial effizient</p>
            </div>
          </div>
          
          <div className="inventory-actions">
            <button className="inventory-btn secondary">
              <QrCodeIcon />
              <span>Scanner</span>
            </button>
            <button className="inventory-btn secondary">
              <DownloadIcon />
              <span>Export</span>
            </button>
            <button className="inventory-btn primary" onClick={() => setShowAddModal(true)}>
              <AddIcon />
              <span>Neuer Artikel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="inventory-stats-grid">
        <div className="inventory-stat-card">
          <div className="stat-card-icon value">
            <ChartIcon />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">€{stats.totalValue.toLocaleString()}</div>
            <div className="stat-card-label">Gesamtwert Lager</div>
            <div className="stat-card-change positive">
              <ArrowUpIcon style={{ fontSize: 14 }} />
              <span>12% vs. Vormonat</span>
            </div>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-card-icon warning">
            <WarningIcon />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.lowStockItems}</div>
            <div className="stat-card-label">Niedriger Bestand</div>
            <div className="stat-card-change negative">
              <span>{stats.criticalItems} kritisch</span>
            </div>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-card-icon shipping">
            <ShippingIcon />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.pendingOrders}</div>
            <div className="stat-card-label">Offene Bestellungen</div>
            <div className="stat-card-change">
              <span>Lieferung diese Woche</span>
            </div>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-card-icon consumption">
            <CartIcon />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">€{stats.monthlyConsumption.toLocaleString()}</div>
            <div className="stat-card-label">Monatsverbrauch</div>
            <div className="stat-card-change">
              <span>{stats.supplierCount} Lieferanten</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="inventory-controls">
        <div className="inventory-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Artikel suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="inventory-categories">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.name}</span>
              <span className="category-count">{cat.count}</span>
            </button>
          ))}
        </div>

        <button className="inventory-filter-btn">
          <FilterIcon />
          <span>Filter</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Artikel</th>
              <th>SKU</th>
              <th>Bestand</th>
              <th>Status</th>
              <th>Standort</th>
              <th>Lieferant</th>
              <th>Preis/Einheit</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} className="inventory-row">
                <td>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-category">{item.category}</div>
                  </div>
                </td>
                <td className="item-sku">{item.sku}</td>
                <td>
                  <div className="stock-info">
                    <div className="stock-numbers">
                      <span className="stock-current">{item.currentStock}</span>
                      <span className="stock-unit">/{item.maxStock} {item.unit}</span>
                    </div>
                    <div className="stock-bar">
                      <div 
                        className={`stock-fill ${getStatusColor(item.status)}`}
                        style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                      />
                    </div>
                    <div className="stock-usage">
                      {item.trend === 'up' && <TrendingUpIcon style={{ fontSize: 14, color: '#43e97b' }} />}
                      {item.trend === 'down' && <TrendingDownIcon style={{ fontSize: 14, color: '#f5576c' }} />}
                      <span>{item.monthlyUsage}/Monat</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getStatusColor(item.status)}`}>
                    {item.status === 'ok' && <CheckIcon style={{ fontSize: 14 }} />}
                    {item.status === 'low' && <TrendingDownIcon style={{ fontSize: 14 }} />}
                    {item.status === 'critical' && <WarningIcon style={{ fontSize: 14 }} />}
                    {item.status === 'overstocked' && <TrendingUpIcon style={{ fontSize: 14 }} />}
                    <span>
                      {item.status === 'ok' && 'OK'}
                      {item.status === 'low' && 'Niedrig'}
                      {item.status === 'critical' && 'Kritisch'}
                      {item.status === 'overstocked' && 'Überbestand'}
                    </span>
                  </span>
                </td>
                <td className="item-location">{item.location}</td>
                <td>
                  <div className="supplier-info">
                    <div className="supplier-name">{item.supplier}</div>
                    <div className="last-ordered">Zuletzt: {item.lastOrdered}</div>
                  </div>
                </td>
                <td className="item-price">€{item.price.toFixed(2)}</td>
                <td>
                  <div className="item-actions">
                    <button className="action-btn order" title="Nachbestellen">
                      <CartIcon />
                    </button>
                    <button className="action-btn edit" title="Bearbeiten">
                      <SettingsIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="inventory-quick-actions">
        <div className="quick-action-card">
          <div className="quick-action-icon">
            <WarningIcon />
          </div>
          <div className="quick-action-content">
            <h3>Automatische Nachbestellung</h3>
            <p>3 Artikel unter Mindestbestand</p>
            <button className="quick-action-btn">Jetzt bestellen</button>
          </div>
        </div>

        <div className="quick-action-card">
          <div className="quick-action-icon">
            <QrCodeIcon />
          </div>
          <div className="quick-action-content">
            <h3>Inventur durchführen</h3>
            <p>Letzte Inventur vor 45 Tagen</p>
            <button className="quick-action-btn">Scanner starten</button>
          </div>
        </div>

        <div className="quick-action-card">
          <div className="quick-action-icon">
            <ChartIcon />
          </div>
          <div className="quick-action-content">
            <h3>Verbrauchsanalyse</h3>
            <p>Optimieren Sie Ihre Bestände</p>
            <button className="quick-action-btn">Bericht anzeigen</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassInventory;