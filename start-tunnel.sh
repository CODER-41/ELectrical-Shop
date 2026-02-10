#!/bin/bash

echo "=========================================="
echo "Starting LocalTunnel for M-Pesa Callbacks"
echo "=========================================="
echo ""
echo "This will expose your local port 5000 to the internet"
echo "Copy the URL and update it in backend/.env file"
echo ""
echo "MPESA_CALLBACK_URL=https://YOUR-URL-HERE/api/payments/mpesa/callback"
echo "MPESA_B2C_RESULT_URL=https://YOUR-URL-HERE/api/payments/b2c/result"
echo "MPESA_B2C_TIMEOUT_URL=https://YOUR-URL-HERE/api/payments/b2c/timeout"
echo ""
echo "=========================================="
echo ""

lt --port 5000
