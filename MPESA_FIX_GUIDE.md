# M-Pesa Payment Fix - Quick Implementation Guide

## Problem Summary
M-Pesa payments are stuck in "pending" status because callbacks from Safaricom are not reaching your local server.

## Immediate Solution (5 minutes)

### Step 1: Ensure ngrok is Running
```bash
# In a new terminal
ngrok http 5000

# Copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)
```

### Step 2: Update Backend .env
```bash
cd backend
nano .env

# Update this line with your ngrok URL:
MPESA_CALLBACK_URL=https://YOUR-NGROK-URL.ngrok-free.app/api/payments/mpesa/callback

# Save and exit (Ctrl+X, Y, Enter)
```

### Step 3: Restart Backend
```bash
# Stop your Flask app (Ctrl+C)
# Start it again
python run.py
```

### Step 4: Test the Setup
```bash
# Run the diagnostic tool
python test_mpesa_callback.py
```

## Frontend Implementation (Already Done)

The payment hook has been updated with polling functionality. Here's how to use it:

### In Your Checkout Component:

```javascript
import { usePayment } from '../hooks/usePayment';

const CheckoutPage = () => {
  const { initiateMpesaPayment, pollMpesaStatus } = usePayment();
  
  const handlePayment = async () => {
    // 1. Initiate payment
    const result = await initiateMpesaPayment(orderId, phoneNumber);
    
    if (result.success) {
      // 2. Start polling for status
      const stopPolling = pollMpesaStatus(
        orderId,
        (status, data) => {
          if (status === 'completed') {
            // Payment successful!
            navigate('/order-success');
          } else if (status === 'failed') {
            // Payment failed
            toast.error('Payment failed');
          }
        }
      );
    }
  };
  
  return (
    // Your checkout UI
  );
};
```

## Testing

### Test 1: Check Callback URL
```bash
cd backend
python test_mpesa_callback.py
```

Expected output:
```
✅ MPESA_CALLBACK_URL: https://...
✅ Callback URL is accessible!
```

### Test 2: Make a Test Payment
1. Create an order
2. Initiate M-Pesa payment
3. Check your phone for STK push
4. Enter PIN
5. Watch the logs:

```bash
# In your Flask terminal, you should see:
INFO: M-Pesa callback RAW: ...
INFO: Payment COMPLETED for order ...
```

### Test 3: Simulate Callback (if callback not working)
```bash
# Get CheckoutRequestID from payment initiation
# Then run:
python test_mpesa_callback.py ws_CO_01012024120000000712345678
```

## Troubleshooting

### Issue: "Callback URL not accessible"
**Solution:** 
- Check if ngrok is running: `ps aux | grep ngrok`
- Restart ngrok: `ngrok http 5000`
- Update .env with new URL
- Restart Flask app

### Issue: "Payment still pending after 2 minutes"
**Solution:**
- Check Flask logs for callback receipt
- Manually query status:
```bash
curl -X POST http://localhost:5000/api/payments/mpesa/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_id": "YOUR_ORDER_ID"}'
```

### Issue: "ngrok URL keeps changing"
**Solution:**
- Use ngrok with auth token for persistent URLs
- Or deploy to a server with permanent domain

## Production Deployment

For production, you need a permanent callback URL:

1. **Deploy to a server** (AWS, DigitalOcean, etc.)
2. **Get a domain** (e.g., api.yourshop.com)
3. **Enable HTTPS** (use Let's Encrypt)
4. **Update M-Pesa dashboard** with permanent callback URL
5. **Test thoroughly** before going live

## Files Modified

✅ Backend:
- `/backend/app/routes/payments.py` - Enhanced callback logging and query endpoint
- `/backend/test_mpesa_callback.py` - New diagnostic tool
- `/backend/MPESA_TROUBLESHOOTING.md` - Detailed troubleshooting guide

✅ Frontend:
- `/frontend/electricalshop-app/src/hooks/usePayment.js` - Added polling functions
- `/frontend/electricalshop-app/src/components/MpesaPaymentExample.jsx` - Usage example

## Next Steps

1. ✅ Run diagnostic tool
2. ✅ Update callback URL in .env
3. ✅ Restart backend
4. ✅ Test with real payment
5. ✅ Implement polling in your checkout component
6. ⏳ Deploy to production with permanent URL

## Support

If issues persist:
1. Check logs: `tail -f backend/logs/app.log`
2. Review troubleshooting guide: `MPESA_TROUBLESHOOTING.md`
3. Test callback manually: `python test_mpesa_callback.py <CheckoutRequestID>`

---

**Key Takeaway:** The polling mechanism ensures payments are confirmed even if callbacks fail. Your frontend will now actively check payment status every 5 seconds for up to 2 minutes.
