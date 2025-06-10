# ✅ RELOCATO® Deployment Checklist

## 🎯 FINAL VERIFICATION - Nach Strato Setup

### **1. Domain & SSL**
- [ ] https://relocato.ruempel-schmiede.com lädt ohne Fehler
- [ ] SSL-Zertifikat aktiv (🔒 grünes Schloss im Browser)
- [ ] Keine CORS-Fehler in Browser-Konsole

### **2. Frontend Funktionen**
- [ ] Login-Seite lädt korrekt
- [ ] Firebase Authentication funktioniert
- [ ] Dashboard lädt nach Login
- [ ] Angebot erstellen öffnet sich
- [ ] Google Sheets Daten werden geladen
- [ ] Responsive Design auf Mobile

### **3. Backend API Tests**
**Öffnen Sie diese URLs in Ihrem Browser:**

- [ ] **Health Check:** https://relocato.ruempel-schmiede.com/api/health
  - **Erwartung:** `{"status":"ok","message":"RELOCATO Backend is running"}`

- [ ] **Test E-Mail:** https://relocato.ruempel-schmiede.com/api/test
  - **Erwartung:** Test-E-Mail an sergej.schulz@relocato.de

### **4. E-Mail System**
- [ ] **Angebot erstellen und senden:**
  1. Kunde eingeben: sergej.schulz@relocato.de
  2. Umzugsdaten ausfüllen
  3. "Angebot senden" klicken
  4. Erfolgs-Nachricht erscheint
  5. E-Mail kommt an

### **5. Fehlerbehebung**
**Falls Probleme auftreten:**

#### **Frontend lädt nicht:**
```bash
# Prüfen Sie Browser-Konsole (F12)
# Typische Fehler:
- 404: Dateien nicht hochgeladen
- SSL: Mixed Content Warnings
- CORS: API-Aufrufe blockiert
```

#### **Backend nicht erreichbar:**
```bash
# Node.js nicht aktiv -> PHP Alternative nutzen
# Siehe STRATO-SETUP-ANLEITUNG.md Schritt "PHP-Backend"
```

#### **E-Mails kommen nicht an:**
```bash
# IONOS SMTP Zugangsdaten prüfen:
- Host: smtp.ionos.de
- Port: 587
- User: bielefeld@relocato.de
- Pass: Bicm1308
```

---

## 🚀 PRODUKTIV-FREIGABE

**Wenn alle Checkboxen ✅ sind:**

🎉 **RELOCATO® ist erfolgreich deployed!**
🌐 **URL:** https://relocato.ruempel-schmiede.com
📧 **E-Mail:** Funktioniert über IONOS
🔒 **SSL:** Sicher und vertrauenswürdig
📱 **Mobile:** Vollständig responsive

---

## 📞 SUPPORT KONTAKTE

- **Strato Hotline:** 030 300 102 300
- **IONOS Support:** 030 57700 0
- **Domain:** ruempel-schmiede.com (Strato Panel: Login 78132672)
- **E-Mail:** bielefeld@relocato.de (IONOS: Bicm1308)

---

**Das System ist bereit für den produktiven Einsatz! 🎯**