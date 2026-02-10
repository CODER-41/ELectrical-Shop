#!/bin/bash

echo "Testing Paystack card payment initialization..."
echo ""
echo "Make sure you:"
echo "1. Have an order created with payment_method='card'"
echo "2. Backend is running on port 5000"
echo "3. You have a valid JWT token"
echo ""
echo "To get a token, login first and copy the token from localStorage"
echo ""
echo "Then run:"
echo 'curl -X POST http://localhost:5000/api/payments/card/initiate \'
echo '  -H "Content-Type: application/json" \'
echo '  -H "Authorization: Bearer YOUR_TOKEN_HERE" \'
echo '  -d '"'"'{"order_id": "YOUR_ORDER_ID_HERE"}'"'"
echo ""
echo "The backend error will show in the terminal where you ran 'python run.py'"
