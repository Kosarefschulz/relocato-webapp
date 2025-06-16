- Projektname: Umzugsapp
- Projekt-ID: umzugsapp
- Projektnummer: 130199132038
- Web-API-Schlüssel: AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY
- Umgebung: Durch diese Einstellung wird Ihr Projekt für verschiedene Phasen des Applebenszyklus angepasst
- Umgebungstyp: Ohne Angabe
- Meine Apps: Web-Apps

- Umzugs WebApp
  - Web-App
  - App-Nickname: Umzugs WebApp
  - App-ID: 1:130199132038:web:3be72ffeb2b1f55be93e07
  - Verknüpfte Firebase Hosting-Website: umzugsapp

- SDK-Einrichtung und -Konfiguration:
  ```
  // Firebase Konfiguration
  const firebaseConfig = {
    apiKey: "AIzaSyDCeOBZw96klWFkolRQMnhr5DG4Ol2eMjY",
    authDomain: "umzugsapp.firebaseapp.com",
    projectId: "umzugsapp",
    storageBucket: "umzugsapp.firebasestorage.app",
    messagingSenderId: "130199132038",
    appId: "1:130199132038:web:3be72ffeb2b1f55be93e07",
    measurementId: "G-MQWV0M47PN"
  };
  ```

- Installation (npm):
  ```
  npm install firebase
  ```

- Initialisierung:
  ```javascript
  import { initializeApp } from "firebase/app";
  import { getAnalytics } from "firebase/analytics";

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  ```