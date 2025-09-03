import React from 'react';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './GlassDispositionCard.css';

const GlassDispositionCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="glass-dashboard-card liquid-glass" onClick={() => navigate('/disposition')}>
      <div className="liquid-glass-overlay" />
      <div className="liquid-glass-content">
        <div className="glass-card-icon">
          <CalendarIcon />
        </div>
        <div className="glass-card-content">
          <h3 className="glass-card-title">Disposition</h3>
          <p className="glass-card-description">Umzüge planen & koordinieren</p>
        </div>
      </div>
    </div>
  );
};

export default GlassDispositionCard;