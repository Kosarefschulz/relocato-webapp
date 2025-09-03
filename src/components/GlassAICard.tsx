import React from 'react';
import { Psychology as AIIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './GlassAICard.css';

const GlassAICard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="glass-dashboard-card liquid-glass" onClick={() => navigate('/ai-insights')}>
      <div className="liquid-glass-overlay" />
      <div className="liquid-glass-content">
        <div className="glass-card-icon">
          <AIIcon />
        </div>
        <div className="glass-card-content">
          <h3 className="glass-card-title">AI Intelligence</h3>
          <p className="glass-card-description">Machine Learning Insights</p>
        </div>
      </div>
    </div>
  );
};

export default GlassAICard;