# Electronics Shop — Detailed Project Summary

## Panel Presentation Guide

---

## 1. Project Overview

**Electronics Shop** is a full-stack, multi-vendor e-commerce platform for buying and selling electronics in Kenya. It connects **customers**, **suppliers**, **delivery agents**, and **administrators** into a single marketplace with integrated mobile money (M-Pesa) and card payments, real-time delivery tracking, and automated financial settlement.

**Live Application**: Deployed on Render.com
**Repository Branch**: `main`

---

## 2. Technology Stack

| Layer             | Technology                                      | Version    |
|-------------------|--------------------------------------------------|------------|
| **Frontend**      | React, Vite, Tailwind CSS                       | 19.2.4, 7.2.4, 3.4.19 |
| **State Mgmt**    | Redux Toolkit                                    | 2.11.2     |
| **Routing**       | React Router                                     | 7.13.0     |
| **HTTP Client**   | Axios                                            | 1.13.4     |
| **Forms**         | React Hook Form                                  | 7.71.1     |
| **Charts**        | Recharts                                         | 3.7.0      |
| **Notifications** | React Toastify                                   | 11.0.5     |
| **Backend**       | Python / Flask                                   | 3.0.0+     |
| **ORM**           | SQLAlchemy                                       | 2.0.0+     |
| **Database**      | PostgreSQL                                       | 14+        |
| **Migrations**    | Flask-Migrate (Alembic)                          | 4.0.0+     |
| **Auth**          | Flask-JWT-Extended (access + refresh tokens)     | 4.6.0+     |
| **2FA**           | pyotp (TOTP-based)                               | 2.9.0+     |
| **OAuth**         | Google OAuth 2.0                                 |            |
| **Payments**      | M-Pesa Daraja API (STK Push), Paystack (cards)  |            |
| **Image Storage** | Cloudinary                                       | 1.36.0+    |
| **Email**         | Flask-Mail (Gmail SMTP)                          | 0.9.1+     |
| **Task Scheduling** | APScheduler                                    | 3.10.0+    |
| **Password Hash** | bcrypt (12 rounds)                               | 4.1.0+     |
| **Deployment**    | Render.com (Gunicorn WSGI server)                | 21.0.0+    |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React/Vite)              │
│  40+ Pages ─ 15+ Components ─ Redux Store ─ Axios   │
│  Port 5173 (dev)                                     │
└──────────────────────┬──────────────────────────────┘
                       │  REST API (JSON)
┌──────────────────────▼──────────────────────────────┐
│                   BACKEND (Flask)                     │
│  12 Blueprints → Services → Models → SQLAlchemy ORM  │
│  Port 5000 ─ App Factory Pattern                     │
│                                                      │
│  External Services:                                  │
│  ├─ M-Pesa Daraja API  (mobile money STK Push)       │
│  ├─ Paystack API        (card payments)              │
│  ├─ Google OAuth 2.0    (social login)               │
│  ├─ Cloudinary          (image uploads & CDN)        │
│  └─ Gmail SMTP          (transactional emails)       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│               PostgreSQL Database                    │
│  21 tables — Users, Products, Orders, Payments, etc. │
└─────────────────────────────────────────────────────┘
```

The backend follows the **App Factory pattern** with **Blueprints** for modular route organization, a **service layer** for business logic, and **SQLAlchemy models** for data access.

### App Factory Pattern

```python
def create_app(config_name=None):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['FRONTEND_URL']}})
    jwt = JWTManager(app)
    migrate = Migrate(app, db)
    mail.init_app(app)

    # Register 12 blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(orders_bp)
    # ... more blueprints

    # Initialize background scheduler
    init_scheduler(app)

    return app
