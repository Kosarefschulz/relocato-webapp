#!/bin/bash

# Deployment Script für PDF-Parser System
# Autor: Claude
# Datum: 2025-10-01

set -e  # Exit bei Fehler

echo "🚀 PDF-Parser Deployment Script"
echo "================================"
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Projektverzeichnis
PROJECT_DIR="/Users/sergejschulz/Downloads/relocato-webapp"
cd "$PROJECT_DIR"

echo -e "${BLUE}📁 Arbeitsverzeichnis: $PROJECT_DIR${NC}"
echo ""

# ============================================
# SCHRITT 1: Datenbank-Migration
# ============================================

echo -e "${YELLOW}📊 SCHRITT 1: Datenbank-Migration${NC}"
echo "-----------------------------------"
echo ""
echo "Öffne Supabase Dashboard: https://supabase.com/dashboard/project/kmxipuaqierjqaikuimi/editor"
echo ""
echo "Führe folgende Schritte aus:"
echo "1. Gehe zu SQL Editor"
echo "2. Öffne die Datei: supabase/migrations/20251001_add_offers_system.sql"
echo "3. Kopiere den Inhalt und füge ihn im SQL Editor ein"
echo "4. Klicke auf 'Run'"
echo ""
read -p "✅ Migration ausgeführt? (y/n): " migration_done

if [ "$migration_done" != "y" ]; then
    echo -e "${RED}❌ Abbruch: Migration muss zuerst ausgeführt werden${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Migration abgeschlossen${NC}"
echo ""

# ============================================
# SCHRITT 2: Edge Function deployen
# ============================================

echo -e "${YELLOW}🔧 SCHRITT 2: Edge Function deployen${NC}"
echo "-----------------------------------"
echo ""

# Prüfe ob Supabase CLI installiert ist
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI nicht gefunden${NC}"
    echo ""
    echo "Installiere Supabase CLI:"
    echo "brew install supabase/tap/supabase"
    echo ""
    read -p "Installation abgeschlossen? (y/n): " cli_installed

    if [ "$cli_installed" != "y" ]; then
        echo -e "${RED}❌ Abbruch: Supabase CLI wird benötigt${NC}"
        exit 1
    fi
fi

# Login prüfen
echo "Prüfe Supabase Login..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nicht eingeloggt. Führe Login aus:${NC}"
    supabase login
fi

echo ""
echo "Deploye parse-pdf-ruempel Edge Function..."
echo ""

if supabase functions deploy parse-pdf-ruempel --project-ref kmxipuaqierjqaikuimi; then
    echo -e "${GREEN}✅ Edge Function erfolgreich deployed${NC}"
else
    echo -e "${RED}❌ Edge Function Deployment fehlgeschlagen${NC}"
    echo ""
    echo "Manueller Deploy-Befehl:"
    echo "supabase functions deploy parse-pdf-ruempel --project-ref kmxipuaqierjqaikuimi"
    echo ""
    read -p "Manuell deployt? (y/n): " manual_deploy

    if [ "$manual_deploy" != "y" ]; then
        echo -e "${RED}❌ Abbruch${NC}"
        exit 1
    fi
fi

echo ""

# ============================================
# SCHRITT 3: Frontend bauen
# ============================================

echo -e "${YELLOW}🏗️  SCHRITT 3: Frontend bauen${NC}"
echo "-----------------------------------"
echo ""

# Node Modules prüfen
if [ ! -d "node_modules" ]; then
    echo "Installiere Dependencies..."
    npm install
    echo ""
fi

echo "Baue Frontend..."
echo ""

if npm run build; then
    echo -e "${GREEN}✅ Build erfolgreich${NC}"
else
    echo -e "${RED}❌ Build fehlgeschlagen${NC}"
    echo ""
    echo "Prüfe die Fehler oben und behebe sie."
    exit 1
fi

echo ""

# ============================================
# SCHRITT 4: Tests (Optional)
# ============================================

echo -e "${YELLOW}🧪 SCHRITT 4: Tests (Optional)${NC}"
echo "-----------------------------------"
echo ""
read -p "Tests ausführen? (y/n): " run_tests

if [ "$run_tests" = "y" ]; then
    echo "Führe Tests aus..."
    npm test -- --watchAll=false || echo -e "${YELLOW}⚠️  Einige Tests fehlgeschlagen${NC}"
    echo ""
fi

# ============================================
# ZUSAMMENFASSUNG
# ============================================

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DEPLOYMENT ABGESCHLOSSEN!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Was wurde gemacht:${NC}"
echo ""
echo "✅ Datenbank-Migration ausgeführt"
echo "   → Tabellen: offers, offer_line_items, follow_ups, offer_history"
echo ""
echo "✅ Edge Function deployed"
echo "   → parse-pdf-ruempel"
echo ""
echo "✅ Frontend gebaut"
echo "   → Build-Ordner: /build"
echo ""
echo -e "${BLUE}🎯 Nächste Schritte:${NC}"
echo ""
echo "1. Frontend deployen:"
echo "   npm run deploy"
echo ""
echo "2. Oder Vercel deployen:"
echo "   vercel --prod"
echo ""
echo "3. Testen:"
echo "   - Öffne Kundendetails"
echo "   - Gehe zum 'PDF-Angebote' Tab"
echo "   - Lade ein Rümpel Schmiede PDF hoch"
echo ""
echo -e "${BLUE}📚 Dokumentation:${NC}"
echo "   → RUEMPEL_SCHMIEDE_SETUP.md"
echo ""
echo -e "${GREEN}Viel Erfolg! 🚀${NC}"
echo ""
