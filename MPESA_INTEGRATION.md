# M-Pesa Integration Guide

So you want to add M-Pesa payments to your shop? This guide covers everything you need - from getting your Daraja credentials to handling live payments.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## Overview

We're using Safaricom's Daraja API to handle payments. Here's what it does:
- **STK Push:** Customers get a payment prompt on their phone - no typing numbers or codes
- **B2C Payouts:** Pay suppliers directly to their M-Pesa accounts automatically

---

## Features

### Customer Payments (STK Push)
- Customer enters their phone number at checkout
- They get a prompt to enter their M-Pesa PIN
- Payment confirms instantly (or we poll for status)
- Works with Safaricom, Airtel, and Telkom

### Supplier Payouts (B2C)
- Admins can send money directly to suppliers
- Everything's tracked with receipts
- Suppliers get M-Pesa confirmation messages

---

## Prerequisites

### 1. Get Your Daraja Account

**For Testing (Sandbox):**
1. Head to [Daraja Portal](https://developer.safaricom.co.ke/) and sign up
2. Create a sandbox app
3. Grab these from your dashboard:
   - Consumer Key
   - Consumer Secret
   - Shortcode (usually 174379 for sandbox)
   - Passkey

**For Live Payments (Production):**
1. Apply for production access (takes a few days)
2. Complete their KYC process
3. Get your real credentials
4. Set up your callback URLs

### 2. What You'll Need

| Thing | What It Is | Where to Get It |
|-------|------------|----------------|
| Consumer Key | Like a username for API calls | Your Daraja dashboard |
| Consumer Secret | Like a password for API calls | Your Daraja dashboard |
| Shortcode | Your paybill number | Safaricom gives you this |
| Passkey | Secret key for STK Push | Safaricom gives you this |
| Callback URL | Where M-Pesa sends payment updates | Your server (needs HTTPS) |

---

## Setup

### 1. Set Up Your Environment

Add these to your `backend/.env` file:

```env
# M-Pesa Configuration
MPESA_ENVIRONMENT=sandbox                    # sandbox or production
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379                       # Sandbox: 174379, Production: Your paybill
MPESA_PASSKEY=your_passkey                   # Sandbox passkey provided
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback

# B2C Configuration (for supplier payouts)
MPESA_B2C_SHORTCODE=600000                   # Your B2C shortcode
MPESA_B2C_INITIATOR_NAME=testapi             # Initiator name
MPESA_B2C_SECURITY_CREDENTIAL=your_credential
MPESA_B2C_RESULT_URL=https://your-domain.com/api/payments/b2c/result
MPESA_B2C_TIMEOUT_URL=https://your-domain.com/api/payments/b2c/timeout
```

### 2. Testing Credentials

Safaricom gives you these for testing:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
```

**Test Phone:** `254708374149` - this number auto-approves payments in sandbox

### 3. Testing Locally with ngrok

M-Pesa needs to reach your server with HTTPS. Since you're on localhost, use ngrok:

```bash
# Install it
brew install ngrok  # macOS, or grab from ngrok.com

# Start the tunnel
ngrok http 5000

# You'll get a URL like https://abc123.ngrok-free.app
# Copy that and update your .env:
MPESA_CALLBACK_URL=https://abc123.ngrok-free.app/api/payments/mpesa/callback

# Restart your Flask server
cd backend
source venv/bin/activate
python run.py
```

---

## How to Use the API

### Paying for Orders

#### Start a Payment

```http
POST /api/payments/mpesa/initiate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "order_id": "uuid",
  "phone_number": "0712345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK Push sent successfully",
  "data": {
    "checkout_request_id": "ws_CO_01012024120000000712345678",
    "merchant_request_id": "12345-67890-1",
    "customer_message": "Please check your phone and enter your M-Pesa PIN"
  }
}
```

#### Check if Payment Went Through

```http
POST /api/payments/mpesa/query
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "order_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "payment_reference": "QGH7X8Y9Z0",
    "payment_status": "completed"
  }
}
```

#### Quick Payment Check

```http
GET /api/payments/verify/<order_id>
Authorization: Bearer <jwt_token>
```

#### M-Pesa Calls This (Webhook)

When payment completes, M-Pesa hits this endpoint automatically:

```http
POST /api/payments/mpesa/callback
Content-Type: application/json

