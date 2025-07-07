-- Insert default quote templates for each company
WITH relocato_template AS (
  INSERT INTO pdf_templates (company_type, template_type, name, description, is_active)
  VALUES ('relocato', 'quote', 'Standard Angebot', 'Standardvorlage für Relocato Angebote', true)
  RETURNING id
),
wertvoll_template AS (
  INSERT INTO pdf_templates (company_type, template_type, name, description, is_active)
  VALUES ('wertvoll', 'quote', 'Standard Angebot', 'Standardvorlage für Wertvoll Dienstleistungen Angebote', true)
  RETURNING id
),
ruempelschmiede_template AS (
  INSERT INTO pdf_templates (company_type, template_type, name, description, is_active)
  VALUES ('ruempelschmiede', 'quote', 'Standard Angebot', 'Standardvorlage für Rümpel Schmiede Angebote', true)
  RETURNING id
)

-- Insert content blocks for Relocato template
INSERT INTO template_content_blocks (template_id, block_type, name, position, page_number, settings, content)
SELECT 
  id,
  unnest(ARRAY['logo', 'header', 'customer_info', 'service_list', 'pricing_table', 'terms', 'signature', 'footer']::content_block_type[]),
  unnest(ARRAY['Firmenlogo', 'Angebotskopf', 'Kundendaten', 'Leistungsübersicht', 'Preistabelle', 'Bedingungen', 'Unterschrift', 'Fußzeile']),
  unnest(ARRAY[0, 1, 2, 3, 4, 5, 6, 7]),
  1,
  '{"font": {"family": "helvetica", "size": 10}}'::jsonb,
  unnest(ARRAY[
    '{"width": 40, "height": 20}'::jsonb,
    '{"template": "Angebot Nr. {{quote.number}}\nGültig bis: {{quote.validUntil}}"}'::jsonb,
    '{"data": {"name": true, "address": true, "email": true, "phone": true}}'::jsonb,
    '{"title": "Leistungsumfang"}'::jsonb,
    '{}'::jsonb,
    '{"title": "Zahlungsbedingungen", "text": "Zahlung nach Leistungserbringung"}'::jsonb,
    '{"leftLabel": "Ort, Datum", "rightLabel": "Unterschrift Auftraggeber"}'::jsonb,
    '{"template": "{{companyName}} | {{date}}"}'::jsonb
  ])
FROM relocato_template;

-- Insert invoice templates
INSERT INTO pdf_templates (company_type, template_type, name, description, is_active)
VALUES 
  ('relocato', 'invoice', 'Standard Rechnung', 'Standardvorlage für Relocato Rechnungen', true),
  ('wertvoll', 'invoice', 'Standard Rechnung', 'Standardvorlage für Wertvoll Rechnungen', true),
  ('ruempelschmiede', 'invoice', 'Standard Rechnung', 'Standardvorlage für Rümpel Schmiede Rechnungen', true);

-- Insert sample services for each company
INSERT INTO service_catalog (company_type, service_code, service_name, description, unit, base_price, category)
VALUES 
  -- Relocato services
  ('relocato', 'UMZ-001', 'Umzugsservice', 'Kompletter Umzugsservice inkl. Be- und Entladen', 'cbm', 50.00, 'Umzug'),
  ('relocato', 'UMZ-002', 'Verpackungsservice', 'Professioneller Verpackungsservice', 'hour', 35.00, 'Umzug'),
  ('relocato', 'UMZ-003', 'Umzugskartons', 'Umzugskartons (Leihweise)', 'piece', 2.50, 'Material'),
  ('relocato', 'UMZ-004', 'Möbelmontage', 'Möbelmontage am Zielort', 'hour', 45.00, 'Montage'),
  ('relocato', 'UMZ-005', 'Möbeldemontage', 'Möbeldemontage am Ausgangsort', 'hour', 45.00, 'Montage'),
  
  -- Wertvoll services
  ('wertvoll', 'WDL-001', 'Entrümpelung', 'Professionelle Entrümpelung', 'cbm', 25.00, 'Entrümpelung'),
  ('wertvoll', 'WDL-002', 'Haushaltsauflösung', 'Komplette Haushaltsauflösung', 'flat', 500.00, 'Entrümpelung'),
  ('wertvoll', 'WDL-003', 'Renovierungsarbeiten', 'Renovierung nach Umzug', 'hour', 55.00, 'Renovierung'),
  ('wertvoll', 'WDL-004', 'Endreinigung', 'Besenreine Übergabe', 'sqm', 3.50, 'Reinigung'),
  ('wertvoll', 'WDL-005', 'Entsorgung', 'Fachgerechte Entsorgung', 'cbm', 15.00, 'Entsorgung'),
  
  -- Rümpel Schmiede services
  ('ruempelschmiede', 'RPS-001', 'Kellerentrümpelung', 'Entrümpelung von Kellern', 'flat', 250.00, 'Entrümpelung'),
  ('ruempelschmiede', 'RPS-002', 'Dachbodenentrümpelung', 'Entrümpelung von Dachböden', 'flat', 350.00, 'Entrümpelung'),
  ('ruempelschmiede', 'RPS-003', 'Sperrmüllentsorgung', 'Entsorgung von Sperrmüll', 'cbm', 20.00, 'Entsorgung'),
  ('ruempelschmiede', 'RPS-004', 'Wertgegenstände', 'Sortierung von Wertgegenständen', 'hour', 30.00, 'Service'),
  ('ruempelschmiede', 'RPS-005', 'Express-Entrümpelung', 'Entrümpelung innerhalb 24h', 'flat', 150.00, 'Express');