# IONOS Backend Setup - Schritt für Schritt

## 1. Backend auf Ihrem lokalen Computer testen

### Schritt 1: Backend-Ordner öffnen
```bash
cd /Users/sergejschulz/Desktop/main/umzugs-webapp/backend
```

### Schritt 2: Pakete installieren
```bash
npm install
```

### Schritt 3: IONOS E-Mail-Daten eintragen
Bearbeiten Sie die Datei `backend/.env`:
```
SMTP_USER=ihre-email@ihre-domain.de   # Ihre vollständige IONOS E-Mail
SMTP_PASS=ihr-passwort                # Ihr IONOS E-Mail-Passwort  
SMTP_FROM=info@ihre-domain.de         # Absender-Adresse
```

### Schritt 4: SMTP-Verbindung testen
```bash
npm test
```

### Schritt 5: Backend-Server starten
```bash
npm start
```

Server läuft auf: http://localhost:3001

---

## 2. Auf IONOS Server deployen

### Option A: IONOS Managed Node.js Hosting

1. **IONOS Control Panel** → "Hosting" → "Node.js"
2. **Neue Node.js App erstellen**
3. **Dateien hochladen:**
   - server.js
   - package.json
   - .env (mit Ihren echten Daten)

4. **In IONOS SSH Terminal:**
```bash
npm install
npm start
```

### Option B: IONOS VPS/Root Server

1. **Per SSH verbinden:**
```bash
ssh root@ihre-server-ip
```

2. **Node.js installieren:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Projekt-Ordner erstellen:**
```bash
mkdir /var/www/relocato-backend
cd /var/www/relocato-backend
```

4. **Dateien hochladen** (per SFTP/SCP)

5. **PM2 für dauerhaften Betrieb:**
```bash
npm install -g pm2
npm install
pm2 start server.js --name relocato-email
pm2 save
pm2 startup
```

---

## 3. Frontend mit Backend verbinden

### In Ihrer React-App `.env`:
```
# Für lokale Entwicklung:
REACT_APP_API_URL=http://localhost:3001

# Für Production (Ihre IONOS Domain):
REACT_APP_API_URL=https://api.ihre-domain.de
```

---

## 4. IONOS Firewall konfigurieren

1. **IONOS Control Panel** → "Server" → "Firewall"
2. **Port 3001 freigeben** (oder anderen Port)
3. **Nur HTTPS in Production!**

---

## 5. SSL-Zertifikat (wichtig!)

### Mit Let's Encrypt:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d api.ihre-domain.de
```

### Nginx als Reverse Proxy:
```nginx
server {
    listen 443 ssl;
    server_name api.ihre-domain.de;
    
    ssl_certificate /etc/letsencrypt/live/api.ihre-domain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.ihre-domain.de/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Testen

### Backend Health Check:
```bash
curl https://api.ihre-domain.de/api/health
```

### Test-E-Mail senden:
```bash
curl -X POST https://api.ihre-domain.de/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"ihre-email@domain.de"}'
```

---

## Support

Bei IONOS-spezifischen Fragen:
- IONOS Support: 0721 / 96 00
- SMTP-Probleme: Prüfen Sie SPF/DKIM Einträge
- Port 587 oder 465 verwenden
- Vollständige E-Mail-Adresse als Benutzername