{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "12345-67890-1",
      "CheckoutRequestID": "ws_CO_01012024120000000712345678",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 1000},
          {"Name": "MpesaReceiptNumber", "Value": "QGH7X8Y9Z0"},
          {"Name": "PhoneNumber", "Value": 254712345678}
        ]
      }
    }
  }
}
```

### Paying Suppliers (Admin Only)

#### Send Money to a Supplier

```http
POST /api/payments/supplier/payout
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "supplier_id": "uuid",
  "amount": 5000.00,
  "notes": "Weekly payout for orders #123-#145"
}
```

#### See All Payouts

```http
GET /api/payments/supplier/payouts?page=1&per_page=20&status=completed
Authorization: Bearer <admin_jwt_token>
```

#### Update Supplier's M-Pesa Number

```http
PUT /api/payments/supplier/<supplier_id>/update-mpesa
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "mpesa_number": "0712345678",
  "reason": "Supplier requested change"
}
```

---

## Testing

### Quick Test Scripts

```bash
cd backend
python test_mpesa_payment.py
```

### 2. Test Callback Handling

```bash
cd backend
python test_mpesa_callback.py
```

### Try It Manually

**Step 1:** Create an order on the frontend

**Step 2:** Send a payment request:
```bash
curl -X POST http://localhost:5000/api/payments/mpesa/initiate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "your-order-uuid",
    "phone_number": "254708374149"
  }'
```

**Step 3:** Check your phone for the M-Pesa prompt (in sandbox it auto-completes)

**Step 4:** Check if it worked:
```bash
curl -X POST http://localhost:5000/api/payments/mpesa/query \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "your-order-uuid"}'
```

### Using It in Your Frontend

Here's how to handle payments in React/JavaScript:

```javascript
// Start the payment
const initiatePayment = async (orderId, phoneNumber) => {
  try {
    const response = await axios.post('/api/payments/mpesa/initiate', {
      order_id: orderId,
      phone_number: phoneNumber
    });
    
    if (response.data.success) {
      // Now keep checking if they paid
      pollPaymentStatus(orderId);
    }
  } catch (error) {
    console.error('Payment failed:', error);
  }
};

// Check every 5 seconds if payment completed
const pollPaymentStatus = async (orderId) => {
  const maxAttempts = 24; // Give them 2 minutes
  let attempts = 0;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const response = await axios.post('/api/payments/mpesa/query', {
        order_id: orderId
      });
      
      if (response.data.data.status === 'completed') {
        clearInterval(interval);
        window.location.href = '/order-success';
      } else if (response.data.data.status === 'failed') {
        clearInterval(interval);
        alert('Payment failed. Try again?');
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        alert('Taking too long. Contact support if money was deducted.');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }, 5000);
};
```

---

## When Things Go Wrong

### Common Issues

#### Payments Stuck on "Pending"

**Why:** Your callback URL isn't reachable or ngrok died

**Fix:**
```bash
# Restart ngrok
ngrok http 5000

# Update .env with new URL
MPESA_CALLBACK_URL=https://new-url.ngrok-free.app/api/payments/mpesa/callback

# Restart Flask
python run.py
```

**Better approach:** Don't rely on callbacks - use polling instead (see frontend example above)

#### "Invalid Access Token" Error

**Why:** Wrong credentials or token expired

**Fix:**
- Double-check your keys in `.env`
- Make sure you copied them right from Daraja
- Wait a minute and try again (tokens refresh automatically)

#### "Invalid Phone Number" Error

**Why:** Phone format is wrong

**Fix:**
- Use this format: `254XXXXXXXXX` (12 digits total)
- Remove spaces, dashes, and plus signs
- Must start with `2547`, `2541`, or `2542`

#### Sandbox Callbacks Not Working

**Why:** Sandbox is flaky sometimes

**Fix:**
- Use polling in your frontend (recommended anyway)
- Hit the query endpoint every 5 seconds
- Don't trust sandbox callbacks for production code

#### "Insufficient Permissions" Error

**Why:** Wrong shortcode or passkey

**Fix:**
- Make sure shortcode matches your app
- Check passkey is correct
- For production, call Safaricom to verify

### Quick Debug Steps

```bash
# 1. Check your environment variables are set
grep MPESA backend/.env

