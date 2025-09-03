import React, { useState } from 'react';
import {
  AccountTree as WorkflowIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Notifications as NotificationIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  FilterAlt as FilterIcon,
  Webhook as WebhookIcon,
  Storage as DataIcon,
  Psychology as AIIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import './GlassWorkflowBuilder.css';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  config?: any;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  from: string;
  to: string;
  condition?: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

const GlassWorkflowBuilder: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowTemplate | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodeTypes = {
    triggers: [
      { id: 'new-lead', title: 'Neuer Lead', icon: <AddIcon />, category: 'trigger' },
      { id: 'email-received', title: 'E-Mail empfangen', icon: <EmailIcon />, category: 'trigger' },
      { id: 'form-submit', title: 'Formular ausgefüllt', icon: <TaskIcon />, category: 'trigger' },
      { id: 'schedule', title: 'Zeitplan', icon: <ScheduleIcon />, category: 'trigger' },
      { id: 'webhook', title: 'Webhook', icon: <WebhookIcon />, category: 'trigger' }
    ],
    conditions: [
      { id: 'filter', title: 'Filter', icon: <FilterIcon />, category: 'condition' },
      { id: 'ai-score', title: 'AI Scoring', icon: <AIIcon />, category: 'condition' },
      { id: 'time-check', title: 'Zeit prüfen', icon: <TimelineIcon />, category: 'condition' }
    ],
    actions: [
      { id: 'send-email', title: 'E-Mail senden', icon: <EmailIcon />, category: 'action' },
      { id: 'create-task', title: 'Aufgabe erstellen', icon: <TaskIcon />, category: 'action' },
      { id: 'notify', title: 'Benachrichtigung', icon: <NotificationIcon />, category: 'action' },
      { id: 'update-data', title: 'Daten aktualisieren', icon: <DataIcon />, category: 'action' },
      { id: 'ai-generate', title: 'AI generieren', icon: <AIIcon />, category: 'action' }
    ],
    delays: [
      { id: 'wait-time', title: 'Warten', icon: <ScheduleIcon />, category: 'delay' },
      { id: 'wait-condition', title: 'Auf Bedingung warten', icon: <TimelineIcon />, category: 'delay' }
    ]
  };

  const templates: WorkflowTemplate[] = [
    {
      id: '1',
      name: 'Lead Nurturing',
      description: 'Automatische E-Mail-Sequenz für neue Leads',
      category: 'sales',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          category: 'trigger',
          title: 'Neuer Lead',
          description: 'Wenn ein neuer Lead erstellt wird',
          icon: <AddIcon />,
          position: { x: 100, y: 200 }
        },
        {
          id: 'action-1',
          type: 'action',
          category: 'action',
          title: 'Willkommens-E-Mail',
          description: 'Sende Willkommens-E-Mail',
          icon: <EmailIcon />,
          position: { x: 300, y: 200 }
        },
        {
          id: 'delay-1',
          type: 'delay',
          category: 'delay',
          title: '2 Tage warten',
          description: 'Warte 2 Tage',
          icon: <ScheduleIcon />,
          position: { x: 500, y: 200 }
        },
        {
          id: 'action-2',
          type: 'action',
          category: 'action',
          title: 'Follow-up E-Mail',
          description: 'Sende Follow-up',
          icon: <EmailIcon />,
          position: { x: 700, y: 200 }
        }
      ],
      connections: [
        { from: 'trigger-1', to: 'action-1' },
        { from: 'action-1', to: 'delay-1' },
        { from: 'delay-1', to: 'action-2' }
      ]
    },
    {
      id: '2',
      name: 'Customer Onboarding',
      description: 'Automatisierter Onboarding-Prozess',
      category: 'success',
      nodes: [],
      connections: []
    },
    {
      id: '3',
      name: 'Support Ticket Routing',
      description: 'Intelligente Ticket-Verteilung',
      category: 'support',
      nodes: [],
      connections: []
    }
  ];

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId === selectedNode ? null : nodeId);
  };

  const handleTemplateSelect = (template: WorkflowTemplate) => {
    setActiveWorkflow(template);
    setSelectedTemplate(template.id);
  };

  return (
    <div className="glass-workflow-builder">
      {/* Header */}
      <div className="workflow-header">
        <div className="workflow-title">
          <div className="workflow-icon">
            <WorkflowIcon />
          </div>
          <h1>Workflow Automation Center</h1>
        </div>
        
        <div className="workflow-actions">
          <button className="workflow-btn save">
            <CheckIcon />
            Speichern
          </button>
          <button 
            className={`workflow-btn ${isRunning ? 'pause' : 'play'}`}
            onClick={handlePlayPause}
          >
            {isRunning ? <PauseIcon /> : <PlayIcon />}
            {isRunning ? 'Pausieren' : 'Starten'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="workflow-content">
        {/* Sidebar */}
        <div className="workflow-sidebar">
          {/* Templates */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Vorlagen</h3>
            <div className="template-list">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${selectedTemplate === template.id ? 'active' : ''}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <span className={`template-badge ${template.category}`}>
                    {template.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Node Library */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Bausteine</h3>
            
            <div className="node-group">
              <h4>Trigger</h4>
              {nodeTypes.triggers.map(node => (
                <div key={node.id} className="node-item" draggable>
                  <div className="node-item-icon">{node.icon}</div>
                  <span>{node.title}</span>
                </div>
              ))}
            </div>

            <div className="node-group">
              <h4>Bedingungen</h4>
              {nodeTypes.conditions.map(node => (
                <div key={node.id} className="node-item" draggable>
                  <div className="node-item-icon">{node.icon}</div>
                  <span>{node.title}</span>
                </div>
              ))}
            </div>

            <div className="node-group">
              <h4>Aktionen</h4>
              {nodeTypes.actions.map(node => (
                <div key={node.id} className="node-item" draggable>
                  <div className="node-item-icon">{node.icon}</div>
                  <span>{node.title}</span>
                </div>
              ))}
            </div>

            <div className="node-group">
              <h4>Verzögerungen</h4>
              {nodeTypes.delays.map(node => (
                <div key={node.id} className="node-item" draggable>
                  <div className="node-item-icon">{node.icon}</div>
                  <span>{node.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="workflow-canvas">
          {activeWorkflow ? (
            <>
              <div className="canvas-header">
                <h2>{activeWorkflow.name}</h2>
                <p>{activeWorkflow.description}</p>
              </div>
              
              <div className="canvas-area">
                {/* Render Connections */}
                <svg className="connections-svg">
                  {activeWorkflow.connections.map((conn, index) => {
                    const fromNode = activeWorkflow.nodes.find(n => n.id === conn.from);
                    const toNode = activeWorkflow.nodes.find(n => n.id === conn.to);
                    if (!fromNode || !toNode) return null;
                    
                    return (
                      <line
                        key={index}
                        x1={fromNode.position.x + 100}
                        y1={fromNode.position.y + 30}
                        x2={toNode.position.x}
                        y2={toNode.position.y + 30}
                        className="connection-line"
                      />
                    );
                  })}
                </svg>

                {/* Render Nodes */}
                {activeWorkflow.nodes.map(node => (
                  <div
                    key={node.id}
                    className={`workflow-node ${node.type} ${selectedNode === node.id ? 'selected' : ''}`}
                    style={{
                      left: `${node.position.x}px`,
                      top: `${node.position.y}px`
                    }}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <div className="node-icon">{node.icon}</div>
                    <div className="node-content">
                      <h4>{node.title}</h4>
                      <p>{node.description}</p>
                    </div>
                    {node.type === 'condition' && (
                      <div className="node-branches">
                        <div className="branch yes">Ja</div>
                        <div className="branch no">Nein</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="canvas-empty">
              <WorkflowIcon style={{ fontSize: 64, opacity: 0.3 }} />
              <h3>Wählen Sie eine Vorlage oder erstellen Sie einen neuen Workflow</h3>
              <button className="create-workflow-btn">
                <AddIcon />
                Neuer Workflow
              </button>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="properties-panel">
            <div className="panel-header">
              <h3>Eigenschaften</h3>
              <button className="panel-close" onClick={() => setSelectedNode(null)}>
                <DeleteIcon />
              </button>
            </div>
            
            <div className="panel-content">
              <div className="property-group">
                <label>Name</label>
                <input type="text" className="property-input" placeholder="Node Name" />
              </div>
              
              <div className="property-group">
                <label>Beschreibung</label>
                <textarea className="property-textarea" placeholder="Beschreibung..." />
              </div>
              
              <div className="property-group">
                <label>Konfiguration</label>
                <button className="config-btn">
                  <SettingsIcon />
                  Konfigurieren
                </button>
              </div>
              
              <div className="property-actions">
                <button className="property-btn test">
                  <PlayIcon />
                  Testen
                </button>
                <button className="property-btn delete">
                  <DeleteIcon />
                  Löschen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="workflow-stats">
        <div className="stat-item">
          <span className="stat-label">Aktive Workflows</span>
          <span className="stat-value">12</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Ausführungen heute</span>
          <span className="stat-value">347</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Erfolgsrate</span>
          <span className="stat-value">98.5%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Eingesparte Zeit</span>
          <span className="stat-value">14.5h</span>
        </div>
      </div>
    </div>
  );
};

export default GlassWorkflowBuilder;