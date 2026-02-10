# M-Pesa Payment Callback Troubleshooting Guide

## Problem: Payments Stuck in "Pending" Status

When M-Pesa payments remain in "pending" status instead of "completed", it means the callback from Safaricom is not reaching your server or not being processed correctly.

---

## Common Causes & Solutions

### 1. **Callback URL Not Accessible**

**Problem:** Your ngrok tunnel expired or is not running.

**Solution:**
```bash
# Start ngrok (in a separate terminal)
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
# Update your .env file:
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/payments/mpesa/callback

# Restart your Flask app
```

**Test it:**
```bash
cd backend
python test_mpesa_callback.py
```

---

### 2. **Using Sandbox Environment**

**Problem:** M-Pesa sandbox has restrictions and may not send callbacks reliably.

**Solution:**
- Use the query endpoint to manually check payment status
- Frontend should poll `/api/payments/mpesa/query` every 5 seconds
- After 60 seconds, show option to manually verify

---

### 3. **Callback Not Registered with Safaricom**

**Problem:** The callback URL in your M-Pesa dashboard doesn't match your .env file.

**Solution:**
1. Log into Safaricom Daraja Portal
2. Go to your app settings
3. Update the callback URL to match your ngrok URL
4. For production, use a permanent domain

---

### 4. **Frontend Not Polling Status**

**Problem:** Frontend waits for callback but doesn't actively check status.

**Solution:** Implement polling in your frontend:

```javascript
// After initiating payment
const pollPaymentStatus = async (orderId) => {
  const maxAttempts = 24; // 2 minutes (24 * 5 seconds)
  let attempts = 0;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const response = await axios.post('/api/payments/mpesa/query', {
        order_id: orderId
      });
      
      if (response.data.data.status === 'completed') {
        clearInterval(interval);
        // Show success message
        navigate('/order-success');
      } else if (response.data.data.status === 'failed') {
        clearInterval(interval);
        // Show error message
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        // Show timeout message
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }, 5000); // Check every 5 seconds
};
```

---

## Quick Diagnostic Steps

### Step 1: Check Environment Variables
```bash
cd backend
grep MPESA .env
```

Ensure you have:
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL` (must be HTTPS and publicly accessible)

### Step 2: Test Callback URL
```bash
cd backend
python test_mpesa_callback.py
```

### Step 3: Check Application Logs
```bash
# In your Flask terminal, look for:
# - "M-Pesa callback RAW: ..." (callback received)
# - "Payment COMPLETED for order ..." (payment processed)
# - Any error messages
```

### Step 4: Manually Query Payment Status
```bash
# Use the query endpoint
curl -X POST http://localhost:5000/api/payments/mpesa/query \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "YOUR_ORDER_ID"}'
```

---

## Testing Locally Without Ngrok

If you can't use ngrok, you can simulate callbacks:

```bash
# Get the CheckoutRequestID from your payment initiation response
# Then simulate a successful callback:
python test_mpesa_callback.py ws_CO_01012024120000000712345678
```

---

## Production Deployment Checklist

For production, you need a permanent callback URL:

1. **Deploy to a server with a domain**
   - AWS EC2, DigitalOcean, Heroku, etc.
   - Must have HTTPS (use Let's Encrypt)

2. **Update M-Pesa Dashboard**
   - Set callback URL to: `https://yourdomain.com/api/payments/mpesa/callback`

3. **Whitelist Your IP** (if required by Safaricom)
   - Contact Safaricom support
   - Provide your server's public IP

4. **Test in Production**
   - Make a small test payment (KES 1)
   - Monitor logs for callback receipt

---

## Monitoring & Debugging

### Enable Detailed Logging

The updated code now logs:
- Raw callback data
- Parsed callback details
- Order updates
- Any errors

Check logs:
```bash
# If using systemd
sudo journalctl -u your-flask-app -f

# If running directly
# Check your terminal output
```

### Database Check

Manually check order status:
```sql
-- Connect to your database
psql -U postgres -d electronics_shop

-- Check order payment status
SELECT 
  order_number, 
  payment_status, 
  payment_reference, 
  paid_at,
  admin_notes
FROM orders 
WHERE order_number = 'YOUR_ORDER_NUMBER';
```

---

## Alternative: Manual Payment Verification

If callbacks continue to fail, implement manual verification:

1. Customer completes M-Pesa payment
2. Customer enters M-Pesa receipt number
3. Admin verifies payment manually
4. Admin marks order as paid

This is a fallback solution but ensures no lost sales.

---

## Need Help?

1. Run the diagnostic tool: `python test_mpesa_callback.py`
2. Check application logs for errors
3. Verify ngrok is running and URL is updated
4. Test with the query endpoint
5. Contact Safaricom support if using production API

---

## Summary

**The main issue:** Callbacks from Safaricom cannot reach your local server.

**Best solution:** 
1. Use ngrok for development
2. Implement frontend polling as backup
3. Use permanent domain for production

**Quick fix:**
Your frontend should call `/api/payments/mpesa/query` every 5 seconds after initiating payment to check status, rather than relying solely on callbacks.
