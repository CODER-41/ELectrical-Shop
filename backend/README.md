# Electronics Shop - Backend API

A Flask-based REST API powering the Electronics Shop multi-vendor e-commerce platform. This backend handles user authentication, product management, order processing, payments, and supplier operations.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Quick Setup](#quick-setup)
  - [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Testing](#testing)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Runtime |
| Flask | 3.x | Web framework |
| PostgreSQL | 14+ | Database |
| SQLAlchemy | 2.x | ORM |
| Flask-JWT-Extended | 4.x | JWT authentication |
| Flask-Migrate | 4.x | Database migrations |
| Flask-Mail | 0.9+ | Email service |
| Cloudinary | 1.36+ | Image uploads |
| Gunicorn | 21+ | Production server |

---

## Prerequisites

Before installing, ensure you have the following installed on your system:

- **Python 3.10 or higher**
  ```bash
  python3 --version
  ```

- **pip (Python package manager)**
  ```bash
  pip3 --version
  ```

- **PostgreSQL 14 or higher**
  ```bash
  psql --version
  ```

- **Virtual environment support**
  ```bash
  python3 -m venv --help
  ```

---

## Installation

### Quick Setup

From the project root directory, run the automated setup script:

```bash
./setup.sh
```

This will:
- Create a Python virtual environment
- Install all dependencies
- Set up environment files
- Create the database
- Run migrations
- Seed sample data

### Manual Setup

If you prefer to set up manually or the script doesn't work for your system:

#### Step 1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate

# On Windows (Command Prompt):
venv\Scripts\activate.bat

# On Windows (PowerShell):
venv\Scripts\Activate.ps1
```

#### Step 3: Upgrade pip

```bash
pip install --upgrade pip
```

#### Step 4: Install Dependencies

Install all required Python packages:

```bash
pip install -r requirements.txt
```

**Individual packages (if requirements.txt fails):**

```bash
# Core Flask packages
pip install Flask>=3.0.0
pip install Flask-SQLAlchemy>=3.1.0
pip install Flask-Migrate>=4.0.0
pip install Flask-JWT-Extended>=4.6.0
pip install Flask-CORS>=4.0.0
pip install Flask-Mail>=0.9.1

# Database
pip install SQLAlchemy>=2.0.0
pip install psycopg2-binary>=2.9.9

# Authentication & Security
pip install bcrypt>=4.1.0
pip install PyJWT>=2.8.0
pip install pyotp>=2.9.0

# HTTP & API
pip install requests>=2.31.0

# Image Upload
pip install cloudinary>=1.36.0

# Environment & Config
pip install python-dotenv>=1.0.0

# Utilities
pip install email-validator>=2.1.0

# Production Server
pip install gunicorn>=21.0.0

# Development & Testing
pip install pytest>=7.4.0
pip install pytest-flask>=1.3.0
```

#### Step 5: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your credentials
nano .env  # or use your preferred editor
```

---

## Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# Application
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/electronics_shop

# JWT Authentication
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=2592000

# Email Configuration (Gmail example)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary (Image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# M-Pesa Daraja API
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_SHORTCODE=your-shortcode
MPESA_PASSKEY=your-passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox

# Web3Forms (Contact form)
WEB3FORMS_ACCESS_KEY=your-access-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

---

## Database Setup

### Create PostgreSQL Database

**Option 1: Using sudo (Linux)**
```bash
sudo -u postgres createdb electronics_shop
```

**Option 2: Using psql with password**
```bash
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE electronics_shop;"
```

**Option 3: Using pgAdmin or DBeaver**
- Connect to your PostgreSQL server
- Right-click on Databases
- Create new database named `electronics_shop`

### Run Migrations

```bash
# Set Flask app environment variable
export FLASK_APP=run.py  # Linux/macOS
# or
set FLASK_APP=run.py  # Windows

# Initialize migrations (first time only)
flask db init

# Create migration
flask db migrate -m "Initial migration"

# Apply migrations
flask db upgrade
```

### Seed Sample Data

```bash
python seed_all.py
```

This creates:
- Admin user (admin@electronicsshop.com / admin123)
- Sample suppliers
- Product categories and brands
- 43 sample products with images
- Delivery zones

---

## Running the Server

### Development Mode

```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Linux/macOS

# Run the development server
python run.py
```

The server runs at: **http://localhost:5000**

### Production Mode

```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/logout` | Logout user | Yes |
| POST | `/auth/refresh` | Refresh access token | Yes |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/send-otp` | Send OTP to email | No |
| POST | `/auth/verify-otp` | Verify OTP code | No |
| GET | `/auth/google` | Initiate Google OAuth | No |
| POST | `/auth/google/token` | Authenticate with Google token | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/change-password` | Change password | Yes |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | List all products (paginated) | No |
| GET | `/products/<id>` | Get product details | No |
| GET | `/products/categories` | List all categories | No |
| GET | `/products/brands` | List all brands | No |
| POST | `/products` | Create product | Supplier |
| PUT | `/products/<id>` | Update product | Supplier/Admin |
| DELETE | `/products/<id>` | Delete product | Supplier/Admin |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/orders` | List user's orders | Yes |
| GET | `/orders/<id>` | Get order details | Yes |
| POST | `/orders` | Create new order | Yes |
| POST | `/orders/<id>/cancel` | Cancel order | Yes |
| PUT | `/orders/<id>/status` | Update order status | Admin |

### Cart Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get user's cart | Yes |
| POST | `/cart/items` | Add item to cart | Yes |
| PUT | `/cart/items/<id>` | Update cart item quantity | Yes |
| DELETE | `/cart/items/<id>` | Remove item from cart | Yes |
| DELETE | `/cart` | Clear cart | Yes |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payments/mpesa/initiate` | Initiate M-Pesa STK push | Yes |
| POST | `/payments/mpesa/callback` | M-Pesa callback (webhook) | No |
| GET | `/payments/<id>/status` | Check payment status | Yes |

### Contact Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/contact` | Submit contact form | No |
| GET | `/contact/info` | Get contact information | No |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Application factory
│   ├── config/
│   │   └── config.py            # Configuration classes
│   ├── models/                  # SQLAlchemy models
│   │   ├── __init__.py          # Database instance
│   │   ├── user.py              # User, CustomerProfile, SupplierProfile
│   │   ├── product.py           # Product, Category, Brand
│   │   ├── order.py             # Order, OrderItem
│   │   ├── cart.py              # Cart, CartItem
│   │   ├── returns.py           # Return, SupplierPayout
│   │   ├── address.py           # Address, DeliveryZone
│   │   ├── notifications.py     # Notification
│   │   ├── otp.py               # OTP verification
│   │   ├── session.py           # User sessions
│   │   └── audit_log.py         # Audit logging
│   ├── routes/                  # API blueprints
│   │   ├── auth.py              # Authentication routes
│   │   ├── products.py          # Product routes
│   │   ├── orders.py            # Order routes
│   │   ├── cart.py              # Cart routes
│   │   ├── payments.py          # Payment routes
│   │   ├── contact.py           # Contact form routes
│   │   └── ...
│   ├── services/                # Business logic
│   │   ├── email_service.py     # Email sending
│   │   ├── google_oauth_service.py  # Google OAuth
│   │   ├── mpesa_service.py     # M-Pesa integration
│   │   └── ...
│   └── utils/                   # Utilities
│       ├── decorators.py        # Role-based access decorators
│       ├── validation.py        # Input validation
│       └── responses.py         # Standard API responses
├── migrations/                  # Alembic migrations
├── .env.example                 # Environment template
├── requirements.txt             # Python dependencies
├── seed_all.py                  # Database seeding script
└── run.py                       # Application entry point
```

---

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `customer` | Regular customer | Browse, purchase, manage orders |
| `supplier` | Product seller | Manage own products, view orders |
| `admin` | Full system access | All permissions |
| `product_manager` | Manage products/categories | Product CRUD, category management |
| `finance_admin` | Manage payments/payouts | View transactions, process payouts |
| `support_admin` | Customer support | Handle returns, customer queries |

---

## Testing

### Run All Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
```

### Run Specific Tests

```bash
pytest tests/test_auth.py -v
```

---

## Common Issues

### psycopg2 Installation Fails

Install PostgreSQL development headers:
```bash
# Ubuntu/Debian
sudo apt-get install libpq-dev python3-dev

# macOS
brew install postgresql

# Windows
# Use psycopg2-binary instead (already in requirements.txt)
```

### Permission Denied on setup.sh

```bash
chmod +x setup.sh
./setup.sh
```

### Database Connection Refused

1. Ensure PostgreSQL is running:
   ```bash
   sudo systemctl start postgresql
   ```

2. Check your DATABASE_URL in `.env`

3. Verify PostgreSQL accepts connections:
   ```bash
   psql -U postgres -h localhost
   ```

---

## License

MIT License - See LICENSE file for details.