# 2. Make sure ngrok is accessible
curl https://your-ngrok-url.ngrok-free.app/api/health

# 3. Look at Flask logs for "M-Pesa callback RAW:" messages

# 4. Test callback manually
cd backend
python test_mpesa_callback.py

# 5. Check payment status directly
curl -X POST http://localhost:5000/api/payments/mpesa/query \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "ORDER_ID"}'
```

### Turn On Detailed Logging

The service already logs everything:
- When it gets access tokens
- STK Push requests and responses
- Raw callback data
- Payment updates
- Any errors

Just watch your Flask terminal output.

---

## Going Live

### Get Production Credentials

1. Apply for production on Daraja (takes a few days)
2. Do their KYC thing
3. Get your real credentials
4. Get your actual paybill number

### Set Up Production Config

```env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_paybill_number
MPESA_PASSKEY=your_production_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
```

### You Need HTTPS

M-Pesa won't talk to HTTP. Get a free SSL certificate:

```bash
# Free SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Whitelist Your Server

Call Safaricom and give them your server's IP address.

### Update Daraja Settings

1. Log into Daraja
2. Go to your production app
3. Update these URLs:
   - STK Callback: `https://yourdomain.com/api/payments/mpesa/callback`
   - B2C Result: `https://yourdomain.com/api/payments/b2c/result`
   - B2C Timeout: `https://yourdomain.com/api/payments/b2c/timeout`

### 6. Test in Production

```bash
# Make a small test payment (KES 1)
curl -X POST https://yourdomain.com/api/payments/mpesa/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-order-id",
    "phone_number": "254712345678"
  }'
```

### 7. Monitoring

Set up monitoring for:
- Payment success rate
- Callback receipt rate
- Failed transactions
- Average payment time

```python
# Add to your monitoring dashboard
- Total payments initiated
- Successful payments
- Failed payments
- Pending payments > 5 minutes
- Callback failures
```

---

## Phone Number Formats

We handle phone numbers automatically. These all work:

```python
# All these become "254712345678":
"0712345678"
"712345678"
"254712345678"
"+254712345678"

# Valid networks:
- Safaricom: 07XX
- Airtel: 01XX, 02XX
- Telkom: 07XX
```

---

## Keep Your Stuff Safe

1. **Don't commit credentials** - use .env files
2. **Verify callbacks** - make sure they're really from Safaricom
3. **Use HTTPS** - required for production anyway
4. **Log everything** - you'll thank yourself later
5. **Handle failures** - retry failed payments
6. **Rate limit** - don't let people spam your API
7. **Watch for weird stuff** - alert on suspicious patterns

---

## Response Codes You'll See

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Insufficient funds |
| 1032 | User cancelled transaction |
| 1037 | Timeout - user didn't enter PIN |
| 2001 | Invalid initiator credentials |
| 500.001.1001 | Invalid phone number |

---

## Support

### Safaricom Support
- Email: apisupport@safaricom.co.ke
- Portal: https://developer.safaricom.co.ke/support

### Documentation
- [Daraja API Docs](https://developer.safaricom.co.ke/Documentation)
- [STK Push Guide](https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate)
- [B2C Guide](https://developer.safaricom.co.ke/APIs/BusinessToCustomer)

### Internal Documentation
- [Backend README](backend/README.md)

---

## Questions?

**Q: Can I test without a Safaricom line?**  
A: Yep, use sandbox with test number `254708374149`

**Q: How long does the payment prompt last?**  
A: 60 seconds - they gotta enter their PIN fast

**Q: Can I use M-Pesa outside Kenya?**  
A: Nope, Kenya only. Use card payments for international customers

**Q: What's the max amount?**  
A: Sandbox: KES 70,000 | Production: depends on your paybill limits

**Q: How do refunds work?**  
A: Use B2C to send money back to their M-Pesa

**Q: Can I test B2C in sandbox?**  
A: Yes, but callbacks might be flaky

---

## Changelog

### v1.0.0 (Current)
- STK Push payment integration
- B2C supplier payouts
- Callback handling
- Payment status polling
- Phone number validation
- Comprehensive error handling
- Production-ready logging
