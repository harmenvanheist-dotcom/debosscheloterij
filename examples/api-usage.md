# API Usage Examples

Dit document bevat praktische voorbeelden van hoe je de API kunt gebruiken.

## 1. Complete Payment Flow (JavaScript/Frontend)

```javascript
// Stap 1: Maak een lottery ticket aan
async function createLotteryTicket() {
  try {
    const response = await fetch('http://localhost:3000/api/lottery/ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer_email: 'klant@example.com',
        customer_name: 'Jan Janssen',
        ticket_count: 3,
        price_per_ticket: 5.00
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Ticket ID:', data.data.ticket_id);
      console.log('Amount:', data.data.amount);
      console.log('Lottery numbers:', data.data.lottery_numbers);

      // Stap 2: Redirect naar Mollie checkout
      window.location.href = data.data.checkout_url;
    }
  } catch (error) {
    console.error('Error creating ticket:', error);
  }
}
```

## 2. Check Payment Status

```javascript
async function checkPaymentStatus(ticketId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/lottery/ticket/${ticketId}/status`
    );

    const data = await response.json();

    if (data.success) {
      console.log('Payment Status:', data.data.payment_status);

      if (data.data.payment_status === 'paid') {
        console.log('Payment successful!');
        console.log('Paid at:', data.data.paid_at);
      }
    }
  } catch (error) {
    console.error('Error checking status:', error);
  }
}
```

## 3. Get Customer's Tickets

```javascript
async function getCustomerTickets(email) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/lottery/tickets/email/${encodeURIComponent(email)}`
    );

    const data = await response.json();

    if (data.success) {
      console.log(`Found ${data.count} tickets for ${email}`);

      data.data.forEach((ticket, index) => {
        console.log(`\nTicket ${index + 1}:`);
        console.log('  ID:', ticket.id);
        console.log('  Status:', ticket.payment_status);
        console.log('  Amount:', ticket.amount);
        console.log('  Numbers:', ticket.lottery_numbers);
      });
    }
  } catch (error) {
    console.error('Error fetching tickets:', error);
  }
}
```

## 4. cURL Examples

### Create Ticket
```bash
curl -X POST http://localhost:3000/api/lottery/ticket \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "test@example.com",
    "customer_name": "Test User",
    "ticket_count": 2,
    "price_per_ticket": 5.00
  }'
```

### Get Ticket Details
```bash
curl http://localhost:3000/api/lottery/ticket/YOUR_TICKET_ID
```

### Check Payment Status
```bash
curl http://localhost:3000/api/lottery/ticket/YOUR_TICKET_ID/status
```

### Get Tickets by Email
```bash
curl http://localhost:3000/api/lottery/tickets/email/test@example.com
```

## 5. React Component Example

```jsx
import React, { useState } from 'react';

function LotteryPurchase() {
  const [formData, setFormData] = useState({
    customer_email: '',
    customer_name: '',
    ticket_count: 1,
    price_per_ticket: 5.00
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/lottery/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Mollie payment page
        window.location.href = data.data.checkout_url;
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={formData.customer_email}
        onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
        required
      />

      <input
        type="text"
        placeholder="Name"
        value={formData.customer_name}
        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
        required
      />

      <input
        type="number"
        min="1"
        max="100"
        value={formData.ticket_count}
        onChange={(e) => setFormData({...formData, ticket_count: parseInt(e.target.value)})}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : `Buy ${formData.ticket_count} Ticket(s) - €${formData.ticket_count * formData.price_per_ticket}`}
      </button>
    </form>
  );
}
```

## 6. Node.js Backend Example

```javascript
const express = require('express');
const app = express();

app.post('/purchase-lottery', async (req, res) => {
  const { email, name, ticketCount } = req.body;

  try {
    // Create ticket via your lottery API
    const response = await fetch('http://localhost:3000/api/lottery/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_email: email,
        customer_name: name,
        ticket_count: ticketCount,
        price_per_ticket: 5.00
      })
    });

    const data = await response.json();

    // Return checkout URL to frontend
    res.json({
      checkout_url: data.data.checkout_url,
      ticket_id: data.data.ticket_id
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});
```

## 7. Polling for Payment Status

```javascript
// Poll payment status every 5 seconds
function pollPaymentStatus(ticketId, maxAttempts = 60) {
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    try {
      const response = await fetch(
        `http://localhost:3000/api/lottery/ticket/${ticketId}/status`
      );
      const data = await response.json();

      if (data.data.payment_status === 'paid') {
        clearInterval(interval);
        console.log('Payment confirmed!');
        // Show success message to user
        showSuccessMessage();
      } else if (data.data.payment_status === 'failed' ||
                 data.data.payment_status === 'cancelled') {
        clearInterval(interval);
        console.log('Payment failed or cancelled');
        showErrorMessage();
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.log('Polling timeout');
      }
    } catch (error) {
      console.error('Error polling status:', error);
    }
  }, 5000); // Check every 5 seconds
}
```

## 8. TypeScript Example

```typescript
interface CreateTicketRequest {
  customer_email: string;
  customer_name: string;
  ticket_count: number;
  price_per_ticket: number;
}

interface CreateTicketResponse {
  success: boolean;
  data: {
    ticket_id: string;
    checkout_url: string;
    amount: number;
    lottery_numbers: number[][];
  };
  message: string;
}

async function createTicket(
  request: CreateTicketRequest
): Promise<CreateTicketResponse> {
  const response = await fetch('http://localhost:3000/api/lottery/ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Usage
const ticket = await createTicket({
  customer_email: 'user@example.com',
  customer_name: 'John Doe',
  ticket_count: 3,
  price_per_ticket: 5.00,
});

console.log('Ticket created:', ticket.data.ticket_id);
window.location.href = ticket.data.checkout_url;
```

## 9. Error Handling

```javascript
async function createTicketWithErrorHandling() {
  try {
    const response = await fetch('http://localhost:3000/api/lottery/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        ticket_count: 1,
        price_per_ticket: 5.00
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle API errors
      if (response.status === 400) {
        console.error('Validation error:', data.error);
        alert('Please check your input: ' + data.error);
      } else if (response.status === 500) {
        console.error('Server error:', data.error);
        alert('Server error. Please try again later.');
      }
      return;
    }

    // Success
    window.location.href = data.data.checkout_url;

  } catch (error) {
    // Handle network errors
    console.error('Network error:', error);
    alert('Connection error. Please check your internet connection.');
  }
}
```

## 10. Webhook Testing (for Development)

Simuleer een Mollie webhook tijdens development:

```bash
# Simuleer een successful payment webhook
curl -X POST http://localhost:3000/api/lottery/webhook \
  -H "Content-Type: application/json" \
  -d '{"id": "tr_WDqYK6vllg"}'
```

Note: In productie wordt dit automatisch aangeroepen door Mollie.
