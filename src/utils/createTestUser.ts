import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export const createTestUser = async () => {
  try {
    const email = 'bielefeld@relocato.de';
    const password = 'Bicm1308';
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Test-Benutzer erfolgreich erstellt:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Benutzer existiert bereits');
    } else {
      console.error('❌ Fehler beim Erstellen des Test-Benutzers:', error.message);
    }
    throw error;
  }
};

// Diese Funktion kann in der Browser-Konsole aufgerufen werden:
// createTestUser();