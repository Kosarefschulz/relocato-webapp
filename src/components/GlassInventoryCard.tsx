import React from 'react';
import { Inventory as InventoryIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './GlassInventoryCard.css';

const GlassInventoryCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="glass-dashboard-card liquid-glass" onClick={() => navigate('/inventory')}>
      <div className="liquid-glass-overlay" />
      <div className="liquid-glass-content">
        <div className="glass-card-icon">
          <InventoryIcon />
        </div>
        <div className="glass-card-content">
          <h3 className="glass-card-title">Material & Lagerbestand</h3>
          <p className="glass-card-description">Verpackungsmaterial verwalten</p>
        </div>
      </div>
    </div>
  );
};

export default GlassInventoryCard;