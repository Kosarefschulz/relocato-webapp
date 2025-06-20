import React from 'react';
import EmailClientProfessional from './EmailClientProfessional';

const EmailClientWrapper: React.FC = () => {
  // Direkt EmailClient anzeigen ohne Authentifizierung
  return <EmailClientProfessional />;
};

export default EmailClientWrapper;