# 🆘 STRATO File Upload Problem - Alle Lösungen

## 🎯 UPLOAD-METHODEN BEI STRATO

### **METHODE 1: File Manager**
**Im Strato Panel:**
1. **"Webspace & Domain"** → **"File Manager"**
2. **Ordner öffnen:** `/relocato/` (oder wo Subdomain zeigt)
3. **Upload Button** suchen (meist oben)
4. **Dateien auswählen** aus `strato-frontend/build/`

**Falls Upload-Button fehlt:** Weiter zu Methode 2!

---

### **METHODE 2: FTP-Client (EMPFOHLEN)**

**FTP-Zugangsdaten abrufen:**
1. **Strato Panel** → **"FTP-Zugang"** oder **"FTP-Accounts"**
2. **Notieren Sie:**
   - **Host:** ftp.strato.de (oder ähnlich)
   - **Username:** (meist gleich wie Login)
   - **Password:** (meist gleich wie Panel-Passwort)
   - **Port:** 21

**FTP-Client verwenden:**
- **Windows:** WinSCP (kostenlos)
- **Mac:** FileZilla (kostenlos) 
- **Browser:** Kann direkt ftp://... verwenden

---

### **METHODE 3: Strato App**
**Mobile App "Strato":**
1. **Download:** App Store / Google Play
2. **Login:** 78132672 / PflegeHeld21%
3. **File Manager** in der App
4. **Upload** über Handy

---

### **METHODE 4: ZIP Upload**
**Große Dateien als ZIP:**
1. **Alle Dateien** aus `strato-frontend/build/` in ZIP packen
2. **ZIP hochladen** (meist einfacher)
3. **Im Strato Panel entpacken**

---

## 🔧 FTP-DETAILS FÜR STRATO

**Standard FTP-Einstellungen:**
```
Host: ftp.strato.de
Port: 21
Username: 78132672 (oder u78132672)
Password: PflegeHeld21%
Pfad: /relocato/ (oder /html/relocato/)
```

**Alternative Hosts:**
- `ftp.ruempel-schmiede.com`
- `78132672.ftp.strato.de`

---

## 📁 WAS HOCHLADEN?

**Alle Dateien aus:** `strato-frontend/build/`
```
/relocato/
├── index.html          ← WICHTIG!
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── manifest.json
└── robots.txt
```

---

## 🆘 NOTFALL-LÖSUNGEN

### **Problem: Kein FTP-Zugang**
**Strato Hotline anrufen:**
- **Tel:** 030 300 102 300
- **Sagen:** "Ich brauche FTP-Zugangsdaten für Login 78132672"

### **Problem: Upload zu langsam**
**Nur wichtigste Dateien:**
1. **index.html** ← ZUERST!
2. **static/js/main.xxx.js** ← React App
3. **static/css/main.xxx.css** ← Styling

### **Problem: Große Dateien**
**Dateien verkleinern:**
- Bilder komprimieren
- Nur index.html + JS/CSS hochladen
- Rest später nachreichen

---

## ✅ TEST NACH UPLOAD

**1. Basis-Test:**
- **URL:** https://relocato.ruempel-schmiede.com
- **Erwartung:** RELOCATO Login-Seite

**2. Datei-Test:**
- **URL:** https://relocato.ruempel-schmiede.com/static/js/main.xxx.js
- **Erwartung:** JavaScript-Code anzeigen

---

## 📞 STRATO SUPPORT

**Falls nichts funktioniert:**
- **Hotline:** 030 300 102 300
- **Login:** 78132672
- **Problem:** "File Upload funktioniert nicht"
- **Fragen nach:** FTP-Zugang, File Manager Alternative

**Sie haben Anspruch auf technischen Support! 🚀**