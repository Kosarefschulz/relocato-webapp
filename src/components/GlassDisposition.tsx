import React, { useState } from 'react';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  Group as TeamIcon,
  Assignment as JobIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  LocalShipping as TruckIcon
} from '@mui/icons-material';
import './GlassDisposition.css';

interface Team {
  id: string;
  name: string;
  members: string[];
  vehicle: string;
  available: boolean;
}

interface Job {
  id: string;
  customer: string;
  address: string;
  date: string;
  time: string;
  type: 'umzug' | 'entrümpelung' | 'montage' | 'transport';
  teamId?: string;
  notes?: string;
  phone?: string;
  email?: string;
  volume?: string;
  price?: number;
}

const GlassDisposition: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [view, setView] = useState<'week' | 'month'>('week');

  // Mock Data
  const teams: Team[] = [
    { id: '1', name: 'Team Alpha', members: ['Max', 'Tom'], vehicle: 'Mercedes Sprinter', available: true },
    { id: '2', name: 'Team Bravo', members: ['Lisa', 'Jan'], vehicle: 'Iveco Daily', available: true },
    { id: '3', name: 'Team Charlie', members: ['Anna', 'Ben', 'Paul'], vehicle: 'MAN TGE', available: true },
    { id: '4', name: 'Team Delta', members: ['Sarah', 'Mike'], vehicle: 'Ford Transit', available: false },
    { id: '5', name: 'Team Echo', members: ['Nina', 'Felix'], vehicle: 'VW Crafter', available: true }
  ];

  const jobs: Job[] = [
    {
      id: '1',
      customer: 'Familie Schmidt',
      address: 'Berliner Str. 42, 33604 Bielefeld',
      date: '2025-09-02',
      time: '09:00',
      type: 'umzug',
      teamId: '1',
      notes: '3-Zimmer Wohnung, 2. Stock',
      phone: '+49 521 123456',
      volume: '45m³',
      price: 1200
    },
    {
      id: '2',
      customer: 'Müller GmbH',
      address: 'Hauptstr. 15, 33602 Bielefeld',
      date: '2025-09-02',
      time: '14:00',
      type: 'transport',
      teamId: '2',
      notes: 'Büromöbel Transport',
      phone: '+49 521 789012',
      volume: '20m³',
      price: 450
    },
    {
      id: '3',
      customer: 'Frau Weber',
      address: 'Gartenweg 8, 33611 Bielefeld',
      date: '2025-09-03',
      time: '08:00',
      type: 'entrümpelung',
      teamId: '1',
      notes: 'Kellerentrümpelung',
      phone: '+49 521 345678',
      volume: '15m³',
      price: 350
    },
    {
      id: '4',
      customer: 'Herr Klein',
      address: 'Parkstr. 23, 33607 Bielefeld',
      date: '2025-09-04',
      time: '10:00',
      type: 'montage',
      teamId: '3',
      notes: 'Küchenmontage IKEA',
      phone: '+49 521 567890',
      price: 280
    },
    {
      id: '5',
      customer: 'Wagner & Co.',
      address: 'Industriestr. 50, 33609 Bielefeld',
      date: '2025-09-05',
      time: '13:00',
      type: 'umzug',
      teamId: '2',
      notes: 'Büroumzug, IT-Equipment',
      phone: '+49 521 234567',
      volume: '60m³',
      price: 1800
    },
    {
      id: '6',
      customer: 'Familie Becker',
      address: 'Waldweg 12, 33615 Bielefeld',
      date: '2025-09-06',
      time: '09:00',
      type: 'umzug',
      teamId: '4',
      notes: 'Komplettumzug Einfamilienhaus',
      phone: '+49 521 890123',
      volume: '90m³',
      price: 2500
    }
  ];

  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (currentWeek * 7));
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();

  const formatWeekRange = () => {
    const start = weekDates[0].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
    const end = weekDates[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const getJobsForDay = (date: Date, teamId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return jobs.filter(job => job.date === dateStr && job.teamId === teamId);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'umzug': return 'type-umzug';
      case 'entrümpelung': return 'type-entrumpelung';
      case 'montage': return 'type-montage';
      case 'transport': return 'type-transport';
      default: return '';
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'umzug': return 'Umzug';
      case 'entrümpelung': return 'Entrümpelung';
      case 'montage': return 'Montage';
      case 'transport': return 'Transport';
      default: return '';
    }
  };

  return (
    <div className="glass-disposition">
      {/* Header */}
      <div className="disposition-header">
        <div>
          <h1 className="disposition-title">Disposition</h1>
          <p className="disposition-subtitle">Umzüge planen und Teams koordinieren</p>
        </div>
        <div className="disposition-actions">
          <button className="glass-button primary">
            <AddIcon />
            Neuer Auftrag
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="disposition-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <JobIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">24</div>
            <div className="stat-label">Aufträge diese Woche</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TeamIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">5/5</div>
            <div className="stat-label">Teams verfügbar</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TruckIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">8</div>
            <div className="stat-label">Fahrzeuge im Einsatz</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUpIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">€18.5k</div>
            <div className="stat-label">Wochenumsatz</div>
          </div>
        </div>
      </div>

      {/* Planning Grid */}
      <div className="planning-container">
        <div className="planning-header">
          <div className="view-toggle">
            <button 
              className={`view-button ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              Woche
            </button>
            <button 
              className={`view-button ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              Monat
            </button>
          </div>
          
          <div className="week-navigation">
            <button 
              className="week-nav-button"
              onClick={() => setCurrentWeek(currentWeek - 1)}
            >
              <ChevronLeftIcon />
            </button>
            <span className="current-week">{formatWeekRange()}</span>
            <button 
              className="week-nav-button"
              onClick={() => setCurrentWeek(currentWeek + 1)}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>

        <div className="planning-grid-wrapper">
          <div className="planning-grid">
            {/* Header Row */}
            <div className="grid-corner">Teams</div>
            {weekDates.map((date, index) => (
              <div key={index} className="day-header">
                <div className="day-name">
                  {date.toLocaleDateString('de-DE', { weekday: 'short' })}
                </div>
                <div className="day-date">
                  {date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })}
                </div>
              </div>
            ))}

            {/* Team Rows */}
            {teams.map(team => (
              <React.Fragment key={team.id}>
                <div className="team-info">
                  <div className="team-name">{team.name}</div>
                  <div className="team-vehicle">{team.vehicle}</div>
                  <div className="team-members">{team.members.join(', ')}</div>
                </div>
                {weekDates.map((date, index) => {
                  const dayJobs = getJobsForDay(date, team.id);
                  return (
                    <div key={index} className="day-cell">
                      {dayJobs.map(job => (
                        <div 
                          key={job.id}
                          className={`job-card ${getTypeColor(job.type)}`}
                          onClick={() => setSelectedJob(job)}
                        >
                          <div className="job-time">{job.time}</div>
                          <div className="job-customer">{job.customer}</div>
                          <div className="job-type-tag">{getTypeLabel(job.type)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="job-modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="job-modal" onClick={e => e.stopPropagation()}>
            <div className="job-modal-header">
              <h2 className="job-modal-title">Auftragsdetails</h2>
              <button className="close-button" onClick={() => setSelectedJob(null)}>
                <CloseIcon />
              </button>
            </div>
            
            <div className="job-modal-content">
              <div className="job-detail-grid">
                <div className="detail-group">
                  <div className="detail-label">Kunde</div>
                  <div className="detail-value">{selectedJob.customer}</div>
                </div>
                
                <div className="detail-group">
                  <div className="detail-label">Auftragsart</div>
                  <div className={`job-type-badge ${getTypeColor(selectedJob.type)}`}>
                    {getTypeLabel(selectedJob.type)}
                  </div>
                </div>
                
                <div className="detail-group">
                  <div className="detail-label">Adresse</div>
                  <div className="detail-value">{selectedJob.address}</div>
                </div>
                
                <div className="detail-group">
                  <div className="detail-label">Zeit</div>
                  <div className="detail-value">{selectedJob.time}</div>
                </div>
                
                {selectedJob.phone && (
                  <div className="detail-group">
                    <div className="detail-label">Telefon</div>
                    <div className="detail-value">{selectedJob.phone}</div>
                  </div>
                )}
                
                {selectedJob.volume && (
                  <div className="detail-group">
                    <div className="detail-label">Volumen</div>
                    <div className="detail-value">{selectedJob.volume}</div>
                  </div>
                )}
                
                {selectedJob.price && (
                  <div className="detail-group">
                    <div className="detail-label">Preis</div>
                    <div className="detail-value">€{selectedJob.price}</div>
                  </div>
                )}
              </div>
              
              {selectedJob.notes && (
                <div className="detail-notes">
                  <div className="detail-label">Notizen</div>
                  <div className="notes-text">{selectedJob.notes}</div>
                </div>
              )}
            </div>
            
            <div className="job-modal-actions">
              <button className="glass-button">Bearbeiten</button>
              <button className="glass-button primary">Team zuweisen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlassDisposition;