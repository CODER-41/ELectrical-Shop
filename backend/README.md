# Electronics Shop - Backend API

Flask-based REST API for the Electronics Shop multi-vendor e-commerce platform.

## Tech Stack

- **Framework:** Flask 3.x
- **Database:** PostgreSQL with SQLAlchemy ORM
- **Authentication:** JWT (Flask-JWT-Extended) + Google OAuth 2.0
- **Email:** Flask-Mail
- **File Upload:** Cloudinary
- **Payments:** M-Pesa Daraja API
- **Migrations:** Flask-Migrate (Alembic)

## Quick Setup

From the project root, run:

```bash
./setup.sh
```

This will automatically set up the backend, frontend, database, and run migrations.

## Manual Setup

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Setup Database

```bash
# Create PostgreSQL database
sudo -u postgres createdb electronics_shop

# Or with password
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE electronics_shop;"
```

### 5. Run Migrations

```bash
export FLASK_APP=run.py
flask db upgrade
```

### 6. Start Server

```bash
python run.py
```

Server runs at: http://localhost:5000

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/send-otp` | Send OTP to email |
| POST | `/api/auth/verify-otp` | Verify OTP code |
| GET | `/api/auth/google` | Initiate Google OAuth |
| POST | `/api/auth/google/token` | Authenticate with Google ID token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/change-password` | Change password (authenticated) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/<id>` | Get product details |
| POST | `/api/products` | Create product (supplier) |
| PUT | `/api/products/<id>` | Update product |
| DELETE | `/api/products/<id>` | Delete product |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders |
| GET | `/api/orders/<id>` | Get order details |
| POST | `/api/orders` | Create order |
| POST | `/api/orders/<id>/cancel` | Cancel order |
| PUT | `/api/orders/<id>/status` | Update order status |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart/items` | Add item to cart |
| PUT | `/api/cart/items/<id>` | Update cart item |
| DELETE | `/api/cart/items/<id>` | Remove from cart |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Submit contact form |
| GET | `/api/contact/info` | Get contact information |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## Project Structure

```
backend/
├── app/
│   ├── __init__.py          # App factory
│   ├── config/
│   │   └── config.py        # Configuration classes
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── order.py
│   │   ├── cart.py
│   │   └── ...
│   ├── routes/              # API blueprints
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── orders.py
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── email_service.py
│   │   ├── google_oauth_service.py
│   │   └── ...
│   └── utils/               # Utilities
│       ├── decorators.py    # Role-based decorators
│       ├── validation.py
│       └── responses.py
├── migrations/              # Database migrations
├── .env.example             # Environment template
├── requirements.txt         # Python dependencies
└── run.py                   # Entry point
```

## User Roles

| Role | Description |
|------|-------------|
| `customer` | Regular customer |
| `supplier` | Product seller |
| `admin` | Full system access |
| `product_manager` | Manage products/categories |
| `finance_admin` | Manage payments/payouts |
| `support_admin` | Customer support |

## Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret for JWT tokens
- `MAIL_*` - Email configuration
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth
- `CLOUDINARY_*` - Image upload
- `MPESA_*` - M-Pesa payments
- `WEB3FORMS_ACCESS_KEY` - Contact form

## Running Tests

```bash
pytest
```

## License

MIT
