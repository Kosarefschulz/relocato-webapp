# 🎯 DNS KONFIGURATION - STRATO PANEL

## ✅ SCHRITT-FÜR-SCHRITT ANLEITUNG

### **1️⃣ LOGIN BEI STRATO**
- **URL:** https://www.strato.de/apps/CustomerService
- **Login:** 78132672
- **Passwort:** PflegeHeld21%

---

### **2️⃣ ZU DNS VERWALTUNG NAVIGIEREN**

**Im Menü links:**
1. **"Domains"** aufklappen
2. **"Domainverwaltung"** klicken
3. **"ruempel-schmiede.com"** auswählen
4. **Tab "DNS"** oben anklicken

---

### **3️⃣ DNS EINTRÄGE HINZUFÜGEN**

**WICHTIG:** Alle bestehenden Einträge LASSEN, nur neue hinzufügen!

#### **A) HAUPTDOMAIN (ruempel-schmiede.com)**

**Klicken Sie:** "A-Record verwalten"

```
Typ: A
Subdomain: @ (oder leer)
IPv4-Adresse: 76.76.21.21
```

**Speichern**

#### **B) API SUBDOMAIN (api.ruempel-schmiede.com)**

**Klicken Sie:** "CNAME-Record verwalten"

```
Typ: CNAME
Subdomain: api
Ziel: cname.vercel-dns.com.
```

**Speichern**

#### **C) WWW SUBDOMAIN (optional)**

**Klicken Sie:** "CNAME-Record verwalten"

```
Typ: CNAME
Subdomain: www
Ziel: cname.vercel-dns.com.
```

**Speichern**

---

### **4️⃣ VERCEL KONFIGURATION**

**Nach DNS-Einrichtung bei Strato:**

1. **Öffnen Sie:** https://vercel.com/sergej-schulzs-projects/umzugs-webapp/settings/domains
2. **Login mit:** GitHub Account
3. **"Add Domain"** klicken
4. **Eingeben:** `ruempel-schmiede.com`
5. **Warten auf:** DNS Verification ✅

---

### **5️⃣ SSL ZERTIFIKAT**

**Vercel erstellt AUTOMATISCH SSL nach DNS-Verifizierung!**
- ⏱️ **Dauer:** 5-10 Minuten nach DNS
- 🔒 **Ergebnis:** https://ruempel-schmiede.com

---

## 🎯 ALTERNATIVE: SUBDOMAIN NUTZEN

**Falls Hauptdomain nicht funktioniert:**

### **Subdomain erstellen: app.ruempel-schmiede.com**

1. **Bei Strato:** Subdomain "app" erstellen
2. **A-Record für app:**
   ```
   Subdomain: app
   IPv4: 76.76.21.21
   ```
3. **Vercel:** Domain `app.ruempel-schmiede.com` hinzufügen

**Dann verfügbar unter:**
- 🌐 **Frontend:** https://app.ruempel-schmiede.com
- 🔧 **Backend:** https://api.ruempel-schmiede.com

---

## ✅ TESTEN NACH SETUP

**Nach 5-30 Minuten prüfen:**

1. **DNS Check:**
   ```bash
   nslookup ruempel-schmiede.com
   # Sollte 76.76.21.21 zeigen
   ```

2. **Website Test:**
   - https://ruempel-schmiede.com
   - https://api.ruempel-schmiede.com/api/health

3. **E-Mail Test:**
   - https://api.ruempel-schmiede.com/api/test

---

## 🆘 TROUBLESHOOTING

**Domain zeigt noch alte Seite:**
- Cache leeren (Ctrl+Shift+R)
- Warten (DNS braucht bis 48h)
- Private/Inkognito Tab nutzen

**SSL Fehler:**
- Vercel braucht 5-10min für SSL
- Prüfen auf: https://vercel.com/sergej-schulzs-projects/umzugs-webapp/settings/domains

**API nicht erreichbar:**
- CNAME für "api" prüfen
- Muss auf `cname.vercel-dns.com.` zeigen

---

## 📞 SUPPORT

**Strato DNS Hilfe:**
- **Hotline:** 030 300 102 300
- **Sagen:** "DNS A-Record für Domain einrichten"

**Das war's! In 30 Minuten ist alles online! 🚀**