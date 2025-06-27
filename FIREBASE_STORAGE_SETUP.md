# Firebase Storage Setup

## Wichtige Schritte zur Aktivierung:

1. **Firebase Console öffnen**
   - Gehen Sie zu: https://console.firebase.google.com/project/umzugsapp/storage
   
2. **Storage aktivieren**
   - Klicken Sie auf "Get Started" / "Jetzt starten"
   - Wählen Sie einen Standort (europe-west3 empfohlen für Deutschland)
   - Bestätigen Sie die Einrichtung

3. **Storage Rules**
   - Die Rules sind bereits deployed (öffentlicher Zugriff für Entwicklung)
   - Für Produktion müssen die Rules angepasst werden!

## Aktuelle Konfiguration:

- **Storage Bucket**: umzugsapp.firebasestorage.app
- **Rules**: Öffentlicher Zugriff (nur für Entwicklung!)
- **Ordnerstruktur**: /customer-photos/{customerId}/{fileName}
- **Max. Dateigröße**: 10MB pro Foto
- **Kostenlos**: 5GB Storage, 1GB/Tag Download

## Test der Integration:

1. Öffnen Sie einen Kunden in der App
2. Klicken Sie auf "Fotos hochladen"
3. Wählen Sie ein Bild aus
4. Die Konsole zeigt ob Firebase oder localStorage verwendet wird

## Fehlerbehebung:

- **"Firebase Storage nicht initialisiert"**: Storage in Console aktivieren
- **"Permission denied"**: Storage Rules prüfen
- **Fallback zu localStorage**: Firebase temporär nicht verfügbar

## Sicherheitshinweis:

⚠️ Die aktuellen Rules erlauben JEDEM das Hochladen/Löschen von Dateien!
Für Produktion müssen Sie Authentifizierung implementieren.