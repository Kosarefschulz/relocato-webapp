#!/bin/bash

# MCP Google Authentication Setup Script
# This script helps set up Google authentication for MCP Server

echo "=== MCP Google Authentication Setup ==="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK (gcloud) ist nicht installiert."
    echo "Bitte installieren Sie es von: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ Google Cloud SDK gefunden"
echo ""

# Set project
PROJECT_ID="umzugsapp"
echo "📋 Projekt wird gesetzt: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Create service account
SERVICE_ACCOUNT_NAME="mcp-sheets-access"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo ""
echo "🔐 Service Account erstellen..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --description="Service Account for MCP Google Sheets access" \
    --display-name="MCP Sheets Access" 2>/dev/null || echo "Service Account existiert bereits"

# Add permissions
echo ""
echo "🔑 Berechtigungen hinzufügen..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/editor"

# Create key
KEY_FILE="mcp-service-account-key.json"
echo ""
echo "📄 Schlüssel erstellen..."
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

echo ""
echo "✅ Service Account erfolgreich erstellt!"
echo ""
echo "📧 Service Account E-Mail: $SERVICE_ACCOUNT_EMAIL"
echo "📄 Schlüsseldatei: $KEY_FILE"
echo ""
echo "⚠️  WICHTIG: Nächste Schritte:"
echo "1. Öffnen Sie Ihr Google Sheet"
echo "2. Klicken Sie auf 'Freigeben'"
echo "3. Fügen Sie diese E-Mail hinzu: $SERVICE_ACCOUNT_EMAIL"
echo "4. Geben Sie 'Editor'-Rechte"
echo ""
echo "5. Konfigurieren Sie MCP mit:"
echo "   export GOOGLE_APPLICATION_CREDENTIALS=\"$(pwd)/$KEY_FILE\""
echo ""

# Enable APIs
echo "🔌 Google Sheets API aktivieren..."
gcloud services enable sheets.googleapis.com
gcloud services enable drive.googleapis.com

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📝 MCP Konfiguration:"
echo "{"
echo "  \"servers\": {"
echo "    \"gdrive\": {"
echo "      \"command\": \"mcp-server-gdrive\","
echo "      \"env\": {"
echo "        \"GOOGLE_APPLICATION_CREDENTIALS\": \"$(pwd)/$KEY_FILE\""
echo "      }"
echo "    }"
echo "  }"
echo "}"