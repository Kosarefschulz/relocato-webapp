import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // Direkt zum Dashboard weiterleiten
  useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);

  return null; // Nichts anzeigen
};

export default Login;