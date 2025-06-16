import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export const createAdminUser = async () => {
  try {
    const email = 'admin@relocato.de';
    const password = 'Admin123!';
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Admin-Benutzer erfolgreich erstellt:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin-Benutzer existiert bereits');
      console.log('📧 Email: admin@relocato.de');
      console.log('🔑 Passwort: Admin123!');
    } else {
      console.error('❌ Fehler beim Erstellen des Admin-Benutzers:', error.message);
    }
    throw error;
  }
};

// Diese Funktion kann in der Browser-Konsole aufgerufen werden:
// createAdminUser();