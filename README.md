# Electronics Shop

A full-stack multi-vendor e-commerce platform for electronics, built with Flask (Python) and React. Features include user authentication, product management, shopping cart, M-Pesa payments, supplier dashboards, and admin controls.

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
- [Refund Policy](#refund-policy)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Electronics Shop is a complete e-commerce solution that enables:
- **Customers** to browse, purchase, and track orders for electronics
- **Suppliers** to list products, manage inventory, and track payouts
- **Admins** to oversee the platform, manage users, and process operations

The platform integrates with M-Pesa for mobile payments, Cloudinary for image uploads, and Google OAuth for seamless authentication.

---

## Features

### Customer Features
- User registration and authentication (email/password + Google OAuth)
- Browse products by category, brand, or search
- Product filtering, sorting, and pagination
- Shopping cart management
- Secure checkout with M-Pesa integration
- Order tracking and history
- Product returns and refunds
- User profile management

### Supplier Features
- Supplier registration and verification
- Product management (CRUD operations)
- Inventory tracking with low stock alerts
- Order fulfillment dashboard
- Sales analytics and reports
- Payout tracking and history

### Admin Features
- User management (customers, suppliers, admins)
- Category and brand management
- Order oversight and management
- Supplier payout processing
- Returns and refunds management
- Delivery zone configuration
- Platform-wide analytics

### Technical Features
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Email notifications (order confirmations, password reset)
- Image upload and optimization via Cloudinary
- Responsive design for mobile and desktop
- RESTful API architecture

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.10+ | Runtime |
| Flask 3.x | Web framework |
| PostgreSQL | Database |
| SQLAlchemy | ORM |
| Flask-JWT-Extended | Authentication |
| Flask-Migrate | Database migrations |
| Flask-Mail | Email service |
| Cloudinary | Image uploads |
| Gunicorn | Production server |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19.x | UI library |
| Vite 7.x | Build tool |
| Redux Toolkit | State management |
| React Router 7.x | Routing |
| Tailwind CSS 3.x | Styling |
| Axios | HTTP client |
| Recharts | Analytics charts |

### Integrations
| Service | Purpose |
|---------|---------|
| M-Pesa Daraja API | Mobile payments |
| Google OAuth 2.0 | Social authentication |
| Cloudinary | Image storage |
| Web3Forms | Contact form |

---

## Project Structure

```
electronics-shop/
├── backend/                    # Flask API
│   ├── app/
│   │   ├── config/             # Configuration
│   │   ├── models/             # Database models
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   └── utils/              # Utilities
│   ├── migrations/             # Database migrations
│   ├── .env.example            # Environment template
│   ├── requirements.txt        # Python dependencies
│   ├── seed_all.py             # Database seeder
│   ├── run.py                  # Entry point
│   └── README.md               # Backend documentation
│
├── frontend/
│   └── electricalshop-app/     # React application
│       ├── src/
│       │   ├── components/     # Reusable components
│       │   ├── pages/          # Page components
│       │   ├── store/          # Redux store
│       │   └── layouts/        # Layout components
│       ├── .env.example        # Environment template
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

Ensure you have the following installed:

| Tool | Version | Check Command |
|------|---------|---------------|
| Python | 3.10+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |

---

## Quick Start

The fastest way to get started is using the automated setup script:

```bash
# Clone the repository
git clone https://github.com/your-username/electronics-shop.git
cd electronics-shop

# Make setup script executable
chmod +x setup.sh

# Run setup (installs dependencies, creates database, seeds data)
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

If you prefer to set up manually or the script doesn't work for your system:

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/electronics-shop.git
cd electronics-shop
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Create database
sudo -u postgres createdb electronics_shop
# Or: PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE electronics_shop;"

# Run migrations
export FLASK_APP=run.py
flask db upgrade

# Seed sample data
python seed_all.py

# Return to project root
cd ..
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd frontend/electricalshop-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env if needed

# Return to project root
cd ../..
```

### 4. Configure Environment Variables

**Backend (.env)**
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
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Running the Application

### Option 1: Run Both Servers Together

```bash
./start.sh
```

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python run.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend/electricalshop-app
npm run dev
```

### Option 3: Use Individual Scripts

```bash
# Backend only
./start-backend.sh

# Frontend only
./start-frontend.sh
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

The backend provides a RESTful API. Key endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/products` | GET | List products |
| `/api/products/:id` | GET | Product details |
| `/api/cart` | GET | Get cart |
| `/api/orders` | GET/POST | Orders |
| `/api/payments/mpesa/initiate` | POST | M-Pesa payment |

For complete API documentation, see [Backend README](backend/README.md).

---

## Refund Policy

Electronics Shop implements an enterprise-level refund system with multiple policies:

- **Supplier Fault:** Defective/wrong products - Supplier pays 100%
- **Customer Changed Mind:** 15% restocking fee applies
- **Shipping Damage:** Platform absorbs full cost
- **Fraud:** Supplier pays 110% (includes penalty)

For complete refund policy documentation, see [REFUND_POLICY.md](REFUND_POLICY.md).

---

## Supplier Terms & Conditions

Suppliers must agree to platform terms including:

- **Commission:** 25% platform, 75% supplier
- **Refund Policies:** 4 policies based on return reason
- **Performance Metrics:** Return rate monitoring
- **Payout Terms:** Weekly/monthly payouts via M-Pesa

For complete supplier terms, see [SUPPLIER_TERMS.md](SUPPLIER_TERMS.md).

**API Endpoints:**
- `GET /api/supplier/terms` - View terms
- `POST /api/supplier/terms/accept` - Accept terms
- `GET /api/supplier/terms/status` - Check acceptance

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `setup.sh` | Full project setup (dependencies, database, seeding) |
| `start.sh` | Start both backend and frontend |
| `start-backend.sh` | Start backend server only |
| `start-frontend.sh` | Start frontend dev server only |

---

## Environment Setup by OS

### Ubuntu/Debian

```bash
# Install Python
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Install PostgreSQL dev headers (for psycopg2)
sudo apt install libpq-dev python3-dev
```

### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python

# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql
brew services start postgresql
```

### Windows

1. Download and install [Python](https://www.python.org/downloads/)
2. Download and install [Node.js](https://nodejs.org/)
3. Download and install [PostgreSQL](https://www.postgresql.org/download/windows/)
4. Use Git Bash or WSL for running shell scripts

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000
# Kill it
kill -9 <PID>

# Find process using port 5173
lsof -i :5173
# Kill it
kill -9 <PID>
```

### Permission Denied on Scripts

```bash
chmod +x setup.sh start.sh start-backend.sh start-frontend.sh
```

### npm/pip Install Fails

```bash
# Clear npm cache
npm cache clean --force

# Clear pip cache
pip cache purge

# Reinstall
rm -rf node_modules package-lock.json
npm install

rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
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
- Check existing documentation in [backend/README.md](backend/README.md) and [frontend/README.md](frontend/electricalshop-app/README.md)
