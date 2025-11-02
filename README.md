# De Boss Loterij - Payment Module

Een complete betaalmodule voor loterijen met Mollie integratie, automatische lotnummergeneratie en email bevestigingen.

## Features

- **Mollie Payment Integration**: Veilige betalingen via Mollie
- **Automatische Lotnummergeneratie**: Genereert unieke lotnummers voor elke deelname
- **Email Bevestigingen**: Stuurt automatisch professionele bevestigingsmails met lotnummers
- **SQLite Database**: Persistente opslag van tickets en betalingen
- **RESTful API**: Eenvoudige integratie via HTTP endpoints
- **TypeScript**: Type-safe code voor betrouwbaarheid
- **Webhook Support**: Automatische verwerking van betaalstatussen

## Installatie

```bash
# Clone de repository
git clone <repository-url>
cd debosscheloterij

# Installeer dependencies
npm install

# Kopieer environment variables
cp .env.example .env

# Bewerk .env met jouw configuratie
nano .env
```

## Configuratie

Bewerk het `.env` bestand met jouw gegevens:

```env
# Mollie API key (haal deze op van het Mollie dashboard)
MOLLIE_API_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Server instellingen
PORT=3000
REDIRECT_URL=http://localhost:3000/payment-success
WEBHOOK_URL=https://jouwdomain.nl/api/lottery/webhook

# SMTP email configuratie
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email afzender
FROM_EMAIL=noreply@debosscheloterij.nl
FROM_NAME=De Boss Loterij
```

### Mollie Setup

1. Maak een account aan op [Mollie.com](https://www.mollie.com/)
2. Ga naar Developers > API Keys
3. Kopieer je Test API key voor development
4. Voor productie, gebruik je Live API key

### Email Setup (Gmail voorbeeld)

1. Ga naar je Google Account instellingen
2. Schakel 2-factor authenticatie in
3. Genereer een App Password voor "Mail"
4. Gebruik dit password in `SMTP_PASS`

## Build & Run

```bash
# Build TypeScript
npm run build

# Start productie server
npm start

# Development mode (met auto-reload)
npm run dev
```

## API Endpoints

### 1. Create Lottery Ticket & Payment

Start een nieuwe loterij deelname en betaling.

**Endpoint:** `POST /api/lottery/ticket`

**Request Body:**
```json
{
  "customer_email": "klant@example.com",
  "customer_name": "Jan Janssen",
  "ticket_count": 3,
  "price_per_ticket": 5.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket_id": "uuid-hier",
    "checkout_url": "https://www.mollie.com/checkout/...",
    "amount": 15.00,
    "lottery_numbers": [
      [3, 12, 24, 31, 38, 42],
      [7, 15, 22, 29, 35, 44],
      [1, 9, 18, 27, 33, 41]
    ]
  },
  "message": "Ticket created successfully. Redirect customer to checkout_url to complete payment."
}
```

### 2. Get Ticket Details

Haal ticket informatie op.

**Endpoint:** `GET /api/lottery/ticket/:ticketId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customer_email": "klant@example.com",
    "customer_name": "Jan Janssen",
    "lottery_numbers": [[3, 12, 24, 31, 38, 42]],
    "payment_status": "paid",
    "amount": 5.00,
    "ticket_count": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "paid_at": "2024-01-15T10:32:00Z"
  }
}
```

### 3. Check Payment Status

Controleer de betaalstatus van een ticket.

**Endpoint:** `GET /api/lottery/ticket/:ticketId/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket_id": "uuid",
    "payment_status": "paid",
    "paid_at": "2024-01-15T10:32:00Z"
  }
}
```

### 4. Get Tickets by Email

Haal alle tickets op voor een klant email.

**Endpoint:** `GET /api/lottery/tickets/email/:email`

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid-1",
      "lottery_numbers": [[3, 12, 24, 31, 38, 42]],
      "payment_status": "paid",
      "amount": 5.00
    },
    {
      "id": "uuid-2",
      "lottery_numbers": [[7, 15, 22, 29, 35, 44]],
      "payment_status": "pending",
      "amount": 5.00
    }
  ]
}
```

### 5. Mollie Webhook

Webhook voor Mollie betaalstatus updates (automatisch aangeroepen door Mollie).

**Endpoint:** `POST /api/lottery/webhook`

**Request Body:**
```json
{
  "id": "tr_xxxxxxxxx"
}
```

## Gebruik Scenario

### Complete Payment Flow

1. **Frontend maakt ticket aan:**
```javascript
const response = await fetch('http://localhost:3000/api/lottery/ticket', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customer_email: 'klant@example.com',
    customer_name: 'Jan Janssen',
    ticket_count: 2,
    price_per_ticket: 5.00
  })
});

const data = await response.json();
// Redirect gebruiker naar checkout_url
window.location.href = data.data.checkout_url;
```

2. **Klant betaalt via Mollie**

3. **Mollie stuurt webhook naar jouw server**

4. **Server verwerkt betaling en stuurt email**

5. **Klant ontvangt bevestigingsmail met lotnummers**

## Database Schema

### lottery_tickets
- `id` (TEXT): Unieke ticket ID
- `customer_email` (TEXT): Klant email
- `customer_name` (TEXT): Klant naam
- `lottery_numbers` (TEXT): JSON array van lotnummers
- `payment_id` (TEXT): Mollie payment ID
- `payment_status` (TEXT): Status (pending/paid/failed/cancelled)
- `amount` (REAL): Totaalbedrag
- `ticket_count` (INTEGER): Aantal loten
- `created_at` (DATETIME): Aanmaak datum
- `paid_at` (DATETIME): Betaaldatum

### payments
- `id` (TEXT): Unieke payment ID
- `mollie_payment_id` (TEXT): Mollie payment ID
- `ticket_id` (TEXT): Gekoppeld ticket ID
- `amount` (REAL): Bedrag
- `status` (TEXT): Mollie payment status
- `checkout_url` (TEXT): Mollie checkout URL
- `created_at` (DATETIME): Aanmaak datum
- `updated_at` (DATETIME): Update datum

## Lottery Number Generation

Standaard configuratie:
- **Range**: 1-45
- **Numbers per ticket**: 6 unieke nummers
- **Format**: Gesorteerd van laag naar hoog

Configuratie aanpassen in `src/services/lotteryGenerator.ts`:
```typescript
new LotteryNumberGenerator(
  minNumber: 1,      // Minimum nummer
  maxNumber: 45,     // Maximum nummer
  numbersPerTicket: 6 // Aantal nummers per ticket
)
```

## Email Templates

Emails bevatten:
- Persoonlijke begroeting
- Bestelling details (aantal loten, bedrag)
- Alle lotnummers duidelijk weergegeven
- Ticket ID voor referentie
- Professionele HTML en plain text versie

## Testing

### Test met Mollie Test Mode

1. Gebruik een test API key (begint met `test_`)
2. Gebruik Mollie's test payment URLs
3. Geen echte betalingen worden verwerkt

### Manual Testing

```bash
# Start de server
npm run dev

# In een andere terminal, test een ticket aanmaken
curl -X POST http://localhost:3000/api/lottery/ticket \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "test@example.com",
    "customer_name": "Test User",
    "ticket_count": 1,
    "price_per_ticket": 5.00
  }'
```

## Security Considerations

- Gebruik HTTPS in productie
- Bewaar `.env` nooit in git (staat in `.gitignore`)
- Gebruik sterke SMTP passwords
- Valideer alle input
- Rate limit API endpoints in productie
- Gebruik Mollie's webhook signing in productie

## Productie Deployment

1. **Zet HTTPS op** (vereist voor Mollie webhooks)
2. **Update environment variables** met productie waarden
3. **Gebruik Live Mollie API key**
4. **Configureer webhook URL** in Mollie dashboard
5. **Setup database backups**
6. **Monitor logs** voor fouten

## Troubleshooting

### Email wordt niet verzonden
- Controleer SMTP credentials
- Check firewall voor SMTP port (587/465)
- Verifieer Gmail App Password

### Webhook werkt niet
- Zorg dat WEBHOOK_URL publiek toegankelijk is
- Check Mollie dashboard voor webhook logs
- Verifieer HTTPS in productie

### Database errors
- Check file permissions voor `lottery.db`
- Verifieer database schema is aangemaakt

## Support

Voor vragen of problemen, maak een issue aan in de repository.

## License

ISC
