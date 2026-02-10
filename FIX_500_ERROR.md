# Fix: Payment Initialization Failed (500 Error)

## The Problem
You're getting: `POST http://localhost:5000/api/payments/card/initiate 500 (INTERNAL SERVER ERROR)`

## Most Likely Cause
The backend server is running old code and hasn't picked up the new Paystack integration.

## Solution

### Step 1: Stop the Backend
```bash
# Find the process
ps aux | grep "python.*run.py"

# Kill it (replace PID with actual process ID)
kill -9 72451 72457

# Or press Ctrl+C in the terminal where backend is running
```

### Step 2: Restart the Backend
```bash
cd backend
source venv/bin/activate
python run.py
```

### Step 3: Verify Paystack is Loaded
You should see in the terminal output (no errors about paystack_service)

### Step 4: Test Again
1. Go to checkout
2. Select "Card Payment"
3. Click "Place Order"

---

## Other Possible Issues

### Issue 1: Paystack Keys Not Set
**Check:**
```bash
grep PAYSTACK backend/.env
```

**Should show:**
```
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
```

**Fix:** Add your Paystack keys to `backend/.env`

### Issue 2: Module Not Found
**Error in terminal:** `ModuleNotFoundError: No module named 'requests'`

**Fix:**
```bash
cd backend
source venv/bin/activate
pip install requests
```

### Issue 3: Order Payment Method Not Set
**Check backend terminal for error:** `Order payment method is not card`

**Fix:** Make sure you selected "Card Payment" at checkout before placing order

---

## Debug: See Actual Error

### Method 1: Check Backend Terminal
Look at the terminal where you ran `python run.py` - the actual error will be there

### Method 2: Check Backend Logs
```bash
tail -f backend/backend.log
```

### Method 3: Enable Debug Mode
In `backend/.env`:
```env
FLASK_ENV=development
FLASK_DEBUG=1
```

Then restart backend

---

## Quick Test

After restarting backend, test if Paystack is working:

```bash
# In Python
cd backend
source venv/bin/activate
python3

>>> from app.services.paystack_service import paystack_service
>>> paystack_service.is_configured()
True  # Should return True
```

If this returns `False`, your Paystack keys are not set correctly.

---

## Still Not Working?

1. **Check backend terminal** - The actual error message will be there
2. **Share the error** - Copy the full error from backend terminal
3. **Check .env file** - Make sure Paystack keys are set
4. **Restart everything** - Stop backend, stop frontend, start both again

---

## Expected Flow (When Working)

1. Select "Card Payment" → Click "Place Order"
2. Backend creates order with `payment_method='card'`
3. Backend calls Paystack API to initialize transaction
4. Backend returns `authorization_url`
5. Frontend redirects to Paystack payment page
6. Customer enters card details on Paystack
7. Customer redirected back to your site
8. Payment verified ✅

---

**Most Common Fix:** Just restart the backend server! 🔄
