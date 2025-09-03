import React, { useState } from 'react';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as AIIcon,
  AutoAwesome as AutoAwesomeIcon,
  Insights as InsightsIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import './GlassAIInsights.css';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  metric?: {
    value: string;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  action?: string;
}

const GlassAIInsights: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  
  const insights: AIInsight[] = [
    {
      id: '1',
      type: 'opportunity',
      title: 'Upselling-Chance bei Müller GmbH',
      description: 'Basierend auf Nutzungsmustern: 85% Wahrscheinlichkeit für Premium-Upgrade',
      impact: 'high',
      metric: {
        value: '€45,000',
        change: 85,
        trend: 'up'
      },
      action: 'Kontakt aufnehmen'
    },
    {
      id: '2',
      type: 'risk',
      title: 'Churn-Risiko: TechStart AG',
      description: 'Support-Tickets um 200% gestiegen, keine Reaktion auf letzte 3 E-Mails',
      impact: 'high',
      metric: {
        value: '€12,000',
        change: -65,
        trend: 'down'
      },
      action: 'Sofort anrufen'
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Beste Zeit für Outreach',
      description: 'Dienstag 10-11 Uhr: 3x höhere Antwortrate in Ihrer Branche',
      impact: 'medium',
      metric: {
        value: '42%',
        change: 15,
        trend: 'up'
      },
      action: 'Kampagne planen'
    },
    {
      id: '4',
      type: 'trend',
      title: 'Deal-Velocity steigt',
      description: 'Durchschnittliche Abschlusszeit von 45 auf 32 Tage gesunken',
      impact: 'high',
      metric: {
        value: '32 Tage',
        change: 28,
        trend: 'up'
      }
    }
  ];

  const predictions = [
    { label: 'Q1 Revenue', value: '€485K', confidence: 92, trend: 'up' },
    { label: 'Neue Kunden', value: '47', confidence: 88, trend: 'up' },
    { label: 'Churn Rate', value: '2.3%', confidence: 95, trend: 'down' },
    { label: 'Deal Pipeline', value: '€1.2M', confidence: 90, trend: 'up' }
  ];

  const getInsightIcon = (type: string) => {
    switch(type) {
      case 'opportunity': return <TrendingUpIcon />;
      case 'risk': return <WarningIcon />;
      case 'recommendation': return <AutoAwesomeIcon />;
      case 'trend': return <TimelineIcon />;
      default: return <InsightsIcon />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch(impact) {
      case 'high': return 'impact-high';
      case 'medium': return 'impact-medium';
      case 'low': return 'impact-low';
      default: return '';
    }
  };

  return (
    <div className="glass-ai-insights">
      {/* Header */}
      <div className="ai-insights-header">
        <div className="ai-insights-title-row">
          <div className="ai-insights-title">
            <div className="ai-insights-icon">
              <AIIcon />
            </div>
            <span>AI Intelligence Hub</span>
          </div>
          <div className="ai-insights-badge">
            <AutoAwesomeIcon style={{ fontSize: 14 }} />
            <span>Powered by ML</span>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="ai-timeframe-selector">
          {['today', 'week', 'month', 'quarter'].map(time => (
            <button
              key={time}
              className={`timeframe-btn ${selectedTimeframe === time ? 'active' : ''}`}
              onClick={() => setSelectedTimeframe(time)}
            >
              {time === 'today' ? 'Heute' : 
               time === 'week' ? 'Woche' :
               time === 'month' ? 'Monat' : 'Quartal'}
            </button>
          ))}
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="ai-predictions-grid">
        {predictions.map((pred, index) => (
          <div key={index} className="ai-prediction-card">
            <div className="prediction-header">
              <span className="prediction-label">{pred.label}</span>
              <div className="prediction-confidence">
                <SpeedIcon style={{ fontSize: 14 }} />
                <span>{pred.confidence}%</span>
              </div>
            </div>
            <div className="prediction-value">
              {pred.value}
              {pred.trend === 'up' ? 
                <ArrowUpIcon className="trend-up" /> : 
                <ArrowDownIcon className="trend-down" />
              }
            </div>
            <div className="prediction-bar">
              <div 
                className="prediction-fill"
                style={{ width: `${pred.confidence}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Insights List */}
      <div className="ai-insights-list">
        {insights.map((insight) => (
          <div key={insight.id} className={`ai-insight-card ${insight.type}`}>
            <div className="insight-icon">
              {getInsightIcon(insight.type)}
            </div>
            
            <div className="insight-content">
              <div className="insight-header">
                <h3 className="insight-title">{insight.title}</h3>
                <div className={`insight-impact ${getImpactColor(insight.impact)}`}>
                  {insight.impact === 'high' ? 'Hoch' :
                   insight.impact === 'medium' ? 'Mittel' : 'Niedrig'}
                </div>
              </div>
              
              <p className="insight-description">{insight.description}</p>
              
              {insight.metric && (
                <div className="insight-metric">
                  <span className="metric-value">{insight.metric.value}</span>
                  <span className={`metric-change ${insight.metric.trend}`}>
                    {insight.metric.trend === 'up' ? '+' : ''}{insight.metric.change}%
                  </span>
                </div>
              )}
              
              {insight.action && (
                <button className="insight-action">
                  {insight.action}
                  <ArrowUpIcon style={{ fontSize: 16, marginLeft: 4 }} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Assistant Prompt */}
      <div className="ai-assistant-prompt">
        <div className="assistant-avatar">
          <AIIcon />
        </div>
        <div className="assistant-message">
          <p>Möchten Sie eine detaillierte Analyse? Fragen Sie mich:</p>
          <div className="assistant-suggestions">
            <button className="suggestion-chip">Warum ist das Churn-Risiko hoch?</button>
            <button className="suggestion-chip">Wie kann ich die Conversion verbessern?</button>
            <button className="suggestion-chip">Zeige mir erfolgreiche Patterns</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassAIInsights;