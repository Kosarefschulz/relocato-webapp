import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  CloudDownload as ExportIcon,
  Description as QuoteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Customer, CUSTOMER_PHASES, CustomerPhase } from '../types';
import { databaseService } from '../config/database.config';
import { motion, AnimatePresence } from 'framer-motion';
import './GlassCustomersList.css';
import '../styles/ruempelSchmiede.css';

const GlassCustomersList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'created'>('created');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, sortBy, filterStatus]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.fromAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.toAddress?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => {
        if (filterStatus === 'active') return customer.movingDate && new Date(customer.movingDate) > new Date();
        if (filterStatus === 'pending') return !customer.movingDate;
        if (filterStatus === 'completed') return customer.movingDate && new Date(customer.movingDate) <= new Date();
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          if (!a.movingDate) return 1;
          if (!b.movingDate) return -1;
          return new Date(a.movingDate).getTime() - new Date(b.movingDate).getTime();
        case 'created':
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Nicht angegeben';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'EEEE, d. MMMM yyyy', { locale: de });
    } catch {
      return 'Nicht angegeben';
    }
  };

  const formatImportDate = (date: string | Date | undefined) => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd. MMMM yyyy', { locale: de });
    } catch {
      return '';
    }
  };

  const getStatusColor = (customer: Customer) => {
    if (!customer.movingDate) return 'pending';
    const movingDate = new Date(customer.movingDate);
    const today = new Date();
    const diffTime = movingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'completed';
    if (diffDays <= 7) return 'urgent';
    return 'active';
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Telefon', 'Umzugsdatum', 'Von', 'Nach'],
      ...filteredCustomers.map(c => [
        c.name,
        c.email || '',
        c.phone || '',
        c.movingDate ? formatDate(c.movingDate) : '',
        c.fromAddress || '',
        c.toAddress || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kunden_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="glass-customers-container">
      {/* Header */}
      <div className="glass-customers-header">
        <div className="glass-header-content">
          <div className="glass-header-left">
            <button className="glass-back-button" onClick={() => navigate('/dashboard')}>
              <ArrowBackIcon />
            </button>
            <h1 className="glass-header-title">Kundenliste</h1>
            <div className="glass-header-count">
              {filteredCustomers.length} von {customers.length} Kunden
            </div>
          </div>
          <div className="glass-header-actions">
            <button className="glass-action-button" onClick={handleExport}>
              <ExportIcon />
              <span>Exportieren</span>
            </button>
            <button className="glass-action-button primary" onClick={() => navigate('/new-customer')}>
              <AddIcon />
              <span>Neuer Kunde</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-search-section">
        <div className="glass-search-box">
          <SearchIcon className="glass-search-icon" />
          <input
            type="text"
            className="glass-search-input"
            placeholder="Suche nach Name, E-Mail, Telefon oder Adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="glass-search-clear" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className="glass-filters">
          <div className="glass-filter-chips">
            <button
              className={`glass-chip ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Alle
            </button>
            <button
              className={`glass-chip ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Aktiv
            </button>
            <button
              className={`glass-chip ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Ausstehend
            </button>
            <button
              className={`glass-chip ${filterStatus === 'completed' ? 'active' : ''}`}
              onClick={() => setFilterStatus('completed')}
            >
              Abgeschlossen
            </button>
          </div>

          <div className="glass-sort-dropdown">
            <SortIcon />
            <select
              className="glass-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="created">Neueste zuerst</option>
              <option value="name">Name (A-Z)</option>
              <option value="date">Umzugsdatum</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="glass-customers-list">
        {loading ? (
          <div className="glass-loading">
            <div className="glass-spinner"></div>
            <p>Lade Kunden...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="glass-empty-state">
            <div className="glass-empty-icon">👥</div>
            <h3>Keine Kunden gefunden</h3>
            <p>Versuche deine Suche anzupassen oder füge einen neuen Kunden hinzu</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-customer-card"
                onClick={() => navigate(`/customer/${customer.id}`)}
              >
                <div className="glass-customer-content">
                  <div className="glass-customer-avatar">
                    {getInitials(customer.name)}
                  </div>

                  <div className="glass-customer-info">
                    <div className="glass-customer-header">
                      <h3 className="glass-customer-name">{customer.name}</h3>
                      {customer.customerNumber && (
                        <span className="glass-customer-number">#{customer.customerNumber}</span>
                      )}
                      <div className={`glass-status-indicator ${getStatusColor(customer)}`}></div>
                    </div>

                    <div className="glass-customer-details">
                      {customer.currentPhase && (
                        <div className="glass-detail-item" style={{ marginBottom: '8px' }}>
                          <span
                            className="glass-phase-badge"
                            style={{
                              background: `${CUSTOMER_PHASES.find(p => p.value === customer.currentPhase)?.color || '#6b7280'}20`,
                              border: `1px solid ${CUSTOMER_PHASES.find(p => p.value === customer.currentPhase)?.color || '#6b7280'}60`,
                              color: CUSTOMER_PHASES.find(p => p.value === customer.currentPhase)?.color || '#6b7280',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            {CUSTOMER_PHASES.find(p => p.value === customer.currentPhase)?.label}
                          </span>
                        </div>
                      )}

                      {customer.movingDate && (
                        <div className="glass-detail-item">
                          <CalendarIcon />
                          <span>Umzug: {formatDate(customer.movingDate)}</span>
                        </div>
                      )}

                      {customer.phone && (
                        <div className="glass-detail-item">
                          <PhoneIcon />
                          <span>{customer.phone}</span>
                        </div>
                      )}

                      {customer.email && (
                        <div className="glass-detail-item">
                          <EmailIcon />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>

                    {(customer.fromAddress || customer.toAddress) && (
                      <div className="glass-customer-addresses">
                        <LocationIcon />
                        <span>
                          {customer.fromAddress && `Von: ${customer.fromAddress}`}
                          {customer.fromAddress && customer.toAddress && ' → '}
                          {customer.toAddress && `Nach: ${customer.toAddress}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="glass-customer-actions">
                    {customer.createdAt && (
                      <span className="glass-import-date">
                        Importiert: {formatImportDate(customer.createdAt)}
                      </span>
                    )}
                    <button
                      className="glass-quote-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/quote/create/${customer.id}`);
                      }}
                    >
                      <QuoteIcon />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default GlassCustomersList;