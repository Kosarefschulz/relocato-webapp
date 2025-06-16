import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      // Optional: Zusätzliche Benutzerdaten in Firestore speichern
      // await this.saveUserProfile(userCredential.user.uid, userData);
      
      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  private handleAuthError(error: any): Error {
    let message = 'Ein unbekannter Fehler ist aufgetreten';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Benutzer nicht gefunden';
        break;
      case 'auth/wrong-password':
        message = 'Falsches Passwort';
        break;
      case 'auth/email-already-in-use':
        message = 'Email-Adresse wird bereits verwendet';
        break;
      case 'auth/weak-password':
        message = 'Passwort ist zu schwach';
        break;
      case 'auth/invalid-email':
        message = 'Ungültige Email-Adresse';
        break;
      case 'auth/user-disabled':
        message = 'Benutzerkonto wurde deaktiviert';
        break;
      case 'auth/too-many-requests':
        message = 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut';
        break;
      case 'auth/network-request-failed':
        message = 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Anmeldung abgebrochen';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Anmeldung abgebrochen';
        break;
      case 'auth/popup-blocked':
        message = 'Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite';
        break;
      case 'auth/account-exists-with-different-credential':
        message = 'Ein Konto mit dieser E-Mail-Adresse existiert bereits mit anderen Anmeldedaten';
        break;
      default:
        message = error.message || 'Authentifizierungsfehler';
    }
    
    return new Error(message);
  }
}

export const authService = new AuthService();