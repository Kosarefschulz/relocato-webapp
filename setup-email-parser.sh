#!/bin/bash

# Relocato E-Mail Parser Setup Script
# ====================================

echo "🚀 Relocato E-Mail Parser Setup"
echo "=============================="
echo ""

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Prüfe ob Firebase CLI installiert ist
if ! command -v firebase &> /dev/null
then
    echo -e "${RED}❌ Firebase CLI ist nicht installiert!${NC}"
    echo "Bitte installieren Sie Firebase CLI mit: npm install -g firebase-tools"
    exit 1
fi

echo -e "${GREEN}✅ Firebase CLI gefunden${NC}"

# Schritt 1: Dependencies installieren
echo ""
echo "📦 Installiere Dependencies..."
cd functions
npm install
cd ..

# Schritt 2: Konfiguration
echo ""
echo -e "${YELLOW}⚙️  Konfiguration${NC}"
echo "================"
echo ""
echo "Wir benötigen Ihre IONOS E-Mail Zugangsdaten."
echo "Diese werden sicher in Firebase Functions Config gespeichert."
echo ""

# E-Mail Adresse
read -p "IONOS E-Mail-Adresse [anfragen@relocato.de]: " email
email=${email:-anfragen@relocato.de}

# App-Passwort
echo ""
echo -e "${YELLOW}Wichtig:${NC} Verwenden Sie ein App-Passwort, nicht Ihr normales Passwort!"
echo "App-Passwort erstellen: IONOS Kundencenter → E-Mail → Einstellungen → App-Passwörter"
echo ""
read -s -p "IONOS App-Passwort: " password
echo ""

if [ -z "$password" ]; then
    echo -e "${RED}❌ Passwort darf nicht leer sein!${NC}"
    exit 1
fi

# Setze Firebase Config
echo ""
echo "📝 Speichere Konfiguration..."
firebase functions:config:set ionos.email="$email" ionos.password="$password"

# Schritt 3: Deploy vorbereiten
echo ""
echo -e "${YELLOW}🔧 Deploy Vorbereitung${NC}"
echo "===================="
echo ""
echo "Möchten Sie die Functions jetzt deployen? (j/n)"
read -p "> " deploy

if [[ $deploy =~ ^[Jj]$ ]]; then
    echo ""
    echo "🚀 Deploye Firebase Functions..."
    firebase deploy --only functions
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Functions erfolgreich deployed!${NC}"
        echo ""
        echo "📧 E-Mail Parser läuft jetzt!"
        echo "=========================="
        echo ""
        echo "Der Parser prüft alle 5 Minuten Ihr IONOS Postfach und:"
        echo "✓ Erkennt E-Mails von ImmoScout24 und Umzug365"
        echo "✓ Erstellt automatisch Kunden in Firestore"
        echo "✓ Generiert Angebote mit Preisberechnung"
        echo "✓ Sendet Willkommens-E-Mails"
        echo ""
        echo "📊 Monitoring:"
        echo "- Firebase Console → Functions → Logs"
        echo "- Kommandozeile: firebase functions:log"
        echo ""
        echo -e "${GREEN}🎉 Setup abgeschlossen!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Deploy fehlgeschlagen!${NC}"
        echo "Bitte prüfen Sie die Fehler oben."
    fi
else
    echo ""
    echo "⏸️  Deploy übersprungen."
    echo ""
    echo "Sie können später manuell deployen mit:"
    echo -e "${YELLOW}firebase deploy --only functions${NC}"
fi

echo ""
echo "📋 Nächste Schritte:"
echo "=================="
echo ""
echo "1. Test-E-Mail senden:"
echo "   Senden Sie eine E-Mail an $email mit diesem Format:"
echo ""
echo "   Betreff: Umzugsanfrage von ImmoScout24"
echo "   "
echo "   Kontaktname: Max Mustermann"
echo "   Telefon: 0171 1234567"
echo "   E-Mail: max@example.com"
echo "   Umzugsdatum: 15.03.2024"
echo "   Von: Berliner Str. 123, 10115 Berlin"
echo "   Nach: Hamburger Str. 456, 20095 Hamburg"
echo ""
echo "2. Logs prüfen:"
echo "   firebase functions:log"
echo ""
echo "3. Firestore prüfen:"
echo "   Firebase Console → Firestore → 'customers' Collection"
echo ""
echo "Bei Fragen oder Problemen:"
echo "- Dokumentation: EMAIL_PARSER_SETUP.md"
echo "- Direkte Lösung: EMAIL_PARSER_DIREKT.md"