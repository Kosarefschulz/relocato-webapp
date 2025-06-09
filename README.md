# 📱 Umzugs-WebApp

Eine mobile WebApp für Umzugsberater zur automatisierten Angebotserstellung und Email-Versendung.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)
![Material-UI](https://img.shields.io/badge/Material--UI-5-blue)
![Firebase](https://img.shields.io/badge/Firebase-9-orange)

## 🎯 Über das Projekt

Diese WebApp ermöglicht es Umzugsberatern, nach einem Telefonat mit dem Kunden schnell und professionell ein personalisiertes PDF-Angebot zu erstellen und automatisch per Email zu versenden.

### 🔄 Der Prozess:
1. **Berater** öffnet WebApp am Handy/Tablet
2. **Kunde suchen** oder neu anlegen
3. **Preis eingeben** + optionaler Kommentar
4. **"Angebot senden"** klicken

### 🤖 Automatische Abläufe:
- PDF-Angebot mit Kundendaten generieren
- Email an Kunde senden (mit PDF-Anhang)
- CC an Berater
- Google Sheet mit Daten aktualisieren

## 🚀 Quick Start

### Demo-Modus (sofort loslegen):
```bash
git clone [repository]
cd umzugs-webapp
npm install
npm run demo
```
➡️ Öffne http://localhost:3000 und logge dich mit beliebigen Daten ein

### Responsive Mobile Version:
```bash
npm run responsive
```

### Mit Firebase Authentication:
```bash
npm run firebase
```

## 📋 Verfügbare Modi

| Modus | Beschreibung | Command |
|-------|-------------|---------|
| **Demo** | Beliebiger Login, Mock-Daten | `npm run demo` |
| **Firebase** | Echte Authentication | `npm run firebase` |
| **Responsive** | Mobile-optimierte UI | `npm run responsive` |
| **Normal** | Standard-Layout | `npm run normal` |

## 🛠️ Tech Stack

### Frontend:
- **React 18** mit TypeScript
- **Material-UI 5** für moderne UI
- **React Router** für Navigation
- **Responsive Design** für Mobile/Tablet

### Services:
- **Firebase** Authentication & Hosting
- **Google Sheets API** für Kundendaten
- **SendGrid** für Email-Versand
- **jsPDF** für PDF-Generierung

### Development:
- **Create React App** als Basis
- **TypeScript** für Type Safety
- **ESLint** für Code Quality

## 📱 Features

### ✅ Vollständig implementiert:
- 🔐 **Login-System** (Demo + Firebase Auth)
- 🏠 **Dashboard** mit Touch-optimierter Navigation
- 🔍 **Kundensuche** mit Realtime-Filtering
- ➕ **Neue Kunden** anlegen mit Formular-Validierung
- 📄 **PDF-Angebote** generieren mit professionellem Layout
- 📧 **Email-Versand** mit PDF-Anhang
- 📱 **Mobile-First** Design für Smartphones/Tablets
- 💾 **Google Sheets** Integration für Datenspeicherung
- 📊 **Angebots-Verwaltung** mit Status-Tracking

### 🎯 Mobile UX:
- **Touch-optimierte** Buttons (min. 48px)
- **Hamburger-Menü** für Navigation
- **FABs** für Quick Actions
- **Card-basierte** Listen statt Tabellen
- **iOS/Android** optimierte Eingaben

## 📖 Setup-Anleitungen

### 🔧 Basis-Setup:
Siehe [DEPLOYMENT.md](DEPLOYMENT.md)

### 🔥 Firebase:
Siehe [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

### 📊 Google Sheets:
Siehe [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)

### 📧 SendGrid:
Siehe [SENDGRID_SETUP.md](SENDGRID_SETUP.md)

### 📱 Responsive Design:
Siehe [RESPONSIVE_DESIGN.md](RESPONSIVE_DESIGN.md)

## 🚀 Deployment

### Schnell-Deployment:
```bash
npm run deploy:demo        # Demo-Version
npm run deploy:firebase    # Mit Firebase Auth
npm run deploy:responsive  # Mobile-optimiert
```

### Manuelles Deployment:
```bash
npm run build:test         # Build + Test
npm run deploy             # Deploy zu Firebase
```

## 📂 Projekt-Struktur

```
src/
├── components/           # React-Komponenten
│   ├── Login.tsx        # Login-Formular
│   ├── Dashboard.tsx    # Haupt-Dashboard
│   ├── CustomerSearch.tsx
│   ├── CreateQuote.tsx
│   └── ...
├── services/            # Business Logic
│   ├── authService.ts   # Firebase Auth
│   ├── emailService.ts  # SendGrid Integration
│   ├── pdfService.ts    # PDF-Generierung
│   └── googleSheetsService.ts
├── hooks/               # Custom React Hooks
│   └── useResponsive.ts # Responsive Design Hook
├── styles/              # Styling & Themes
│   └── theme.ts
└── types/               # TypeScript Definitionen
    └── index.ts
```

## 🔧 Entwicklung

### Commands:
```bash
npm start              # Development Server
npm test               # Tests ausführen
npm run build          # Production Build
npm run build:test     # Build + Validation
```

### Code Quality:
```bash
npx tsc --noEmit       # TypeScript Check
npm run lint           # ESLint Check
```

### Switching Modi:
```bash
node switch-to-demo.js      # Demo-Modus
node switch-to-firebase.js  # Firebase-Modus
node switch-to-responsive.js # Mobile-Modus
node switch-to-normal.js    # Normal-Modus
```

## 🔒 Umgebungsvariablen

Kopiere `.env.example` zu `.env` und konfiguriere:

```env
# Firebase (Optional - für Authentication)
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=

# SendGrid (Optional - für Email)
REACT_APP_SENDGRID_API_KEY=
REACT_APP_SENDGRID_FROM_EMAIL=

# Google Sheets (Optional - für Datenspeicherung)
REACT_APP_GOOGLE_SHEETS_API_KEY=
REACT_APP_GOOGLE_SHEETS_ID=
```

## 📱 Mobile Testing

### Browser DevTools:
1. F12 → Device Toolbar
2. Teste iPhone/Samsung/iPad

### Echtes Gerät:
1. `npm start`
2. Smartphone: http://[deine-ip]:3000

## 🤝 Contributing

1. Fork das Repository
2. Feature Branch erstellen
3. Changes committen
4. Pull Request erstellen

## 📝 License

MIT License - siehe [LICENSE](LICENSE) für Details.

## 📞 Support

- **Setup-Hilfe**: Siehe Dokumentation in `/docs`
- **Issues**: GitHub Issues verwenden
- **Features**: Pull Requests willkommen

---

**🎉 Die App ist produktionsbereit und kann sofort eingesetzt werden!**