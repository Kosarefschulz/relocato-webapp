# 🆘 STRATO Document Root Problem - Lösung

## 🎯 SCHNELLE LÖSUNG

**Falls Sie "Document Root" nicht finden:**

### **METHODE 1: Ohne Document Root erstellen**
1. **Subdomain Name:** `relocato`
2. **SSL:** ✅ JA
3. **Document Root:** LEER LASSEN
4. **Speichern**

➡️ **Strato erstellt automatisch den Ordner!**

---

### **METHODE 2: Strato Standard-Struktur**

**Strato verwendet oft diese Struktur:**
```
/html/              ← Hauptordner
├── index.html      ← Ihre Hauptdomain
└── relocato/       ← Ihre Subdomain (wird automatisch erstellt)
```

**Versuchen Sie:**
- **Document Root:** `/html/relocato/`
- **Document Root:** `relocato/`
- **Document Root:** `/relocato/`

---

### **METHODE 3: Nach Erstellung finden**

**1. Subdomain OHNE Document Root erstellen**
**2. Dann File Manager öffnen:**
   - Strato Panel → **"File Manager"**
   - Oder **"FTP-Zugang"**

**3. Suchen Sie nach dem neuen Ordner:**
   - `/relocato/`
   - `/html/relocato/`
   - `/public_html/relocato/`
   - `/www/relocato/`
   - `/domains/relocato.ruempel-schmiede.com/`

---

## 🔍 WO FINDE ICH DEN FILE MANAGER?

**Im Strato Panel suchen Sie nach:**
- **"Dateimanager"**
- **"File Manager"**
- **"FTP-Zugang"**
- **"Webspace"**
- **"Hosting"**

**Meist unter:** "Webspace & Domain" → "File Manager"

---

## ✅ TEST OB RICHTIG

**Nach der Erstellung testen:**
1. **Öffnen Sie:** https://relocato.ruempel-schmiede.com
2. **Erwartung:** 
   - Strato Standard-Seite ODER
   - 404 Fehler (= Ordner ist da, aber leer)
   - ❌ NICHT: DNS-Fehler oder "Domain not found"

---

## 📞 NOTFALL: STRATO HOTLINE

**Falls gar nichts funktioniert:**
- **Telefon:** 030 300 102 300
- **Sagen Sie:** "Ich möchte eine Subdomain erstellen und brauche Hilfe beim Document Root"
- **Login:** 78132672
- **Domain:** ruempel-schmiede.com
- **Subdomain:** relocato

---

## 🎯 WEITER NACH SUBDOMAIN-ERSTELLUNG

**Sobald die Subdomain funktioniert:**
1. **Finden Sie den Ordner** (File Manager)
2. **Hochladen:** Alle Dateien aus `strato-frontend/build/`
3. **Testen:** https://relocato.ruempel-schmiede.com

**Der schwierigste Teil ist geschafft! 🚀**