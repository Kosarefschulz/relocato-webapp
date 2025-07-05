# Vercel Environment Variables Setup

## Schritt 1: Vercel CLI installieren (falls noch nicht vorhanden)
```bash
npm i -g vercel
```

## Schritt 2: Mit Vercel verbinden
```bash
vercel
```

## Schritt 3: Environment-Variablen hinzufügen

Fügen Sie diese Variablen in Ihrem Vercel-Dashboard hinzu:
https://vercel.com/[your-username]/[your-project]/settings/environment-variables

### Erforderliche Variablen:

```
IONOS_EMAIL=bielefeld@relocato.de
IONOS_PASSWORD=Bicm1308
IONOS_IMAP_HOST=imap.ionos.de
IONOS_SMTP_HOST=smtp.ionos.de
```

### Wichtig:
- Setzen Sie diese Variablen für "Production", "Preview" und "Development"
- Nach dem Hinzufügen müssen Sie ein neues Deployment triggern

## Schritt 4: Deployment
```bash
# Production deployment
vercel --prod

# Preview deployment
vercel
```

## Schritt 5: Domain konfigurieren (optional)
Sie können eine eigene Domain in den Vercel-Projekteinstellungen hinzufügen.

## Debugging
Falls Probleme auftreten, können Sie die Logs in Ihrem Vercel-Dashboard prüfen:
https://vercel.com/[your-username]/[your-project]/functions