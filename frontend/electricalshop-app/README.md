# Electronics Shop - Frontend

A modern React-based e-commerce frontend for the Electronics Shop multi-vendor platform. Built with Vite, Redux Toolkit, and Tailwind CSS for a fast, responsive shopping experience.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Quick Setup](#quick-setup)
  - [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Features](#features)
- [Pages Overview](#pages-overview)
- [State Management](#state-management)
- [Styling](#styling)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| Vite | 7.x | Build tool and dev server |
| Redux Toolkit | 2.x | State management |
| React Router | 7.x | Client-side routing |
| Tailwind CSS | 3.x | Utility-first CSS |
| Axios | 1.x | HTTP client |
| Recharts | 3.x | Charts and analytics |
| React Toastify | 11.x | Toast notifications |

---

## Prerequisites

Before installing, ensure you have the following installed:

- **Node.js 18 or higher**
  ```bash
  node --version
  ```

- **npm 9 or higher** (comes with Node.js)
  ```bash
  npm --version
  ```

---

## Installation

### Quick Setup

From the project root directory, run the automated setup script:

```bash
./setup.sh
```

This will set up both the backend and frontend, including:
- Installing all npm dependencies
- Creating environment files
- Setting up the development environment

### Manual Setup

If you prefer to set up manually:

#### Step 1: Navigate to Frontend Directory

```bash
cd frontend/electricalshop-app
```

#### Step 2: Install Dependencies

Install all required packages:

```bash
npm install
```

**Individual packages (if npm install fails):**

```bash
# Core React packages
npm install react@^19.2.0
npm install react-dom@^19.2.0

# Routing
npm install react-router-dom@^7.13.0

# State Management
npm install @reduxjs/toolkit@^2.11.2
npm install react-redux@^9.2.0

# HTTP Client
npm install axios@^1.13.4

# UI Components
npm install react-toastify@^11.0.5
npm install recharts@^3.7.0

# Google Authentication
npm install google-auth-library@^10.5.0
npm install @google-cloud/local-auth@^3.0.1
```

**Install dev dependencies:**

```bash
# Build tools
npm install -D vite@^7.2.4
npm install -D @vitejs/plugin-react@^5.1.1

# Styling
npm install -D tailwindcss@^3.4.19
npm install -D postcss@^8.5.6
npm install -D autoprefixer@^10.4.23

# Linting
npm install -D eslint@^9.39.1
npm install -D @eslint/js@^9.39.1
npm install -D eslint-plugin-react-hooks@^7.0.1
npm install -D eslint-plugin-react-refresh@^0.4.24
npm install -D globals@^16.5.0

# TypeScript types (for IDE support)
npm install -D @types/react@^19.2.5
npm install -D @types/react-dom@^19.2.3
```

#### Step 3: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file if needed
nano .env  # or use your preferred editor
```

---

## Configuration

Create a `.env` file in the frontend directory with the following variables:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Backend Base URL (for non-API requests)
VITE_BACKEND_URL=http://localhost:5000

# Google OAuth Client ID (optional - for Google Sign-In)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**Note:** All environment variables must be prefixed with `VITE_` to be accessible in the application.

---

## Running the Application

### Development Mode

```bash
npm run dev
```

The application runs at: **http://localhost:5173**

Features in development mode:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- Source maps for debugging

### Preview Production Build

```bash
npm run build
npm run preview
```

### Linting

```bash
npm run lint
```

---

## Project Structure

```
frontend/electricalshop-app/
├── public/                      # Static assets
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Header.jsx           # Navigation header
│   │   ├── Footer.jsx           # Site footer
│   │   ├── ProductCard.jsx      # Product display card
│   │   ├── ProductFilter.jsx    # Product filtering
│   │   ├── ProductForm.jsx      # Add/edit product form
│   │   ├── GoogleAuth.jsx       # Google sign-in button
│   │   ├── GoogleCallback.jsx   # OAuth callback handler
│   │   ├── LoadingScreen.jsx    # Loading spinner
│   │   ├── ProtectedRoute.jsx   # Auth route guard
│   │   └── PaymentProcessing.jsx # M-Pesa payment UI
│   │
│   ├── layouts/                 # Page layouts
│   │   └── MainLayout.jsx       # Main app layout with header/footer
│   │
│   ├── pages/                   # Page components
│   │   ├── Home.jsx             # Landing page
│   │   ├── Products.jsx         # Product listing
│   │   ├── ProductDetail.jsx    # Single product view
│   │   ├── Cart.jsx             # Shopping cart
│   │   ├── Checkout.jsx         # Checkout process
│   │   ├── Orders.jsx           # Order history
│   │   ├── OrderDetail.jsx      # Single order view
│   │   ├── Login.jsx            # Login page
│   │   ├── Register.jsx         # Registration page
│   │   ├── Profile.jsx          # User profile
│   │   ├── About.jsx            # About us
│   │   ├── ContactUs.jsx        # Contact form
│   │   ├── FAQs.jsx             # FAQ page
│   │   ├── WarrantyInfo.jsx     # Warranty information
│   │   ├── ReturnsPolicy.jsx    # Returns policy
│   │   ├── PrivacyPolicy.jsx    # Privacy policy
│   │   ├── TermsAndConditions.jsx # Terms of service
│   │   │
│   │   ├── Admin/               # Admin dashboard pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── AdminOrders.jsx
│   │   │   ├── AdminCategories.jsx
│   │   │   ├── AdminPayouts.jsx
│   │   │   ├── AdminReturns.jsx
│   │   │   ├── AdminDeliveryZones.jsx
│   │   │   └── AdminAnalytics.jsx
│   │   │
│   │   ├── Supplier/            # Supplier dashboard pages
│   │   │   ├── SupplierDashboard.jsx
│   │   │   ├── SupplierOrders.jsx
│   │   │   ├── SupplierPayouts.jsx
│   │   │   └── SupplierAnalytics.jsx
│   │   │
│   │   ├── Returns/             # Returns management
│   │   │   ├── MyReturns.jsx
│   │   │   ├── RequestReturn.jsx
│   │   │   └── ReturnDetail.jsx
│   │   │
│   │   └── Error pages
│   │       ├── NotFound.jsx     # 404 page
│   │       ├── ServerError.jsx  # 500 page
│   │       └── Maintenance.jsx  # Maintenance page
│   │
│   ├── store/                   # Redux store
│   │   ├── store.js             # Store configuration
│   │   └── slices/              # Redux slices
│   │       ├── authSlice.js     # Authentication state
│   │       ├── productsSlice.js # Products state
│   │       ├── productSlice.js  # Single product CRUD
│   │       ├── cartSlice.js     # Shopping cart state
│   │       └── ordersSlice.js   # Orders state
│   │
│   ├── templates/               # Print templates
│   │   └── PrintTemplates.jsx   # Invoice/receipt templates
│   │
│   ├── App.jsx                  # Main app component with routes
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Global styles and Tailwind imports
│
├── .env.example                 # Environment template
├── package.json                 # Dependencies and scripts
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
└── eslint.config.js             # ESLint configuration
```

---

## Features

### Customer Features
- Browse products by category, brand, or search
- Product filtering and sorting
- Shopping cart management
- Secure checkout with M-Pesa
- Order tracking and history
- Product returns and refunds
- User profile management
- Google OAuth sign-in

### Supplier Features
- Product management (add, edit, delete)
- Order fulfillment dashboard
- Sales analytics and reports
- Payout tracking

### Admin Features
- User management
- Category and brand management
- Order oversight
- Supplier payout processing
- Returns management
- Delivery zone configuration
- Platform analytics

---

## Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with featured products |
| Products | `/products` | Product catalog with filters |
| Product Detail | `/products/:id` | Single product view |
| Cart | `/cart` | Shopping cart |
| Checkout | `/checkout` | Order checkout |
| Orders | `/orders` | Order history |
| Order Detail | `/orders/:id` | Order details |
| Login | `/login` | User login |
| Register | `/register` | User registration |
| Profile | `/profile` | User profile settings |
| Admin Dashboard | `/admin` | Admin control panel |
| Supplier Dashboard | `/supplier` | Supplier control panel |

---

## State Management

The application uses Redux Toolkit for state management with the following slices:

### authSlice
Manages user authentication state:
- `user` - Current logged-in user
- `token` - JWT access token
- `isAuthenticated` - Auth status
- Actions: `login`, `register`, `logout`, `googleLogin`

### productsSlice
Manages product listing:
- `products` - Array of products
- `categories` - Available categories
- `brands` - Available brands
- `pagination` - Pagination info
- Actions: `getProducts`, `getCategories`, `getBrands`

### cartSlice
Manages shopping cart:
- `items` - Cart items
- `total` - Cart total
- Actions: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`

### ordersSlice
Manages orders:
- `orders` - User's orders
- `currentOrder` - Selected order details
- Actions: `getOrders`, `getOrderById`, `createOrder`, `cancelOrder`

---

## Styling

The application uses Tailwind CSS for styling.

### Custom CSS

Global styles are defined in `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component styles go here */
```

---

## Building for Production

### Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # Bundled JavaScript
│   ├── index-[hash].css     # Bundled CSS
│   └── [other assets]
```

### Deployment

The `dist/` folder can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop `dist/` folder
- **Nginx**: Copy `dist/` contents to web root
- **Apache**: Copy `dist/` contents to `htdocs/`

**Important:** For single-page app routing, configure your server to redirect all requests to `index.html`.

**Nginx example:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## Troubleshooting

### npm install fails

Clear npm cache and retry:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Vite dev server not starting

Check if port 5173 is in use:
```bash
# Linux/macOS
lsof -i :5173

# Kill process if needed
kill -9 <PID>
```

### API requests failing

1. Ensure the backend is running at `http://localhost:5000`
2. Check CORS configuration in backend
3. Verify `VITE_API_URL` in `.env`

### Tailwind styles not applying

1. Check that `tailwind.config.js` content paths are correct
2. Ensure `@tailwind` directives are in `index.css`
3. Restart the dev server

### Google OAuth not working

1. Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
2. Add `http://localhost:5173` to authorized origins in Google Console
3. Check browser console for errors

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## License

MIT License - See LICENSE file for details.
