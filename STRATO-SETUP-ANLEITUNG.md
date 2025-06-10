# 🚀 RELOCATO® auf Strato - Komplette Setup-Anleitung

## ✅ VORBEREITUNG ABGESCHLOSSEN

**Alle Dateien sind vorbereitet!** Sie müssen nur noch die folgenden Schritte im Strato-Panel durchführen:

---

## 🔐 SCHRITT 1: Strato-Panel Login

1. **Gehen Sie zu:** https://www.strato.de/apps/CustomerService
2. **Login-Daten:**
   - **Kundennummer:** 78132672
   - **Passwort:** PflegeHeld21%
3. **Klicken Sie:** "Anmelden"

---

## 🌐 SCHRITT 2: Subdomain einrichten

1. **Im Strato-Panel:**
   - Navigieren Sie zu **"Domains & SSL"** ODER **"Webspace & Domain"**
   - Wählen Sie **"ruempel-schmiede.com"**
   - Klicken Sie auf **"Subdomain hinzufügen"** ODER **"Subdomain erstellen"**

2. **Subdomain konfigurieren:**
   - **Name:** `relocato`
   - **Vollständige Domain:** `relocato.ruempel-schmiede.com`
   
   **Document Root Optionen (wählen Sie eine):**
   - **Option A:** `/relocato/` (neuer Unterordner)
   - **Option B:** `/html/relocato/` (falls html-Ordner vorhanden)
   - **Option C:** Lassen Sie Strato automatisch erstellen
   
   - **SSL aktivieren:** ✅ JA

3. **ALTERNATIVE: Falls Document Root nicht sichtbar:**
   - Erstellen Sie die Subdomain OHNE Document Root
   - Strato erstellt automatisch einen Ordner
   - Schauen Sie dann im **File Manager** nach dem neuen Ordner

4. **Speichern & Bestätigen**

### 🔍 **Document Root finden:**

**Nach der Subdomain-Erstellung:**
1. **Gehen Sie zu:** File Manager / FTP
2. **Suchen Sie nach:**
   - `/relocato/`
   - `/html/relocato/`
   - `/public_html/relocato/`
   - `/www/relocato/`

**Der richtige Ordner ist dort, wo Sie index.html hochladen müssen!**

---

## 📁 SCHRITT 3: Dateien hochladen

### **3a) Frontend hochladen**
1. **Via Strato File Manager oder FTP:**
   - Navigieren Sie zu `/relocato/` (der neue Subdomain-Ordner)
   - **Hochladen:** Alle Dateien aus `strato-deployment/frontend/build/`
   - **Struktur sollte sein:**
     ```
     /relocato/
     ├── index.html
     ├── static/
     │   ├── css/
     │   └── js/
     └── ...
     ```

### **3b) Backend hochladen (falls Node.js unterstützt)**
1. **Neuen Ordner erstellen:** `/relocato-api/`
2. **Hochladen:** Alle Dateien aus `strato-deployment/backend/`
   ```
   /relocato-api/
   ├── server.js
   ├── package.json
   ├── .env
   └── node_modules/ (nach npm install)
   ```

---

## ⚙️ SCHRITT 4: Node.js aktivieren (falls verfügbar)

1. **Im Strato-Panel:**
   - Gehen Sie zu **"Webspace & Domain"**
   - Wählen Sie **"Programmiersprachen"**
   - **Node.js aktivieren** (falls verfügbar)

2. **Falls Node.js NICHT verfügbar:**
   - **Alternative:** PHP-Backend nutzen (Datei erstellen wir bei Bedarf)
   - **Oder:** Externes Backend (Heroku/Railway)

---

## 🎯 SCHRITT 5: Test & Aktivierung

### **Frontend testen:**
1. **Öffnen Sie:** https://relocato.ruempel-schmiede.com
2. **Erwartetes Ergebnis:** RELOCATO® Login-Seite lädt

### **Backend testen:**
1. **Öffnen Sie:** https://relocato.ruempel-schmiede.com/api/health
2. **Erwartetes Ergebnis:** JSON mit Status "ok"

### **E-Mail testen:**
1. **Öffnen Sie:** https://relocato.ruempel-schmiede.com/api/test
2. **Erwartetes Ergebnis:** Test-E-Mail an sergej.schulz@relocato.de

---

## 🔧 ALTERNATIVE: PHP-Backend (falls Node.js nicht verfügbar)

Falls Strato kein Node.js unterstützt, verwenden wir PHP:

### **PHP E-Mail Script erstellen:**
```php
<?php
// /relocato/api/send-email.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $to = $input['to'];
    $subject = $input['subject'];
    $content = $input['content'];
    
    $headers = [
        'From: RELOCATO® <bielefeld@relocato.de>',
        'Reply-To: bielefeld@relocato.de',
        'Content-Type: text/plain; charset=UTF-8'
    ];
    
    if (mail($to, $subject, $content, implode("\r\n", $headers))) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Mail failed']);
    }
}
?>
```

---

## 📞 SUPPORT

**Falls Probleme auftreten:**

1. **Strato Hotline:** 030 300 102 300
2. **Strato Hilfe:** https://www.strato.de/hilfe/
3. **Fragen Sie nach:**
   - Node.js Aktivierung
   - Subdomain-Setup
   - SSL-Zertifikat

---

## ✅ ENDERGEBNIS

Nach erfolgreichem Setup haben Sie:

🌐 **https://relocato.ruempel-schmiede.com** - Vollständig funktionsfähige RELOCATO® Web-App
📧 **E-Mail System** - Funktioniert über IONOS SMTP
🏢 **Professionelle Domain** - Eigene, seriöse URL
🔒 **SSL-Verschlüsselung** - Sicher und vertrauenswürdig
📱 **Mobile-optimiert** - Funktioniert auf allen Geräten

**Das System ist bereit für den produktiven Einsatz!**

---

## 🎯 NÄCHSTE SCHRITTE

1. ✅ **Folgen Sie dieser Anleitung**
2. ✅ **Testen Sie alle Funktionen**
3. ✅ **Senden Sie erste Angebote**
4. ✅ **Ihr RELOCATO® System ist einsatzbereit!**