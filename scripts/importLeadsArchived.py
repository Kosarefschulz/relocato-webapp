#!/usr/bin/env python3
"""Import Leads as Archived"""
import pandas as pd
import requests
from datetime import datetime

SUPABASE_URL = 'https://kmxipuaqierjqaikuimi.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteGlwdWFxaWVyanFhaWt1aW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjU2NDUsImV4cCI6MjA2NjAwMTY0NX0.2S3cAnBh4zDFFQNpJ-VN17YrSJXyclyFjywN2izuPaU'

df = pd.read_excel('/Users/sergejschulz/Downloads/Leads.xlsx')
print(f'📊 {len(df)} Leads gefunden\n')

# Hole existierende
resp = requests.get(f'{SUPABASE_URL}/rest/v1/customers?select=email,phone,name', 
    headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
existing = resp.json()
existing_emails = {c.get('email', '').lower() for c in existing if c.get('email')}
existing_names = {c.get('name', '').lower() for c in existing if c.get('name')}

imported = skipped = 0

for idx, row in df.iterrows():
    name = str(row.get('Kontakt Name', '')).strip()
    email = str(row.get('Kontakt Email', '')).strip().lower()
    
    if not name or name == 'nan': 
        continue
    if (email != 'nan' and email in existing_emails) or name.lower() in existing_names:
        print(f'⏭️  {name}')
        skipped += 1
        continue
    
    customer = {
        'name': name,
        'email': email if email != 'nan' else '',
        'phone': str(row.get('Kontakt Telefon', '')).strip() if pd.notna(row.get('Kontakt Telefon')) else '',
        'from_address': str(row.get('Von Adresse', '')) if pd.notna(row.get('Von Adresse')) else '',
        'to_address': str(row.get('Nach Adresse', '')) if pd.notna(row.get('Nach Adresse')) else '',
        'current_phase': 'archiviert',
        'notes': f"Lead-Import\nQuelle: {row.get('Quelle', 'Unbekannt')}",
    }
    
    r = requests.post(f'{SUPABASE_URL}/rest/v1/customers',
        headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}', 
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        json=customer)
    
    if r.status_code in [200, 201]:
        print(f'✅ {name}')
        imported += 1
    else:
        print(f'❌ {name}: {r.text[:50]}')

print(f'\n✅ {imported} importiert, {skipped} übersprungen')
