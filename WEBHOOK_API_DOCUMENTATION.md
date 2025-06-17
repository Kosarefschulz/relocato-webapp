# Webhook API Documentation - RELOCATO® Quote Generation

## Overview

This webhook endpoint replaces the Zapier integration for automatic quote generation and email sending. It receives form data, calculates pricing based on the configured rules, generates a PDF quote, and sends it via email to the customer.

## Endpoint

```
POST https://europe-west1-umzugsapp.cloudfunctions.net/handleWebhook
```

## Features

- ✅ Automatic customer creation in database
- ✅ Quote calculation based on area, floors, distance, and services
- ✅ PDF generation with professional template
- ✅ Automatic email sending with PDF attachment
- ✅ Email history tracking
- ✅ Compatible with various form field names

## Request Format

### Headers
```
Content-Type: application/json
```

### Body (JSON)

The webhook accepts various field names for compatibility with different form builders:

```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "phone": "0521123456",
  "fromAddress": "Alte Straße 1, 33602 Bielefeld",
  "toAddress": "Neue Straße 2, 33604 Bielefeld",
  "movingDate": "2024-02-15",
  "area": 75,
  "rooms": 3,
  "fromFloor": 2,
  "toFloor": 1,
  "hasElevatorFrom": "true",
  "hasElevatorTo": "false",
  "distance": 25,
  "packingService": "true",
  "furnitureAssembly": "false",
  "customerType": "private",
  "notes": "Klavier vorhanden",
  "source": "website-form"
}
```

### Alternative Field Names

The webhook automatically maps these alternative field names:

- `name` → `fullName`, `customer_name`
- `email` → `customer_email`
- `phone` → `telephone`, `customer_phone`
- `fromAddress` → `from_address`, `current_address`
- `toAddress` → `to_address`, `new_address`
- `movingDate` → `moving_date`, `date`
- `area` → `apartment_size`, `wohnflaeche`
- `rooms` → `zimmer`
- `fromFloor` → `from_floor`, `etage_von`
- `toFloor` → `to_floor`, `etage_nach`
- `hasElevatorFrom` → `elevator_from` (accepts "yes")
- `hasElevatorTo` → `elevator_to` (accepts "yes")
- `distance` → `entfernung`
- `packingService` → `packing_service` (accepts "yes")
- `furnitureAssembly` → `furniture_assembly` (accepts "yes")
- `customerType` → `customer_type`
- `notes` → `comments`, `bemerkungen`

## Pricing Logic

The webhook uses the following pricing structure (matching the Zapier Python script):

### Base Prices by Area
- Up to 25m²: €399
- Up to 40m²: €549
- Up to 60m²: €749
- Up to 80m²: €949
- Up to 100m²: €1149
- Over 100m²: €1349

### Floor Surcharges (without elevator)
- 1st floor: €60
- 2nd floor: €120
- 3rd floor: €180
- 4th floor+: €240

### Additional Services
- Packing service: €8 per m²
- Furniture assembly: €75 per room
- Distance: First 50km included, then €1.50 per additional km
- Private customer discount: 5%
- VAT: 19%

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Angebot erfolgreich erstellt und versendet",
  "data": {
    "customerId": "K202401001",
    "customerNumber": "K202401001",
    "quoteId": "Q1704123456789_ABC12",
    "price": 892.50,
    "emailSent": true
  }
}
```

### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Error message",
  "details": "Stack trace (in development)"
}
```

## Integration Examples

### HTML Form
```html
<form action="https://europe-west1-umzugsapp.cloudfunctions.net/handleWebhook" method="POST">
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <input type="tel" name="phone" required>
  <input type="text" name="fromAddress" required>
  <input type="text" name="toAddress" required>
  <input type="number" name="area" required>
  <!-- ... other fields ... -->
  <button type="submit">Get Quote</button>
</form>
```

### JavaScript (Fetch API)
```javascript
fetch('https://europe-west1-umzugsapp.cloudfunctions.net/handleWebhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Max Mustermann',
    email: 'max@example.com',
    phone: '0521123456',
    area: 75,
    // ... other fields
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Quote created:', data.data.quoteId);
  }
});
```

### WordPress Contact Form 7
```
[contact-form-7 id="123" title="Umzugsanfrage"]
  [text* name placeholder "Ihr Name"]
  [email* email placeholder "Ihre E-Mail"]
  [tel* phone placeholder "Telefon"]
  [text* fromAddress placeholder "Aktuelle Adresse"]
  [text* toAddress placeholder "Neue Adresse"]
  [number* area min:20 placeholder "Wohnfläche in m²"]
  [submit "Angebot anfordern"]
[/contact-form-7]

<!-- In zusätzlichen Einstellungen: -->
<!-- Webhook URL: https://europe-west1-umzugsapp.cloudfunctions.net/handleWebhook -->
```

### Elementor Form
1. Add form fields with the correct names
2. In Form Actions, add "Webhook"
3. Set URL: `https://europe-west1-umzugsapp.cloudfunctions.net/handleWebhook`
4. Method: POST
5. Data Format: JSON

## Testing

### Test Form
A test form is available at:
```
https://umzugsapp.web.app/quote-form.html
```

### cURL Example
```bash
curl -X POST \
  https://europe-west1-umzugsapp.cloudfunctions.net/handleWebhook \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "0123456789",
    "fromAddress": "Test Street 1, 12345 City",
    "toAddress": "New Street 2, 54321 City",
    "area": 75,
    "rooms": 3,
    "distance": 30,
    "customerType": "private"
  }'
```

## Email Template

The webhook sends a professional email with:
- Customer greeting
- Quote details summary
- Price breakdown
- PDF attachment with full quote
- Company contact information

## PDF Quote

The generated PDF includes:
- Company branding (RELOCATO®)
- Quote number and validity date
- Customer information
- Moving details
- Service inclusions
- Detailed price breakdown
- Terms and conditions
- Contact information

## Error Handling

The webhook includes robust error handling:
- Missing required fields are replaced with defaults
- Invalid data types are converted automatically
- Failed email sending doesn't prevent quote creation
- All errors are logged for debugging

## Security

- CORS enabled for all origins
- No authentication required (public endpoint)
- Rate limiting handled by Firebase Functions
- Input validation and sanitization

## Deployment

The webhook is deployed as a Firebase Cloud Function:

```bash
# Deploy function
firebase deploy --only functions:handleWebhook

# View logs
firebase functions:log
```

## Support

For technical support or questions:
- Email: bielefeld@relocato.de
- Phone: 0521 / 329 777 30