```

---

## 4. Project Directory Structure

```
ELectrical-Shop/
├── backend/                          # Flask REST API
│   ├── app/
│   │   ├── __init__.py               # App factory & blueprint registration
│   │   ├── config/config.py          # Multi-env configuration (Dev/Prod/Test)
│   │   ├── models/                   # 14+ SQLAlchemy models
│   │   │   ├── user.py               # User, CustomerProfile, SupplierProfile
│   │   │   ├── product.py            # Product, Category, Brand
│   │   │   ├── order.py              # Order, OrderItem
│   │   │   ├── cart.py               # Cart, CartItem
│   │   │   ├── returns.py            # Return (refund engine)
│   │   │   ├── delivery.py           # DeliveryZone, DeliveryCompany, Payouts
│   │   │   ├── notification.py       # In-app notifications
│   │   │   ├── audit_log.py          # Admin audit trail
│   │   │   └── otp.py               # OTP for email/password
│   │   ├── routes/                   # 12 blueprint modules (100+ endpoints)
│   │   │   ├── auth.py               # 15 endpoints (43KB)
│   │   │   ├── products.py           # 8 endpoints (15KB)
│   │   │   ├── orders.py             # 15 endpoints (21KB)
│   │   │   ├── payments.py           # 8 endpoints (31KB)
│   │   │   ├── cart.py               # 5 endpoints (11KB)
│   │   │   ├── returns.py            # 6 endpoints (10KB)
│   │   │   ├── supplier.py           # 10 endpoints (23KB)
│   │   │   ├── supplier_terms.py     # 3 endpoints (5KB)
│   │   │   ├── delivery.py           # 20 endpoints (75KB)
│   │   │   ├── admin.py              # 25 endpoints (54KB)
│   │   │   ├── contact.py            # 1 endpoint (4KB)
│   │   │   └── uploads.py            # 3 endpoints (12KB)
│   │   ├── services/                 # Business logic & integrations
│   │   │   ├── email_service.py      # Transactional emails (39KB)
│   │   │   ├── mpesa_service.py      # M-Pesa Daraja API (12KB)
│   │   │   ├── paystack_service.py   # Paystack card payments (6KB)
│   │   │   ├── cloudinary_service.py # Image upload/management (8KB)
│   │   │   ├── google_oauth_service.py # Google OAuth (7KB)
│   │   │   ├── scheduler_service.py  # APScheduler background jobs (11KB)
│   │   │   └── notification_service.py # In-app notifications (10KB)
│   │   ├── utils/                    # Validation, decorators, responses
│   │   ├── templates/                # HTML email templates
│   │   └── dbdiagram/                # Database schema diagrams
│   ├── migrations/                   # Alembic database migrations
│   ├── requirements.txt              # Python dependencies
│   ├── run.py                        # Flask app entry point
│   ├── seed_all.py                   # Database seeding script
│   ├── build.sh                      # Production build for Render
│   └── .env.example                  # Environment template
│
├── frontend/electricalshop-app/      # React SPA
│   ├── src/
│   │   ├── components/               # 15+ reusable UI components
│   │   │   ├── Header.jsx            # Navigation bar
│   │   │   ├── Footer.jsx            # Site footer
│   │   │   ├── ProtectedRoute.jsx    # JWT route guards with role checks
│   │   │   ├── GoogleAuth.jsx        # Google OAuth login button
│   │   │   ├── GoogleCallback.jsx    # OAuth callback handler
│   │   │   ├── ProductCard.jsx       # Product display card
│   │   │   ├── ProductFilter.jsx     # Advanced filtering UI
│   │   │   ├── ProductForm.jsx       # Product creation/editing form
│   │   │   ├── ImageUpload.jsx       # Cloudinary image upload
│   │   │   ├── PaymentPhoneManager.jsx # M-Pesa number management
│   │   │   ├── PaymentProcessing.jsx # Payment status UI
│   │   │   └── LoadingScreen.jsx     # Loading spinner
│   │   ├── pages/                    # 40+ route pages
│   │   │   ├── Home.jsx, About.jsx, ContactUs.jsx, FAQs.jsx
│   │   │   ├── Login.jsx, Register.jsx
│   │   │   ├── Products.jsx, ProductDetail.jsx
│   │   │   ├── Cart.jsx, Checkout.jsx
│   │   │   ├── PaymentCallback.jsx, PaymentVerification.jsx
│   │   │   ├── Orders.jsx, OrderDetail.jsx, OrderConfirmation.jsx
│   │   │   ├── Profile.jsx, EditProfile.jsx, Settings.jsx
│   │   │   ├── Supplier/             # 4 supplier pages
│   │   │   ├── Delivery/             # 3 delivery agent pages
│   │   │   ├── Admin/                # 15 admin pages
│   │   │   └── Returns/              # 3 return pages
│   │   ├── store/                    # Redux Toolkit state
│   │   │   ├── store.js              # Store configuration
│   │   │   └── slices/
│   │   │       ├── authSlice.js      # Auth state (7KB)
│   │   │       ├── productsSlice.js  # Product listing (9KB)
│   │   │       ├── cartSlice.js      # Shopping cart (5KB)
│   │   │       ├── ordersSlice.js    # Orders (12KB)
│   │   │       └── supplierProductsSlice.js # Supplier products (4KB)
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.js            # Auth utilities (1KB)
│   │   │   └── usePayment.js         # Payment workflows (6KB)
│   │   ├── utils/                    # Formatting & validation helpers
│   │   ├── layouts/MainLayout.jsx    # Header + Footer wrapper
│   │   ├── App.jsx                   # Root router (all routes)
│   │   └── main.jsx                  # React entry point
│   ├── package.json                  # Node dependencies
│   ├── vite.config.js                # Vite build configuration
│   ├── tailwind.config.js            # Tailwind CSS theme
│   └── .env.example                  # Frontend environment template
│
├── render.yaml                       # Render.com deployment config
├── setup.sh                          # Full setup script
├── start.sh                          # Start both servers
├── start-backend.sh                  # Backend only
└── start-frontend.sh                 # Frontend only
```

---

## 5. User Roles & Access Control

The platform implements **Role-Based Access Control (RBAC)** with seven roles, enforced at both the backend (JWT claims + route decorators) and frontend (ProtectedRoute component):

| Role               | Description                                             | Access Level       |
|--------------------|---------------------------------------------------------|--------------------|
| **Customer**       | Browse products, place orders, track deliveries, request returns | Standard         |
| **Supplier**       | List products, fulfill orders, view analytics, receive payouts   | Supplier dashboard |
| **Admin**          | Full platform control, user management, financial reports        | Full access        |
| **Product Manager**| Manage products & categories across suppliers            | Product admin      |
| **Finance Admin**  | Manage payouts, financial data, revenue tracking         | Financial admin    |
| **Support Admin**  | Manage orders, handle returns & disputes                 | Support admin      |
| **Delivery Agent** | Handle deliveries, collect COD, upload proof photos      | Delivery dashboard |

### Access Control Implementation

**Backend**: JWT tokens include the user role in claims. Route-level decorators (`@jwt_required`, custom role decorators) enforce access. Each blueprint validates the user's role before processing requests.

**Frontend**: The `ProtectedRoute` component checks the JWT token and user role before rendering protected pages. Unauthorized users are redirected to the login page.

---

## 6. Database Schema (21 Models)

### Core Entity Relationships

```
User ──→ CustomerProfile ──→ Orders ──→ OrderItems ──→ Product
     ──→ SupplierProfile ──→ Products                  ├─ Category
     ──→ AdminProfile                                   └─ Brand
     ──→ DeliveryAgentProfile
     ──→ Addresses (many)
     ──→ Notifications (many)
     ──→ Sessions (many)
     ──→ AuditLogs (many)

Cart ──→ CartItems ──→ Product

Order ──→ DeliveryZone
      ──→ DeliveryAgent / DeliveryCompany
      ──→ Returns ──→ Refund calculations

SupplierProfile ──→ SupplierPayouts
DeliveryAgentProfile ──→ DeliveryPayouts
DeliveryCompany ──→ DeliveryPayouts
DeliveryZone ──→ DeliveryZoneRequests ──→ DeliveryAgentProfile
```

### Detailed Model Descriptions

#### User Management Models

| Model                    | Key Fields                                                                               | Purpose                                   |
|--------------------------|------------------------------------------------------------------------------------------|-------------------------------------------|
| **User**                 | UUID PK, email (unique, indexed), password hash, role (7 enum values), auth_provider (LOCAL/GOOGLE), 2fa_enabled, 2fa_secret, email_verified, profile_picture, last_login | Core identity with authentication         |
| **CustomerProfile**      | user FK (1:1), first/last name, phone (Kenyan format), mpesa_number, default_address FK  | Customer-specific data                    |
| **SupplierProfile**      | user FK (1:1), business_name, registration_number, contact_person, phone, mpesa_number, payout_method, commission_rate (default 0.25), outstanding_balance, total_sales, approval_status, payment_phone_pending, payment_phone_change_status/reason/timestamps | Supplier business details & payouts       |
| **AdminProfile**         | user FK (1:1), first/last name, phone, permissions (JSON)                                | Admin with flexible JSON permissions      |
| **DeliveryAgentProfile** | user FK (1:1), first/last name, phone, national_id, vehicle_type (motorcycle/bicycle/car/on_foot), vehicle_registration, assigned_zones (JSON), availability, partner_type (IN_HOUSE/INDIVIDUAL/COMPANY), mpesa_number, delivery_fee_percentage (default 70%), total_deliveries, cod_collected, earnings, pending_payout | Delivery agent tracking & payouts         |
| **DeliveryCompany**      | name (unique), contact_email/phone, api_key, webhook_url, mpesa_paybill, delivery_fee_percentage (default 80%), settlement_period, minimum_payout, service_zones (JSON) | Third-party delivery partner integration  |
| **Address**              | user FK (M:1), label, full_name, phone, address lines, city, county, postal_code, is_default | Multi-address per user                    |
| **Session**              | user FK (M:1), device_info, ip_address, user_agent, last_activity, expires_at            | Login session tracking                    |

#### Product Catalog Models

| Model        | Key Fields                                                                               | Purpose                                |
|--------------|------------------------------------------------------------------------------------------|----------------------------------------|
| **Category** | name (unique, indexed), slug (unique, indexed), description, suggested_specs (JSON), active | Product categories with spec templates |
| **Brand**    | name (unique, indexed), logo_url, active                                                 | Product brands                         |
| **Product**  | UUID PK, supplier FK, category FK, brand FK, name, slug (unique), short/long description, specifications (JSON), condition (NEW/REFURBISHED), warranty_period (months), price, supplier_earnings (75%), platform_commission (25%), stock_quantity, low_stock_threshold, image_url (Cloudinary), view_count, purchase_count, active | Full product with flexible JSON specs  |

#### Order & Payment Models

| Model             | Key Fields                                                                               | Purpose                                 |
|-------------------|------------------------------------------------------------------------------------------|------------------------------------------|
| **Order**         | UUID PK, order_number (ORD-YYYYMMDD-XXXX), customer FK, delivery_address FK, delivery_zone, delivery_fee, subtotal, total, payment_method (MPESA/CARD/CASH), payment_status (PENDING/COMPLETED/FAILED/REFUNDED), payment_reference, paid_at, status (10 states), COD fields (collected_by, collected_at, amount_collected, verified_by, verified_at), delivery fields (assigned_agent, assigned_company, confirmed_by_agent, confirmed_at, proof_photo, recipient_name, notes, customer_confirmed, customer_dispute, auto_confirmed, auto_confirm_deadline, delivery_fee_paid) | Complete order lifecycle tracking         |
| **OrderItem**     | UUID PK, order FK, product FK, supplier FK, product_name, product_price, quantity, subtotal, supplier_earnings (75%), platform_commission (25%), warranty_period, warranty_expiry | Per-item snapshot with financial split    |
| **Cart**          | UUID PK, user FK (unique, 1:1)                                                          | Persistent cart per user                  |
| **CartItem**      | UUID PK, cart FK, product FK, quantity, unique constraint on (cart_id, product_id)        | Cart line items with duplicate prevention |

#### Returns & Payout Models

| Model              | Key Fields                                                                               | Purpose                                   |
|--------------------|------------------------------------------------------------------------------------------|-------------------------------------------|
| **Return**         | UUID PK, order FK, user FK, reason, status (PENDING/APPROVED/REJECTED/COMPLETED), refund_policy (4 tiers), refund_amount, restocking_fee, supplier_deduction, platform_deduction, customer_refund_amount, refund_processed_at, refund_reference, admin_notes | Return requests with refund calculations  |
| **SupplierPayout** | UUID PK, supplier FK, amount, status (pending/processing/completed/failed), reference     | Supplier earnings disbursement            |
| **DeliveryPayout** | UUID PK, payout_number (DPA/DPC-YYYYMMDD-XXXX), payout_type (AGENT/COMPANY), agent/company FK, gross_amount, platform_fee, net_amount, order_count, order_ids (JSON), status, payment_method, mpesa_number, period_start/end | Delivery partner payout tracking          |

#### Utility Models

| Model            | Key Fields                                                                               | Purpose                                     |
|------------------|------------------------------------------------------------------------------------------|---------------------------------------------|
| **OTP**          | UUID PK, email (indexed), code (6-digit), purpose (verification/password_reset), is_used, attempts (max 5), expires_at (10 min default) | Email verification & password reset codes   |
| **Notification** | UUID PK, user FK, title, message, type (info/warning/error/success), is_read, link        | In-app notification system                  |
| **AuditLog**     | UUID PK, user FK (nullable), action (indexed), entity_type, entity_id, old_values (JSON), new_values (JSON), description, ip_address, user_agent, indexed on: user_id, entity, action, created_at | Complete admin action audit trail            |
| **DeliveryZone** | UUID PK, name (unique, indexed), counties (JSON list), delivery_fee, estimated_delivery_days, active | Delivery zones with county mapping & pricing |
| **DeliveryZoneRequest** | UUID PK, agent FK, zone FK, reason, experience, status (PENDING/APPROVED/REJECTED), admin_notes | Agent requests for zone assignment          |

---

## 7. Key Features & Functionality

### 7.1 Authentication & Security

- **JWT Authentication** — 15-minute access tokens, 7-day refresh tokens
- **Token Refresh** — Automatic token rotation to maintain sessions
- **Google OAuth 2.0** — Social login with server-side JWT verification and automatic profile creation
- **Email Verification** — 6-digit OTP codes (10-minute expiry, max 5 attempts per code)
- **Password Reset** — OTP-based password recovery flow
- **Two-Factor Authentication (2FA)** — Optional TOTP-based 2FA using pyotp
- **Bcrypt Hashing** — 12-round password hashing
- **Password Validation** — Min 8 chars, requires uppercase, number, and special character
- **Phone Validation** — Kenyan phone number format (254XXXXXXXXX)
- **Session Tracking** — Login history with device info, IP address, and user agent
- **CORS Protection** — Restricted to frontend domain only

### 7.2 Product Management

- Advanced product listing with **filtering** (category, brand, price range, condition, stock status)
- **Sorting** — price ascending/descending, newest, most popular
- **Pagination** — configurable page sizes (1–100 items per page)
- **Full-text search** by product name and description
- Product **specifications stored as JSON** — flexible per-category specs with suggested templates
- Product conditions: **New** or **Refurbished**
- **Warranty tracking** — configurable per product, warranty expiry calculated at order time
- **Stock management** with low-stock threshold alerts
- **View count & purchase count** analytics per product
- **Image upload** via Cloudinary with CDN delivery and automatic optimization
- **Soft delete** — products are deactivated, not removed from database
- **Commission split**: 75% supplier / 25% platform, calculated at listing time

### 7.3 Shopping Cart

- Persistent cart tied to user account (1:1 relationship)
- Real-time **stock validation** on every cart view
- Inventory warnings when stock is insufficient
- Unique constraint prevents duplicate product entries (same product updates quantity)
- Cart survives across sessions (server-side storage)

### 7.4 Checkout & Orders

**Order Lifecycle** (10 statuses):
```
PENDING → PAID → PROCESSING → QUALITY_APPROVED → SHIPPED
→ OUT_FOR_DELIVERY → ARRIVED → DELIVERED → (CANCELLED / RETURNED)
```

- Delivery address selection or creation during checkout
- Automatic **delivery zone detection** based on county with fee calculation
- Order number format: `ORD-YYYYMMDD-XXXX` (date-stamped, sequential)
- Customer notes and admin notes per order
- **Auto-confirmation**: If a customer doesn't dispute within 24 hours of delivery, the order is automatically confirmed
- **Dispute mechanism**: Customers can dispute within 24-hour window with reason
- **Order item snapshots**: Product name, price, and specs captured at purchase time (immutable)
- **Warranty expiry**: Automatically calculated from purchase date + warranty period

### 7.5 Payment Integration

**Three Payment Methods:**

| Method    | Integration       | How It Works                                            |
|-----------|-------------------|---------------------------------------------------------|
| **M-Pesa**| Daraja STK Push   | Prompt sent to phone → customer enters PIN → callback   |
| **Card**  | Paystack API      | Redirect to Paystack → card details → webhook           |
| **COD**   | Internal workflow  | Agent collects cash → admin verifies → order confirmed  |

#### M-Pesa STK Push Flow (Detailed)
```
1. Customer clicks "Pay with M-Pesa" on frontend
2. Frontend calls POST /api/payments/mpesa/initiate
   - Sends: order_id, phone_number
3. Backend:
   a. Validates order exists and belongs to customer
   b. Validates phone number (Kenyan format)
   c. Gets M-Pesa OAuth token (cached for 3500s to reduce API calls)
   d. Generates timestamp & Base64 password (shortcode + passkey + timestamp)
   e. Calls Safaricom Daraja STK Push API
   f. Stores checkout_request_id in order.payment_reference
   g. Sets order.payment_status = PENDING
4. Safaricom M-Pesa:
   a. Sends prompt to customer's phone
   b. Customer sees merchant name & amount
   c. Customer enters M-Pesa PIN
   d. Payment processed on Safaricom network
5. M-Pesa Callback:
   a. Safaricom POSTs to /api/payments/mpesa/callback
   b. Backend extracts: MpesaReceiptNumber, Amount, PhoneNumber
   c. Matches payment to order via checkout_request_id
   d. Updates order: payment_status = COMPLETED, payment_reference = receipt
   e. Sends payment confirmation email to customer
6. Frontend (Polling):
   a. usePayment hook polls /api/payments/mpesa/query every 5 seconds
   b. Max 24 attempts (2 minutes total polling)
   c. Callback fires on status change (pending → completed/failed)
   d. Navigates to success page when completed
```

#### M-Pesa B2C Payment Flow (Supplier Payouts)
```
1. Admin triggers supplier payout from admin dashboard
2. Backend calls mpesa_service.b2c_payment()
3. M-Pesa B2C API sends money directly to supplier's M-Pesa
4. Payment tracked in SupplierPayout model
5. Status updated via callback
```

#### Paystack Card Payment Flow
```
1. Customer selects "Pay with Card"
2. Backend initializes Paystack charge with order details
3. Customer redirected to Paystack checkout page
4. Customer enters card details & completes payment
5. Paystack sends webhook to backend
6. Backend verifies payment and updates order status
```

#### COD (Cash on Delivery) Workflow
```
1. Customer places order with COD payment method
2. Delivery agent assigned to order
3. Agent delivers order and collects cash
4. Agent records COD collection: amount, timestamp
5. Admin verifies COD collection in admin dashboard
6. Order marked as paid after admin verification
```

### 7.6 Delivery Management

- **Delivery Zones** — Counties grouped into zones with configurable fees and estimated delivery days
- **Agent Types** — IN_HOUSE employees, INDIVIDUAL freelancers, COMPANY partners
- **Auto-assignment** — Orders automatically assigned to agents based on delivery zone; load balancing selects agent with fewest pending deliveries; fallback to any available agent if zone-specific agent unavailable
- **Delivery Proof** — Agents must upload photo proof of delivery and record recipient name
- **COD Collection** — Agents collect and report cash payments with amounts tracked
- **Dispute Resolution** — Customers can dispute deliveries within 24 hours with a reason
- **Auto-Confirmation** — Orders auto-confirmed 24 hours after agent marks delivery complete
- **Zone Requests** — Agents can request assignment to new delivery zones with experience/reason; admin approves/rejects
- **Availability Status** — Agents can toggle availability for order assignment
- **Vehicle Tracking** — Agent vehicle type and registration stored for logistics

### 7.7 Returns & Refunds

**4-Tier Refund Policy with Automated Calculations:**

| Policy               | Customer Refund | Supplier Cost        | Platform Cost        |
|-----------------------|-----------------|----------------------|----------------------|
| Supplier Fault        | 100%            | 100% of item         | 0%                   |
| Customer Changed Mind | 85%             | 0% (restocking fee)  | 0% (15% kept)        |
| Shipping Damage       | 100%            | 0%                   | 100% (platform pays) |
| Fraud                 | 110%            | 110% (penalty)       | 0%                   |

**Return Flow:**
```
Customer Requests Return → Admin Reviews
    ├─ Approved → Refund Policy Selected → Amounts Auto-Calculated
    │     ├─ customer_refund_amount calculated
    │     ├─ supplier_deduction calculated
    │     ├─ platform_deduction calculated
    │     ├─ restocking_fee calculated (if applicable)
    │     └─ Refund Processed → Reference stored
    └─ Rejected → Customer Notified with admin notes
```

### 7.8 Supplier Dashboard

- **KPIs**: Total products, active orders, total sales, return rate, outstanding balance
- **Product CRUD** with multi-image upload via Cloudinary
- **Earnings breakdown**: 75% supplier / 25% platform commission per item
- **Payout history** — M-Pesa payouts tracked with status (pending/processing/completed/failed)
- **Payout methods**: Phone (personal M-Pesa), Paybill (business), Till (merchant)
- **Analytics** — Monthly sales trends, top-selling products
- **Payment phone management** — Change M-Pesa payout number with admin approval workflow:
  - Supplier submits change request with reason
  - Admin reviews and approves/rejects
  - Status tracked: PENDING → APPROVED/REJECTED
  - Timestamps for request and review recorded
- **Low stock alerts** — Notifications when products drop below threshold

### 7.9 Admin Panel

- **Dashboard** — Real-time KPIs (total users, products, orders, revenue, active suppliers)
- **User Management** — List/search users by role, approve/suspend suppliers, create admin accounts with specific permissions
- **Order Management** — View all orders, update status through lifecycle, assign delivery agents, verify COD payments, cancel orders
- **Product Management** — Manage products across all suppliers, categories, and brands
- **Category & Brand CRUD** — Create/update categories with suggested spec templates, manage brands with logos
- **Returns Management** — Review return requests, approve with refund policy, reject with notes
- **Financial Reports** — Revenue tracking, commission breakdown, payout management
- **Delivery Zone Management** — CRUD for zones with county mapping, fees, and estimated days
- **Delivery Management** — Manage agents, companies, zone requests, delivery payouts
- **Supplier Payouts** — Process pending payouts, view payout history, approve payment phone changes
- **Delivery Payouts** — Track agent and company payouts with period-based reporting
- **Audit Logs** — Complete activity trail with old/new value diffs, IP tracking, user agent logging
- **Analytics** — 30-day trends, top products, top suppliers, revenue charts (Recharts)
- **Notifications** — System-wide notification management
- **Settings** — Platform configuration

### 7.10 Background Jobs (APScheduler)

| Job                        | Schedule    | Description                                    |
|----------------------------|-------------|------------------------------------------------|
| Auto-confirm deliveries    | Periodic    | Confirms orders 24h after agent delivery mark  |
| Cleanup expired OTPs       | Periodic    | Removes stale verification codes               |
| Process pending payouts    | Periodic    | Automatic supplier payout scheduling           |
| Order status reminders     | Periodic    | Notify on stale/stuck orders                   |

---

## 8. API Structure (100+ Endpoints)

The backend exposes **12 route modules** organized as Flask Blueprints:

| Module             | Prefix                | Endpoints | Key Endpoints                                    |
|--------------------|-----------------------|-----------|--------------------------------------------------|
| Authentication     | `/api/auth`           | 15        | register, login, OTP verify/resend, forgot/reset password, profile, 2FA enable/verify, Google OAuth login/callback, refresh-token, logout |
| Products           | `/api/products`       | 8         | CRUD, list with filtering/sorting/pagination/search, categories, brands |
| Cart               | `/api/cart`            | 5         | Get cart, add/update/remove items, clear cart    |
| Orders             | `/api/orders`         | 15        | Addresses CRUD, checkout (create order), list/detail, cancel, delivery zones, confirm/dispute delivery |
| Payments           | `/api/payments`       | 8         | M-Pesa STK push/callback/query/config, Paystack initiate/callback/verify, payment status, transactions |
| Supplier           | `/api/supplier`       | 10        | Dashboard KPIs, products, orders, analytics, payouts, profile, payment phone change request/status |
| Supplier Terms     | `/api/supplier/terms` | 3         | Get terms, accept terms, check status            |
| Delivery           | `/api/delivery`       | 20        | Agent dashboard/assigned-orders/confirm/COD/earnings/availability, Admin zones CRUD/agents/companies/zone-requests |
| Returns            | `/api/returns`        | 6         | Request return, list, detail, update, approve, reject |
| Admin              | `/api/admin`          | 25        | Dashboard, analytics, audit-logs, users CRUD, suppliers approve/phone-changes, orders management, returns approve/reject, payouts process, categories/brands CRUD, delivery payouts |
| Uploads            | `/api/uploads`        | 3         | Single image upload, multiple upload, delete     |
| Contact            | `/api/contact`        | 1         | Submit contact form (Web3Forms integration)      |

---

## 9. Frontend State Management (Redux Toolkit)

### Store Configuration

```javascript
export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    supplierProducts: supplierProductsReducer,
    cart: cartReducer,
    orders: ordersReducer,
  },
});
```

### Redux Slices Detail

| Slice                    | State Fields                                            | Async Thunks                                           | Key Actions                              |
|--------------------------|---------------------------------------------------------|--------------------------------------------------------|------------------------------------------|
| **authSlice** (7KB)      | user, token, isLoading, isSuccess, isError, message     | register, login, logout, updateProfile, changePassword | reset, setCredentials, updateToken, updateUser, clearAuth |
| **productsSlice** (9KB)  | products[], selectedCategory, filters, isLoading, pagination | fetchProducts, fetchProductDetail, searchProducts, fetchCategories, fetchBrands | setFilters, setPagination, setCategory, resetFilters |
| **cartSlice** (5KB)      | items[], subtotal, itemCount, isLoading                 | fetchCart, addToCart, updateCartItem, removeFromCart, clearCart | setCart, addItem, removeItem              |
| **ordersSlice** (12KB)   | orders[], selectedOrder, isLoading, isError, filters    | fetchOrders, fetchOrderDetail, createOrder, updateOrder, cancelOrder | —                                        |
| **supplierProductsSlice** (4KB) | products[], isLoading                            | fetchSupplierProducts, createProduct, updateProduct, deleteProduct | —                                        |

**localStorage Integration**: User data (user object, JWT access token, refresh token) is persisted to localStorage as JSON under the `user` key, surviving page refreshes.

### Custom Hooks

| Hook            | Purpose                                                    | Key Methods                                                                                         |
|-----------------|------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| **useAuth** (1KB)    | Auth utilities for components                         | getAuthHeaders(), getToken(), isAuthenticated()                                                      |
| **usePayment** (6KB) | Complete payment workflow management                  | initiateMpesaPayment(orderId, phone), initiateCardPayment(orderId), verifyCardPayment(ref), checkPaymentStatus(orderId), queryMpesaStatus(orderId), pollMpesaStatus(orderId, callback, maxAttempts=24, interval=5000), simulatePayment(orderId, success), checkMpesaConfig() |

---

## 10. Frontend Routing Structure

```
App Routes
├── Public Routes (no authentication required)
│   ├── /login                         → Login page
│   ├── /register                      → Registration page
│   ├── /auth/callback                 → Google OAuth callback
│   └── MainLayout (Header + Footer)
│       ├── /                          → Home page
│       ├── /about                     → About page
│       ├── /contact                   → Contact form
│       ├── /terms                     → Terms & Conditions
│       ├── /privacy                   → Privacy Policy
│       ├── /faq                       → FAQs
│       ├── /returns                   → Returns Policy
│       ├── /warranty                  → Warranty Info
│       ├── /products                  → Product listing (filters, search, sort)
│       └── /products/:slug            → Product detail page
│
├── Protected Routes (JWT authentication required)
│   └── MainLayout (Header + Footer)
│       ├── Customer Routes
│       │   ├── /cart                   → Shopping cart
│       │   ├── /checkout              → Checkout flow
│       │   ├── /payment-verification  → Payment status check
│       │   ├── /payment-callback      → M-Pesa/Paystack return page
│       │   ├── /order-confirmation    → Order success page
│       │   ├── /orders                → Order history
│       │   ├── /orders/:id            → Order detail & tracking
│       │   ├── /profile               → User profile
│       │   ├── /edit-profile          → Edit profile
│       │   ├── /settings              → Account settings
│       │   ├── /returns/request       → Request a return
│       │   └── /returns/my-returns    → View my returns
│       │
│       ├── Supplier Routes (supplier role required)
│       │   ├── /supplier/dashboard    → Supplier KPIs & overview
│       │   ├── /supplier/products     → Manage products
│       │   ├── /supplier/add-product  → Add new product
│       │   ├── /supplier/edit-product/:id → Edit product
│       │   ├── /supplier/orders       → Supplier order management
│       │   ├── /supplier/analytics    → Sales analytics & trends
│       │   └── /supplier/payouts      → Payout history & status
│       │
│       ├── Delivery Routes (delivery_agent role required)
│       │   ├── /delivery/dashboard    → Delivery agent dashboard
│       │   ├── /delivery/orders       → Assigned deliveries
│       │   └── /delivery/payouts      → Delivery payout history
│       │
│       └── Admin Routes (admin role required)
│           ├── /admin/dashboard             → Admin KPIs & overview
│           ├── /admin/analytics             → Platform analytics
│           ├── /admin/users                 → User management
│           ├── /admin/orders                → All orders management
│           ├── /admin/returns               → Returns management
│           ├── /admin/payouts               → Supplier payout processing
│           ├── /admin/delivery-zones        → Delivery zone CRUD
│           ├── /admin/categories            → Category management
│           ├── /admin/product-management    → Product oversight
│           ├── /admin/delivery-management   → Agents & companies
│           ├── /admin/settings              → Platform settings
│           ├── /admin/audit-logs            → Activity audit trail
│           ├── /admin/financial-reports     → Revenue & financial data
│           ├── /admin/notifications         → Notification management
│           └── /admin/activity-timeline     → Activity timeline
```

---

## 11. Backend Services Layer

The service layer separates business logic from route handlers:

| Service                     | File Size | Purpose                                                              |
|-----------------------------|-----------|----------------------------------------------------------------------|
| **Email Service**           | 39KB      | Transactional emails (order confirmation, payment receipt, shipping notification, delivery confirmation, cancellation, OTP, welcome, password reset) via Gmail SMTP with HTML templates |
| **M-Pesa Service**          | 12KB      | Safaricom Daraja API integration: OAuth token management with 3500s cache, STK Push initiation, status querying, B2C payouts, phone number validation & formatting (254XXXXXXXXX) |
| **Paystack Service**        | 6KB       | Card payment gateway: initialize_payment, verify_payment, get_payment_details |
| **Cloudinary Service**      | 8KB       | Image management: upload_image, upload_multiple, delete_image, optimize_url with CDN delivery |
| **Google OAuth Service**    | 7KB       | Social login: verify Google JWT token, extract user info, automatic profile creation on first login |
| **Scheduler Service**       | 11KB      | APScheduler background jobs: auto-confirm deliveries (24h), cleanup expired OTPs, process pending payouts, order status reminders |
| **Notification Service**    | 10KB      | In-app notifications: create_notification, mark_as_read, get_unread_notifications with type support (info/warning/error/success) |

---

## 12. Commission & Financial Model

```
Product Price: KES 10,000
├── Supplier Earnings:    KES 7,500 (75%)
└── Platform Commission:  KES 2,500 (25%)

Delivery Fee: KES 200–500 (by zone)
├── Delivery Agent earns: 70% of delivery fee (default)
├── Delivery Company earns: 80% of delivery fee (default)
└── Platform retains remainder
```

### Financial Tracking

- Commission is calculated **at the time of order** and stored per order item (immutable record)
- **Supplier payouts** managed through approval workflow: Admin triggers → M-Pesa B2C → Status tracked
- **Delivery payouts** tracked separately for agents and companies with period-based reporting
- Payout statuses: `pending → processing → completed / failed`
- **Outstanding balance** tracked per supplier (earnings minus processed payouts)
- Delivery payout numbers: `DPA-YYYYMMDD-XXXX` (agent) / `DPC-YYYYMMDD-XXXX` (company)

---

## 13. Configuration & Environment Variables

### Backend Environment Variables

```
# Flask Core
SECRET_KEY, FLASK_ENV (development|production)

# Database
DATABASE_URL=postgresql://user:pass@host:5432/electronics_shop

# JWT Authentication
JWT_SECRET_KEY, JWT_ACCESS_TOKEN_EXPIRES=900, JWT_REFRESH_TOKEN_EXPIRES=604800

# Email (Gmail SMTP)
MAIL_SERVER=smtp.gmail.com, MAIL_PORT=587, MAIL_USE_TLS=True
MAIL_USERNAME, MAIL_PASSWORD (app password)

# Cloud Storage
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

# Application URLs
FRONTEND_URL=http://localhost:5173, BACKEND_URL=http://localhost:5000

# Google OAuth
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

# M-Pesa Daraja API
MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE=174379
MPESA_PASSKEY, MPESA_CALLBACK_URL, MPESA_ENVIRONMENT=sandbox|production
MPESA_B2C_SHORTCODE, MPESA_B2C_INITIATOR_NAME, MPESA_B2C_SECURITY_CREDENTIAL

# Paystack
PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY
```

### Frontend Environment Variables

```
VITE_BACKEND_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID
VITE_CONTACT_EMAIL
VITE_WEB3FORMS_ACCESS_KEY
```

---

## 14. Seed Data & Test Accounts

The seeding script (`seed_all.py`) creates demo data for testing:

| Account          | Email                     | Password        | Role       |
|------------------|---------------------------|-----------------|------------|
| Admin            | `admin@electronics.shop`  | `Admin@123`     | Admin      |
| Supplier 1       | `supplier@test.com`       | `Supplier@123`  | Supplier   |
| Supplier 2       | `supplier2@test.com`      | `Supplier@123`  | Supplier   |
| Customer         | `customer@test.com`       | `Customer@123`  | Customer   |

**Also seeds**: 8 categories, 10+ brands, 50+ products with images, 4+ delivery zones with county mapping, 2 delivery agents with vehicle info

---

## 15. Deployment

- **Platform**: Render.com (render.yaml configuration)
- **Backend**: Gunicorn WSGI server, Python 3.11
- **Database**: PostgreSQL (managed by Render, free tier)
- **Build Pipeline**: `pip install -r requirements.txt` → `flask db upgrade` → `python seed_all.py`
- **Configuration**: Environment variables managed via Render dashboard
- **Frontend**: Built with `npm run build` (Vite), served as static assets
- **CORS**: Backend configured to accept requests only from frontend domain

### Startup Scripts

| Script              | Purpose                                    |
|---------------------|--------------------------------------------|
| `setup.sh`          | Install all dependencies, create DB, seed  |
| `start.sh`          | Start both backend & frontend              |
| `start-backend.sh`  | Start backend only (Flask dev server)      |
| `start-frontend.sh` | Start frontend only (Vite dev server)      |
| `build.sh` (backend)| Production build for Render deployment     |

---

## 16. Project Workflow Diagrams

### Customer Purchase Flow
```
Browse Products → Add to Cart → Checkout
    → Select/Create Delivery Address → County → Auto Zone Detection → Fee Calculated
    → Choose Payment Method
        ├─ M-Pesa → STK Push to phone → Customer enters PIN → Callback → PAID
        ├─ Card → Redirect to Paystack → Card details → Webhook → PAID
        └─ COD → Order placed → Pay on delivery
    → Order Created (ORD-YYYYMMDD-XXXX) → Email Confirmation
    → Supplier Sees Order → Processes & Ships
    → Delivery Agent Auto-Assigned (load balanced by zone)
    → Agent Delivers (uploads proof photo, records recipient)
    → Customer Confirms (or auto-confirms in 24h if no dispute)
    → Supplier Payout Calculated & Queued
    → Admin Processes Payout → M-Pesa B2C → Money to Supplier
```

### Return & Refund Flow
```
Customer Requests Return (within policy window)
    → Admin Reviews Request
        ├─ Approved → Selects Refund Policy
        │     ├─ Supplier Fault:        100% refund, supplier deducted
        │     ├─ Customer Changed Mind:   85% refund, 15% restocking fee
        │     ├─ Shipping Damage:        100% refund, platform absorbs cost
        │     └─ Fraud:                  110% refund, supplier penalized
        │     → Amounts auto-calculated → Refund processed → Reference stored
        └─ Rejected → Customer notified with admin notes
```

### Supplier Onboarding Flow
```
Supplier Registers → Email Verification (OTP)
    → Profile Setup (business name, registration, M-Pesa number)
    → Accept Supplier Terms & Conditions
    → Admin Reviews & Approves Supplier
    → Supplier Can List Products
    → Products Go Live on Marketplace
    → Orders Come In → Supplier Fulfills
    → Earnings Accumulate (75% of sales)
    → Admin Processes Payout → M-Pesa B2C
```

### Delivery Agent Flow
```
Agent Registered (by admin or self-registration)
    → Assigned to Delivery Zone(s)
    → Sets Availability Status
    → Orders Auto-Assigned (load balanced)
    → Agent Views Assigned Orders
    → Agent Delivers → Uploads Proof Photo
    → If COD: Collects Cash → Records Amount
    → Admin Verifies COD Collection
    → 24h Auto-Confirm Window
    → Earnings Calculated (70% of delivery fee)
    → Payout Processed
```

---

## 17. Key Technical Decisions

| Decision                      | Rationale                                                           |
|-------------------------------|---------------------------------------------------------------------|
| Flask over Django              | Lightweight, flexible for custom API architecture with blueprints   |
| PostgreSQL                     | ACID compliance, JSON columns for flexible specs, production-ready  |
| JWT + Refresh Tokens           | Stateless auth, secure token rotation, 15min/7day expiry            |
| Redux Toolkit                  | Predictable state management for complex multi-role UI              |
| UUIDs for Primary Keys         | Security (non-guessable), distributed-system friendly               |
| Commission at Order Time       | Immutable financial records, prevents retroactive changes           |
| JSON Columns for Specs         | Flexible product specifications per category without schema changes |
| Cloudinary for Images          | CDN delivery, automatic optimization, no local storage needed       |
| APScheduler                    | Background task processing without external queue service (Redis)   |
| App Factory + Blueprints       | Modular route organization, testable, multiple config support       |
| Service Layer                  | Clean separation between routes and business logic                  |
| bcrypt 12 rounds               | Industry-standard password hashing with future-proof rounds         |
| TOTP for 2FA                   | Time-based OTP compatible with Google Authenticator / Authy         |
| React Hook Form                | Performant form handling with minimal re-renders                    |
| Vite over CRA                  | Faster build times, better DX, modern ESM support                   |

---

## 18. Summary for Panel

This is a **production-grade, multi-vendor e-commerce platform** built with:

- A **React 19** frontend with **Redux Toolkit** state management, **React Router 7** routing, **React Hook Form** for forms, **Recharts** for analytics, and **Tailwind CSS** styling
- A **Flask** REST API backend with **12 blueprint modules**, a dedicated **service layer**, and **100+ endpoints**
- **PostgreSQL** database with **21 tables** managed through **SQLAlchemy 2.0 ORM** and **Alembic migrations**
- **M-Pesa Daraja API** (STK Push + B2C) and **Paystack** payment integrations for the Kenyan market, plus **Cash on Delivery** with agent collection tracking
- **Role-based access control** supporting **7 user roles** with JWT authentication, Google OAuth, email verification, and optional TOTP-based 2FA
- A comprehensive **delivery management system** with auto-assignment, load balancing, proof-of-delivery, COD tracking, and 24-hour auto-confirmation
- A **4-tier refund engine** with automated calculations for supplier fault, customer change of mind, shipping damage, and fraud cases
- **Cloudinary** image management, **Gmail SMTP** transactional emails, and **APScheduler** background jobs
- **Audit logging** for compliance, **in-app notifications**, and **session tracking**
- **Deployment** on Render.com with automated migrations, seeding, and Gunicorn WSGI server

The platform handles the **complete e-commerce lifecycle**: product discovery → cart → checkout → payment → fulfillment → delivery → returns — with dedicated dashboards for every stakeholder (customer, supplier, delivery agent, and admin).
