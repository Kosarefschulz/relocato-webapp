import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import EmailClientProfessional from './EmailClientProfessional';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const EmailClientWrapper: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      if (!auth.currentUser) {
        setError('Nicht angemeldet');
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create user document
        console.log('Creating user document for:', auth.currentUser.email);
        await setDoc(userDocRef, {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0],
          photoURL: auth.currentUser.photoURL,
          emailAccess: true, // Automatically grant access
          role: 'admin',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          authProvider: auth.currentUser.providerData[0]?.providerId || 'password',
          isActive: true
        });
        setHasAccess(true);
      } else {
        const userData = userDoc.data();
        if (userData.emailAccess) {
          setHasAccess(true);
        } else {
          // Grant access automatically
          await updateDoc(userDocRef, {
            emailAccess: true,
            role: 'admin',
            updatedAt: serverTimestamp()
          });
          setHasAccess(true);
        }
      }
    } catch (err: any) {
      console.error('Error checking user access:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Fehler</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!hasAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          <Typography variant="h6">Kein Zugriff</Typography>
          <Typography>Sie haben keinen Zugriff auf den E-Mail-Client.</Typography>
        </Alert>
      </Box>
    );
  }

  return <EmailClientProfessional />;
};

export default EmailClientWrapper;