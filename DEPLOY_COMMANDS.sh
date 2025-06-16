#!/bin/bash

# E-Mail Parser Deploy Befehle
# ============================

echo "📧 E-Mail Parser Deploy für bielefeld@relocato.de"
echo "================================================"
echo ""
echo "Führen Sie diese Befehle nacheinander aus:"
echo ""

echo "1. Firebase Login (falls noch nicht eingeloggt):"
echo "   firebase login"
echo ""

echo "2. IONOS Konfiguration setzen:"
echo '   firebase functions:config:set ionos.email="bielefeld@relocato.de" ionos.password="Bicm1308"'
echo ""

echo "3. Functions deployen:"
echo "   firebase deploy --only functions"
echo ""

echo "4. Logs prüfen (optional):"
echo "   firebase functions:log --follow"
echo ""

echo "Das war's! Der E-Mail Parser läuft dann automatisch."