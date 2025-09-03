import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  People as PeopleIcon,
  ChevronRight as ChevronRightIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Customer } from '../types';
import { databaseService as googleSheetsService } from '../config/database.config';
import './GlassCustomerList.css';

interface GlassCustomerListProps {
  limit?: number;
  showViewAll?: boolean;
}

const GlassCustomerList: React.FC<GlassCustomerListProps> = ({ 
  limit = 5, 
  showViewAll = true 
}) => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await googleSheetsService.getCustomers();
      // Sort by creation date (newest first) and limit
      const sortedCustomers = data
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, limit);
      setCustomers(sortedCustomers);
    } catch (error) {
      console.error('Fehler beim Laden der Kunden:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerStatus = (customer: Customer) => {
    if (customer.movingDate) {
      const movingDate = new Date(customer.movingDate);
      const today = new Date();
      const diffTime = movingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { label: 'Abgeschlossen', class: 'confirmed' };
      } else if (diffDays <= 7) {
        return { label: 'Diese Woche', class: 'pending' };
      } else {
        return { label: 'Geplant', class: 'new' };
      }
    }
    return { label: 'Neu', class: 'new' };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCustomerDate = (date: string | Date | undefined) => {
    if (!date) return 'Kürzlich';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffTime = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Heute';
      if (diffDays === 1) return 'Gestern';
      if (diffDays < 7) return `vor ${diffDays} Tagen`;
      if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
      
      return format(dateObj, 'dd. MMM', { locale: de });
    } catch {
      return 'Kürzlich';
    }
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customer/${customerId}`);
  };

  const handleNewCustomer = () => {
    navigate('/new-customer');
  };

  const handleViewAll = () => {
    navigate('/customers');
  };

  return (
    <div className="glass-customer-list">
      {/* Header */}
      <div className="customer-list-header">
        <div className="customer-list-title">
          <div className="customer-list-icon">
            <PeopleIcon />
          </div>
          Neueste Kunden
          {customers.length > 0 && (
            <div className="customer-list-badge">
              {customers.length}
            </div>
          )}
        </div>
        {showViewAll && customers.length > 0 && (
          <button className="customer-list-view-all" onClick={handleViewAll}>
            Alle anzeigen
            <ChevronRightIcon style={{ fontSize: '16px' }} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="customer-list-content">
        {loading ? (
          <div className="customer-list-loading">
            <div className="customer-list-spinner" />
          </div>
        ) : customers.length > 0 ? (
          customers.map(customer => {
            const status = getCustomerStatus(customer);
            return (
              <div
                key={customer.id}
                className="customer-item"
                onClick={() => handleCustomerClick(customer.id)}
              >
                <div className="customer-item-left">
                  <div className="customer-avatar">
                    {getInitials(customer.name)}
                  </div>
                  <div className="customer-info">
                    <div className="customer-name">{customer.name}</div>
                    <div className="customer-details">
                      {customer.fromAddress && (
                        <>
                          <span>{customer.fromAddress.split(',')[0]}</span>
                          {customer.toAddress && (
                            <>
                              <div className="customer-detail-separator" />
                              <span>{customer.toAddress.split(',')[0]}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="customer-item-right">
                  <div className="customer-date">
                    {formatCustomerDate(customer.createdAt)}
                  </div>
                  <div className={`customer-status ${status.class}`}>
                    {status.label}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="customer-list-empty">
            <div className="customer-list-empty-icon">
              <PeopleIcon style={{ fontSize: '48px' }} />
            </div>
            <div className="customer-list-empty-text">
              Noch keine Kunden vorhanden
            </div>
            <button className="customer-list-empty-button" onClick={handleNewCustomer}>
              <PersonAddIcon />
              Ersten Kunden anlegen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlassCustomerList;