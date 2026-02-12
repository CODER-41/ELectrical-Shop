# Quantum Gear Electronics

A full-stack multi-vendor e-commerce platform for electronics, built with Flask (Python) and React. Features role-based dashboards for customers, suppliers, delivery agents, and admins with M-Pesa & Paystack payments, returns management, delivery tracking, and real-time analytics.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Installation](#manual-installation)
- [Running the Application](#running-the-application)
- [Default Accounts](#default-accounts)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Returns & Refund System](#returns--refund-system)
- [Payment Integration](#payment-integration)
- [Scripts Reference](#scripts-reference)
- [Environment Setup by OS](#environment-setup-by-os)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Quantum Gear Electronics is a complete multi-vendor e-commerce solution that enables:
- **Customers** to browse, purchase, track orders, and request returns for electronics
- **Suppliers** to list products, manage inventory, handle returns, track payouts, and view analytics
- **Delivery Agents** to manage assigned deliveries and track earnings
- **Admins** to oversee the entire platform — users, orders, returns, payouts, delivery zones, and financials

The platform integrates with M-Pesa (Daraja API) for mobile payments, Paystack for card payments, Cloudinary for image uploads, and Google OAuth for authentication.

---

## Features

### Customer Features
- User registration and authentication (email/password + Google OAuth)
- Email verification with OTP and two-factor authentication (2FA)
- Browse products by category, brand, or search with advanced filtering
- Product sorting, pagination, and stock availability indicators
- Shopping cart management with real-time stock validation
- Secure checkout with M-Pesa STK Push, Paystack card payments, or cash on delivery
- Order tracking with status updates (pending → paid → processing → shipped → delivered)
- Product returns and refund requests with image upload support
- Warranty claims for eligible products
- Delivery address management with zone-based delivery fees
- User profile management

### Supplier Features
- Supplier registration with admin approval workflow
- Product management (CRUD) with image uploads via Cloudinary
- Inventory tracking with low stock alerts
- Order fulfillment dashboard with status management
- **Returns management** — acknowledge, accept, or dispute customer return requests
- Sales analytics and performance reports (Recharts)
- Payout tracking and history (M-Pesa B2C payouts)
- Commission tracking (75% supplier / 25% platform)
- Supplier terms and conditions acceptance

### Delivery Agent Features
- Delivery agent dashboard with assigned orders
- Order pickup and delivery status updates
- Delivery earnings tracking and payout history
- Route and zone-based delivery management

### Admin Features
- Comprehensive admin dashboard with platform-wide analytics
- User management (customers, suppliers, delivery agents, admins)
- Multi-role admin system (admin, product_manager, finance_admin, support_admin)
- Category and brand management
- Order oversight and status management
- **Returns management** — review supplier responses, approve/reject returns, process refunds
- Supplier payout processing (M-Pesa B2C)
- Delivery zone configuration with fee and estimated days
- Product management and moderation
- Financial reports and analytics
- Audit logs for compliance tracking
- System notifications and activity timeline

### Technical Features
- JWT-based authentication with access + refresh tokens
- Role-based access control (RBAC) with 7 user roles
- Google OAuth 2.0 social authentication
- Email notifications (OTP, order confirmations, shipping updates, password reset)
- Image upload and optimization via Cloudinary
- Responsive design with Tailwind CSS (mobile + desktop)
- RESTful API architecture with 80+ endpoints
- Background job scheduling (APScheduler)
- Swagger/OpenAPI documentation

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.10+ | Runtime |
| Flask 3.x | Web framework |
| PostgreSQL 14+ | Database |
| SQLAlchemy 2.x | ORM |
| Flask-JWT-Extended | Authentication |
| Flask-Migrate (Alembic) | Database migrations |
| Flask-Mail | Email service (SMTP) |
| Flask-CORS | Cross-origin requests |
| Cloudinary | Image uploads |
| APScheduler | Background jobs |
| Gunicorn | Production server |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19.x | UI library |
| Vite 7.x | Build tool |
| Redux Toolkit 2.x | State management |
| React Router 7.x | Client-side routing |
| Tailwind CSS 3.x | Utility-first styling |
| Axios | HTTP client with interceptors |
| Recharts 3.x | Analytics charts |
| React Hook Form | Form management |
| React Toastify | Toast notifications |
| React DatePicker | Date selection |

### Integrations
| Service | Purpose |
|---------|---------|
| M-Pesa Daraja API | Mobile payments (STK Push + B2C payouts) |
| Paystack | Card payments (Visa, Mastercard) |
| Google OAuth 2.0 | Social authentication |
| Cloudinary | Image storage and optimization |
| Web3Forms | Contact form submissions |

---

## Project Structure

```
quantum-gear-electronics/
├── backend/                    # Flask API server
│   ├── app/
│   │   ├── config/             # App configuration (dev/prod/test)
│   │   ├── models/             # SQLAlchemy models (11 model classes)
│   │   ├── routes/             # API endpoints (13 route files)
│   │   ├── services/           # Business logic (email, mpesa, paystack, etc.)
│   │   └── utils/              # Helpers (validation, responses, decorators)
│   ├── migrations/             # Alembic database migrations
│   ├── .env.example            # Environment variable template
│   ├── requirements.txt        # Python dependencies
│   ├── seed_all.py             # Database seeder with sample data
│   ├── run.py                  # Application entry point
│   └── README.md               # Backend API documentation
│
├── frontend/
│   └── electricalshop-app/     # React application
│       ├── src/
│       │   ├── components/     # 15 reusable components
│       │   ├── pages/          # 50+ page components
│       │   │   ├── Admin/      # 18 admin pages
│       │   │   ├── Supplier/   # 5 supplier pages
│       │   │   ├── Delivery/   # 3 delivery agent pages
│       │   │   └── Returns/    # 3 customer return pages
│       │   ├── store/          # Redux store (5 slices)
│       │   ├── hooks/          # Custom hooks (useAuth, usePayment)
│       │   ├── utils/          # Axios API client
│       │   └── layouts/        # MainLayout wrapper
│       ├── .env.example        # Frontend env template
│       ├── package.json        # Node dependencies
│       └── README.md           # Frontend documentation
│
├── setup.sh                    # Automated setup script
├── start.sh                    # Start both servers
├── start-backend.sh            # Start backend only
├── start-frontend.sh           # Start frontend only
└── README.md                   # This file
```

---

## Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Python | 3.10+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/quantum-gear-electronics.git
cd quantum-gear-electronics

# Make setup script executable and run
chmod +x setup.sh
./setup.sh

# Start both servers
./start.sh
```

Access the application:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

---

## Manual Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/quantum-gear-electronics.git
cd quantum-gear-electronics
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your credentials

# Create database
sudo -u postgres createdb electronics_shop

# Run migrations
export FLASK_APP=run.py
flask db upgrade

# Seed sample data
python seed_all.py

cd ..
```

### 3. Frontend Setup

```bash
cd frontend/electricalshop-app

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env if needed

cd ../..
```

### 4. Configure Environment Variables

**Backend (.env)** — see [backend/.env.example](backend/.env.example) for all variables:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/electronics_shop
JWT_SECRET_KEY=your-secret-key
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
PAYSTACK_SECRET_KEY=sk_test_your-secret-key
PAYSTACK_PUBLIC_KEY=pk_test_your-public-key
```

**Frontend (.env)**:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_WEB3FORMS_ACCESS_KEY=your-web3forms-key
VITE_CONTACT_EMAIL=your-email@example.com
```

---

## Running the Application

### Option 1: Both Servers Together
```bash
./start.sh
```

### Option 2: Separate Terminals

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
python run.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend/electricalshop-app
npm run dev
```

### Option 3: Individual Scripts
```bash
./start-backend.sh   # Backend only
./start-frontend.sh  # Frontend only
```

---

## Default Accounts

After running `seed_all.py`, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@electronicsshop.com | admin123 |
| Supplier | supplier@example.com | supplier123 |
| Customer | customer@example.com | customer123 |

---

## API Documentation

The backend provides 80+ RESTful API endpoints across 13 route modules. Key endpoint groups:

| Group | Prefix | Endpoints | Description |
|-------|--------|-----------|-------------|
| Auth | `/api/auth` | 20 | Registration, login, OAuth, OTP, 2FA, password reset |
| Products | `/api/products` | 9 | CRUD, categories, brands, search, filtering |
| Cart | `/api/cart` | 7 | Add, update, remove items, validate, count |
| Orders | `/api/orders` | 12 | Create, track, addresses, delivery zones |
| Payments | `/api/payments` | 15 | M-Pesa STK Push, Paystack cards, B2C payouts |
| Returns | `/api/returns` | 5 | Create, list, review, status updates, stats |
| Supplier | `/api/supplier` | 10 | Dashboard, returns management, terms |
| Admin | `/api/admin` | 10+ | Dashboard, analytics, returns, payouts |
| Delivery | `/api/delivery` | 8+ | Agent dashboard, orders, payouts |
| Uploads | `/api/uploads` | 6 | Product, return, brand, profile images |
| Contact | `/api/contact` | 2 | Contact form submission |

For complete API documentation, see [Backend README](backend/README.md).

---

## User Roles

The platform supports 7 user roles with granular access control:

| Role | Access Level | Key Capabilities |
|------|-------------|------------------|
| `customer` | Customer portal | Browse, purchase, orders, returns |
| `supplier` | Supplier portal | Products, orders, returns, analytics, payouts |
| `delivery_agent` | Delivery portal | Deliveries, earnings, payouts |
| `admin` | Full platform access | All management features |
| `product_manager` | Product management | Products, categories, brands |
| `finance_admin` | Financial management | Financial reports, payouts |
| `support_admin` | Support management | Delivery management, support |

---

## Returns & Refund System

The platform implements a multi-party returns workflow:

**Workflow:** Customer submits return → Supplier acknowledges & responds (accept/dispute) → Admin reviews supplier input → Admin approves/rejects → Refund processed

**Return Statuses:** `requested` → `supplier_review` → `pending_review` / `disputed` → `approved` / `rejected` → `refund_completed`

**Refund Policies:**
- **Supplier Fault:** Defective/wrong products — Supplier pays 100%
- **Customer Changed Mind:** 15% restocking fee applies
- **Shipping Damage:** Platform absorbs full cost
- **Fraud:** Supplier pays 110% (includes penalty)

**Features:**
- 14-day return window from delivery
- Warranty claim support with expiration tracking
- Image upload for return evidence
- Supplier can accept or dispute with evidence
- Admin sees supplier response before making final decision
- Refund tracking with reference numbers

---

## Payment Integration

### M-Pesa (Safaricom Daraja API)
- **STK Push** — Customer receives payment prompt on phone
- **B2C Payouts** — Automated supplier payouts via M-Pesa
- **Status Polling** — Real-time payment verification
- **Sandbox/Production** toggle via environment variable

### Paystack
- **Card Payments** — Visa, Mastercard, local cards
- **Payment Verification** — Server-side verification
- **Webhook Support** — Real-time payment event handling

### Cash on Delivery
- Admin-confirmed cash payments after delivery

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `setup.sh` | Full project setup (dependencies, database, seeding) |
| `start.sh` | Start both backend and frontend servers |
| `start-backend.sh` | Start backend server only |
| `start-frontend.sh` | Start frontend dev server only |

---

## Environment Setup by OS

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv libpq-dev python3-dev

# Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### macOS

```bash
brew install python node postgresql
brew services start postgresql
```

### Windows

1. Install [Python](https://www.python.org/downloads/)
2. Install [Node.js](https://nodejs.org/)
3. Install [PostgreSQL](https://www.postgresql.org/download/windows/)
4. Use Git Bash or WSL for running shell scripts

---

## Troubleshooting

### Database Connection Issues
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Port Already in Use
```bash
lsof -i :5000  # Find backend process
lsof -i :5173  # Find frontend process
kill -9 <PID>
```

### Permission Denied on Scripts
```bash
chmod +x setup.sh start.sh start-backend.sh start-frontend.sh
```

### npm/pip Install Fails
```bash
# Clear caches and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json && npm install

pip cache purge
rm -rf venv && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For issues and questions:
- Open an issue on GitHub
- Check [Backend README](backend/README.md) for API details
- Check [Frontend README](frontend/electricalshop-app/README.md) for UI documentation
