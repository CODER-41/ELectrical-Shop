# Quantum Gear Electronics — Backend API

Flask-based REST API powering the Quantum Gear Electronics multi-vendor e-commerce platform. Provides 80+ endpoints for authentication, product management, orders, payments (M-Pesa & Paystack), returns, supplier management, delivery tracking, and admin operations.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Services](#services)
- [Utilities & Decorators](#utilities--decorators)
- [Migration Scripts](#migration-scripts)
- [Running](#running)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Runtime |
| Flask | 3.0+ | Web framework |
| PostgreSQL | 14+ | Database |
| SQLAlchemy | 2.0+ | ORM |
| Flask-JWT-Extended | 4.6+ | JWT authentication |
| Flask-Migrate | 4.0+ | Database migrations (Alembic) |
| Flask-Mail | 0.9+ | Email service (SMTP/Gmail) |
| Flask-CORS | 4.0+ | Cross-origin requests |
| Cloudinary | 1.36+ | Image uploads |
| APScheduler | 3.10+ | Background job scheduling |
| Gunicorn | 21.0+ | Production WSGI server |
| bcrypt | 4.1+ | Password hashing |
| PyJWT | 2.8+ | JWT encoding |
| pyotp | 2.9+ | TOTP two-factor auth |
| psycopg2-binary | 2.9+ | PostgreSQL adapter |
| requests | 2.31+ | HTTP client (M-Pesa, Paystack) |

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py              # App factory (create_app)
│   ├── config/
│   │   └── config.py            # Dev/Prod/Test configuration
│   ├── models/
│   │   ├── user.py              # User, CustomerProfile, SupplierProfile, etc.
│   │   ├── product.py           # Product, Category, Brand
│   │   ├── order.py             # Order, OrderItem, DeliveryZone
│   │   ├── cart.py              # Cart, CartItem
│   │   ├── returns.py           # Return, SupplierPayout, ReturnStatus
│   │   ├── address.py           # Address
│   │   ├── session.py           # Session
│   │   ├── notification.py      # Notification
│   │   ├── otp.py               # OTP
│   │   └── audit_log.py         # AuditLog
│   ├── routes/
│   │   ├── auth.py              # Authentication (20 endpoints)
│   │   ├── products.py          # Products (9 endpoints)
│   │   ├── cart.py              # Shopping cart (7 endpoints)
│   │   ├── orders.py            # Orders & addresses (12 endpoints)
│   │   ├── payments.py          # Payments (15 endpoints)
│   │   ├── returns.py           # Returns (5 endpoints)
│   │   ├── supplier.py          # Supplier portal (10 endpoints)
│   │   ├── supplier_terms.py    # Supplier terms (3 endpoints)
│   │   ├── admin.py             # Admin management (10+ endpoints)
│   │   ├── delivery.py          # Delivery agent (8+ endpoints)
│   │   ├── uploads.py           # Image uploads (6 endpoints)
│   │   └── contact.py           # Contact form (2 endpoints)
│   ├── services/
│   │   ├── email_service.py     # Transactional emails
│   │   ├── mpesa_service.py     # M-Pesa Daraja API
│   │   ├── paystack_service.py  # Paystack card payments
│   │   ├── google_oauth_service.py  # Google OAuth 2.0
│   │   ├── cloudinary_service.py    # Image uploads
│   │   ├── notification_service.py  # In-app notifications
│   │   └── scheduler_service.py     # Background jobs
│   └── utils/
│       ├── responses.py         # success_response, error_response
│       ├── validation.py        # Email, phone, password validation
│       └── decorators.py        # Role-based access decorators
├── migrations/                  # Alembic migration files
├── .env.example                 # Environment variable template
├── requirements.txt             # Python dependencies
├── run.py                       # Application entry point
├── seed_all.py                  # Database seeder
└── README.md                    # This file
```

---

## Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Create database
sudo -u postgres createdb electronics_shop

# Run migrations
export FLASK_APP=run.py
flask db upgrade

# Seed sample data
python seed_all.py

# Start development server
python run.py
```

The API runs at `http://localhost:5000` by default.

---

## Environment Variables

See [.env.example](.env.example) for the full template. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | (required) |
| `FLASK_ENV` | Environment (development/production) | development |
| `DATABASE_URL` | PostgreSQL connection string | (required) |
| `JWT_SECRET_KEY` | JWT signing key | (required) |
| `JWT_ACCESS_TOKEN_EXPIRES` | Access token TTL (seconds) | 900 (15 min) |
| `JWT_REFRESH_TOKEN_EXPIRES` | Refresh token TTL (seconds) | 604800 (7 days) |
| `MAIL_SERVER` | SMTP server | smtp.gmail.com |
| `MAIL_PORT` | SMTP port | 587 |
| `MAIL_USERNAME` | SMTP email address | (required for email) |
| `MAIL_PASSWORD` | SMTP app password | (required for email) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | (required for uploads) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | (required for uploads) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | (required for uploads) |
| `FRONTEND_URL` | Frontend origin for CORS | http://localhost:5173 |
| `BACKEND_URL` | Backend base URL | http://localhost:5000 |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | (required for OAuth) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | (required for OAuth) |
| `MPESA_CONSUMER_KEY` | Daraja API consumer key | (required for M-Pesa) |
| `MPESA_CONSUMER_SECRET` | Daraja API consumer secret | (required for M-Pesa) |
| `MPESA_SHORTCODE` | Business short code | 174379 (sandbox) |
| `MPESA_PASSKEY` | STK Push passkey | (required for M-Pesa) |
| `MPESA_CALLBACK_URL` | Payment callback URL | (required for M-Pesa) |
| `MPESA_ENVIRONMENT` | sandbox or production | sandbox |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | (required for cards) |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | (required for cards) |
| `WEB3FORMS_ACCESS_KEY` | Contact form API key | (optional) |

---

## Database Models

### User Models (`models/user.py`)

| Model | Description |
|-------|-------------|
| **User** | Base user with email, password, OAuth provider, role, 2FA |
| **CustomerProfile** | Customer-specific info (linked to User) |
| **SupplierProfile** | Supplier info — approval status, payout method, earnings |
| **AdminProfile** | Admin/manager profile |
| **DeliveryAgentProfile** | Delivery agent with earnings and payout tracking |
| **DeliveryCompany** | Third-party delivery company |

**Enums:**
- `UserRole`: CUSTOMER, SUPPLIER, ADMIN, PRODUCT_MANAGER, FINANCE_ADMIN, SUPPORT_ADMIN, DELIVERY_AGENT
- `AuthProvider`: LOCAL, GOOGLE

### Product Models (`models/product.py`)

| Model | Description |
|-------|-------------|
| **Category** | Product categories with suggested specs |
| **Brand** | Brands with logos |
| **Product** | Product details — price, stock, commission, warranty, slug |

**Enums:**
- `ProductCondition`: NEW, REFURBISHED

### Order Models (`models/order.py`)

| Model | Description |
|-------|-------------|
| **Order** | Order with delivery, payment, and status tracking |
| **OrderItem** | Individual items in an order (with supplier_id) |
| **DeliveryZone** | Delivery zone with fee and estimated days |

**Enums:**
- `OrderStatus`: PENDING, PAID, PROCESSING, QUALITY_APPROVED, SHIPPED, OUT_FOR_DELIVERY, ARRIVED, DELIVERED, CANCELLED, RETURNED
- `PaymentMethod`: MPESA, CARD, CASH
- `PaymentStatus`: PENDING, COMPLETED, FAILED, REFUNDED

### Return Model (`models/returns.py`)

| Model | Description |
|-------|-------------|
| **Return** | Return request with supplier participation and refund tracking |
| **SupplierPayout** | Supplier payment records |

**Enums:**
- `ReturnStatus`: REQUESTED, PENDING, PENDING_REVIEW, SUPPLIER_REVIEW, APPROVED, REJECTED, DISPUTED, REFUND_COMPLETED, COMPLETED, CANCELLED

### Other Models

| Model | File | Description |
|-------|------|-------------|
| **Cart / CartItem** | `cart.py` | Shopping cart per user |
| **Address** | `address.py` | Delivery addresses |
| **Session** | `session.py` | User session tracking |
| **Notification** | `notification.py` | In-app notifications |
| **OTP** | `otp.py` | One-time passwords for verification |
| **AuditLog** | `audit_log.py` | Action logging for compliance |

---

## API Endpoints

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login (returns access + refresh tokens) |
| POST | `/auth/refresh` | Refresh | Refresh access token |
| GET | `/auth/me` | Yes | Get current user profile |
| POST | `/auth/logout` | Yes | Logout (revoke token) |
| POST | `/auth/send-otp` | No | Send OTP email |
| POST | `/auth/verify-otp` | No | Verify OTP code |
| POST | `/auth/forgot-password` | No | Request password reset |
| POST | `/auth/reset-password` | No | Reset password with token |
| POST | `/auth/verify-email` | No | Verify email address |
| POST | `/auth/resend-verification` | No | Resend verification email |
| POST | `/auth/enable-2fa` | Yes | Enable two-factor auth |
| POST | `/auth/verify-2fa` | Yes | Verify 2FA code |
| POST | `/auth/disable-2fa` | Yes | Disable two-factor auth |
| POST | `/auth/change-password` | Yes | Change password |
| GET | `/auth/google` | No | Initiate Google OAuth |
| GET | `/auth/google/callback` | No | Google OAuth callback |
| POST | `/auth/google/token` | No | Google token authentication |
| POST | `/auth/set-password` | Yes | Set password (OAuth users) |
| PUT | `/auth/profile` | Yes | Update user profile |
| POST | `/auth/complete-profile` | Yes | Complete profile setup |

### Products (`/api/products`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products` | No | List products (paginated, filterable) |
| GET | `/products/<id>` | No | Get product by ID |
| GET | `/products/slug/<slug>` | No | Get product by slug |
| POST | `/products` | Supplier | Create product |
| PUT | `/products/<id>` | Supplier | Update product |
| DELETE | `/products/<id>` | Supplier | Delete product |
| GET | `/products/categories` | No | List all categories |
| GET | `/products/brands` | No | List all brands |
| GET | `/products/delivery-zones` | No | List delivery zones |

**Query Parameters for GET `/products`:**
- `page`, `per_page` — Pagination
- `category`, `brand` — Filter by category/brand
- `search` — Full-text search
- `min_price`, `max_price` — Price range
- `condition` — NEW or REFURBISHED
- `in_stock` — Stock availability
- `sort_by` — Sort field

### Shopping Cart (`/api/cart`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/cart` | Customer | Get cart contents |
| POST | `/cart/items` | Customer | Add item to cart |
| PUT | `/cart/items/<id>` | Customer | Update item quantity |
| DELETE | `/cart/items/<id>` | Customer | Remove item from cart |
| DELETE | `/cart/clear` | Customer | Clear entire cart |
| GET | `/cart/validate` | Customer | Validate cart (stock check) |
| GET | `/cart/count` | Customer | Get cart item count |

### Orders (`/api/orders`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/orders` | Customer | Create order |
| GET | `/orders` | Yes | List orders (role-scoped) |
| GET | `/orders/<id>` | Yes | Get order details |
| PUT | `/orders/<id>/status` | Admin | Update order status |
| PUT | `/orders/<id>/payment` | Admin | Update payment status |
| POST | `/orders/<id>/cancel` | Customer | Cancel order |
| GET | `/orders/addresses` | Customer | List delivery addresses |
| POST | `/orders/addresses` | Customer | Create address |
| PUT | `/orders/addresses/<id>` | Customer | Update address |
| DELETE | `/orders/addresses/<id>` | Customer | Delete address |
| GET | `/orders/delivery-zones` | No | List delivery zones |
| POST | `/orders/delivery-zones/calculate` | No | Calculate delivery fee |

### Payments (`/api/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/mpesa/initiate` | Customer | Initiate M-Pesa STK Push |
| POST | `/payments/mpesa/callback` | No | M-Pesa payment callback (Safaricom) |
| POST | `/payments/mpesa/query` | Customer | Query M-Pesa transaction status |
| GET | `/payments/status/<order_id>` | Yes | Check payment status |
| GET | `/payments/verify/<order_id>` | Yes | Verify payment completion |
| POST | `/payments/cash/confirm` | Admin | Confirm cash on delivery |
| POST | `/payments/card/initiate` | Customer | Initiate Paystack card payment |
| POST | `/payments/card/verify` | Customer | Verify Paystack payment |
| POST | `/payments/card/webhook` | No | Paystack webhook handler |
| GET | `/payments/methods` | No | List available payment methods |
| POST | `/payments/supplier/payout` | Admin | Initiate supplier B2C payout |
| POST | `/payments/b2c/result` | No | B2C result callback |
| POST | `/payments/b2c/timeout` | No | B2C timeout callback |
| GET | `/payments/supplier/payouts` | Supplier | List supplier payouts |
| PUT | `/payments/supplier/<id>/update-mpesa` | Supplier | Update M-Pesa number |

### Returns (`/api/returns`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/returns` | Customer | Create return request |
| GET | `/returns` | Yes | List returns (role-scoped) |
| GET | `/returns/<id>` | Yes | Get return details |
| PUT | `/returns/<id>/review` | Admin | Approve or reject return |
| PUT | `/returns/<id>/status` | Admin | Update return status |
| GET | `/returns/stats` | Admin/Supplier | Return statistics |

### Supplier Portal (`/api/supplier`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/supplier/dashboard` | Supplier | Dashboard stats (orders, revenue, returns) |
| GET | `/supplier/returns` | Supplier | List returns for supplier's products |
| GET | `/supplier/returns/stats` | Supplier | Return statistics for supplier |
| GET | `/supplier/returns/<id>` | Supplier | Get return detail |
| POST | `/supplier/returns/<id>/acknowledge` | Supplier | Acknowledge return request |
| POST | `/supplier/returns/<id>/respond` | Supplier | Accept or dispute return |
| GET | `/supplier/terms` | Supplier | View platform terms |
| POST | `/supplier/terms/accept` | Supplier | Accept terms |
| GET | `/supplier/terms/status` | Supplier | Check terms acceptance |

### Admin Management (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/dashboard` | Admin | Platform-wide dashboard stats |
| GET | `/admin/analytics` | Admin | Analytics data |
| PUT | `/admin/returns/<id>/approve` | Admin | Approve return |
| PUT | `/admin/returns/<id>/reject` | Admin | Reject return |
| POST | `/admin/returns/<id>/process-refund` | Admin | Process refund |
| GET | `/admin/returns/analytics` | Admin | Returns analytics |
| GET | `/admin/reports/financial` | Finance | Financial reports |

### Delivery (`/api/delivery`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/delivery/dashboard` | Delivery | Agent dashboard |
| GET | `/delivery/orders` | Delivery | Assigned deliveries |
| GET | `/delivery/payouts` | Delivery | Earnings history |

### Image Uploads (`/api/uploads`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/uploads/product` | Supplier | Upload product image |
| POST | `/uploads/return` | Customer | Upload return evidence |
| POST | `/uploads/brand` | Admin | Upload brand logo |
| POST | `/uploads/profile` | Yes | Upload profile photo |
| POST | `/uploads/signature` | Yes | Get Cloudinary upload signature |
| DELETE | `/uploads/delete` | Yes | Delete uploaded image |

### Contact (`/api/contact`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/contact` | No | Submit contact form |
| GET | `/contact/info` | No | Get contact information |

---

## Services

| Service | File | Description |
|---------|------|-------------|
| **Email** | `email_service.py` | Send OTP, welcome, order confirmation, shipping, delivery, payment, and cancellation emails via SMTP |
| **M-Pesa** | `mpesa_service.py` | Daraja API integration — STK Push, B2C payouts, phone validation, status queries |
| **Paystack** | `paystack_service.py` | Card payment initialization, verification, and webhook handling |
| **Google OAuth** | `google_oauth_service.py` | Authorization URL generation, token exchange, user info retrieval |
| **Cloudinary** | `cloudinary_service.py` | Image upload (product, return, brand, profile), deletion, signature generation |
| **Notifications** | `notification_service.py` | In-app notification management |
| **Scheduler** | `scheduler_service.py` | Background job scheduling (automated payouts, confirmations) |

---

## Utilities & Decorators

### Response Helpers (`utils/responses.py`)
- `success_response(data, message, status_code)` — Standardized success JSON
- `error_response(message, status_code)` — Standardized error JSON

### Validation (`utils/validation.py`)
- `validate_email(email)` — Email format validation
- `validate_phone_number(phone)` — Kenyan phone number validation (254 format)
- `validate_password(password)` — Strength check (8+ chars, uppercase, lowercase, digit)
- `@validate_required_fields(['field1', 'field2'])` — Decorator for required fields

### Access Control Decorators (`utils/decorators.py`)
- `@admin_required` — Admin only
- `@admin_or_manager_required` — Admin or any manager role
- `@supplier_required` — Approved suppliers only
- `@supplier_or_admin_required` — Supplier or admin
- `@customer_required` — Customers only
- `@verified_required` — Email-verified users only
- `@finance_admin_required` — Finance admin only
- `@support_admin_required` — Support admin only
- `@product_manager_required` — Product manager only
- `@role_required(*roles)` — Generic role-based decorator

---

## Migration Scripts

Additional migration scripts in the backend root for schema changes:

| Script | Purpose |
|--------|---------|
| `migrate_db.py` | General database migration utilities |
| `add_supplier_terms_fields.py` | Add supplier terms and conditions fields |
| `add_refund_policy_fields.py` | Add refund policy fields to returns |
| `add_supplier_returns_fields.py` | Add supplier return participation fields |
| `create_notifications_table.py` | Create notifications table |
| `fix_delivery_zones.py` | Fix delivery zone data |
| `fix_suppliers.py` | Fix supplier profile data |
| `seed_returns.py` | Seed return reasons and policies |

Run with: `python <script_name>.py`

---

## Running

### Development
```bash
source venv/bin/activate
python run.py
# Runs on http://localhost:5000 with debug enabled
```

### Production
```bash
gunicorn run:app --bind 0.0.0.0:$PORT --workers 4
```

### Health Check
```
GET /api/health → { "status": "healthy" }
```
