import React from 'react';
import './GlassLayout.css';

interface GlassLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

const GlassLayout: React.FC<GlassLayoutProps> = ({ 
  children, 
  title,
  showHeader = true 
}) => {

  return (
    <div className="glass-layout">
      
      {/* Main Content */}
      <main className="glass-main-content">
        {showHeader && title && (
          <header className="glass-page-header">
            <h1 className="glass-page-title">{title}</h1>
          </header>
        )}
        
        <div className="glass-page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default GlassLayout;