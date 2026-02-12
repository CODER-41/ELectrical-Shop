# Quantum Gear Electronics — Frontend

React-based single-page application for the Quantum Gear Electronics multi-vendor e-commerce platform. Features role-based dashboards for customers, suppliers, delivery agents, and admins with responsive design, Redux state management, and integrated payment flows.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Pages & Routes](#pages--routes)
- [Components](#components)
- [State Management (Redux)](#state-management-redux)
- [Custom Hooks](#custom-hooks)
- [API Client](#api-client)
- [Scripts](#scripts)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| Vite | 7.x | Build tool and dev server |
| Redux Toolkit | 2.x | Global state management |
| React Redux | 9.x | React-Redux bindings |
| React Router DOM | 7.x | Client-side routing |
| Tailwind CSS | 3.x | Utility-first CSS framework |
| Axios | 1.x | HTTP client with interceptors |
| React Hook Form | 7.x | Form state management |
| React Toastify | 11.x | Toast notifications |
| Recharts | 3.x | Charts and analytics graphs |
| React DatePicker | 9.x | Date selection component |

---

## Project Structure

```
src/
├── pages/                      # Page components (50+)
│   ├── Home.jsx                # Landing page
│   ├── Products.jsx            # Product catalog
│   ├── ProductDetail.jsx       # Product detail page
│   ├── Cart.jsx                # Shopping cart
│   ├── Checkout.jsx            # Checkout flow
│   ├── Orders.jsx              # Customer orders
│   ├── OrderDetail.jsx         # Order detail view
│   ├── Login.jsx               # Authentication
│   ├── Register.jsx            # Registration
│   ├── Profile.jsx             # User profile
│   ├── About.jsx               # About page
│   ├── ContactUs.jsx           # Contact form
│   ├── FAQs.jsx                # FAQs
│   ├── Admin/                  # Admin pages (18)
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminAnalytics.jsx
│   │   ├── AdminUsers.jsx
│   │   ├── AdminOrders.jsx
│   │   ├── AdminReturnsManagement.jsx
│   │   ├── AdminPayouts.jsx
│   │   ├── AdminDeliveryZones.jsx
│   │   ├── AdminDeliveryManagement.jsx
│   │   ├── AdminCategories.jsx
│   │   ├── AdminProductManagement.jsx
│   │   ├── AdminSettings.jsx
│   │   ├── AdminAuditLogs.jsx
│   │   ├── AdminFinancialReports.jsx
│   │   ├── AdminNotifications.jsx
│   │   └── AdminActivityTimeline.jsx
│   ├── Supplier/               # Supplier pages (5)
│   │   ├── SupplierDashboard.jsx
│   │   ├── SupplierOrders.jsx
│   │   ├── SupplierAnalytics.jsx
│   │   ├── SupplierPayouts.jsx
│   │   └── SupplierReturns.jsx
│   ├── Delivery/               # Delivery agent pages (3)
│   │   ├── DeliveryDashboard.jsx
│   │   ├── DeliveryOrders.jsx
│   │   └── DeliveryPayouts.jsx
│   └── Returns/                # Customer return pages (3)
│       ├── MyReturns.jsx
│       ├── ReturnDetail.jsx
│       └── RequestReturn.jsx
├── components/                 # Reusable components (15)
│   ├── Header.jsx              # Navigation header (role-aware)
│   ├── Footer.jsx              # Page footer
│   ├── ProtectedRoute.jsx      # Auth-gated route wrapper
│   ├── ProductCard.jsx         # Product display card
│   ├── ProductForm.jsx         # Product create/edit form
│   ├── ProductFilters.jsx      # Advanced product filtering
│   ├── ImageUpload.jsx         # Image file upload handler
│   ├── GoogleAuth.jsx          # Google OAuth component
│   ├── GoogleCallback.jsx      # OAuth callback handler
│   ├── PaymentProcessing.jsx   # Payment processing UI
│   ├── PaymentPhoneManager.jsx # M-Pesa phone input
│   └── LoadingScreen.jsx       # Loading state component
├── store/                      # Redux store
│   ├── store.js                # Store configuration
│   └── slices/
│       ├── authSlice.js        # Authentication state
│       ├── productSlice.js     # Product catalog state
│       ├── supplierProductsSlice.js  # Supplier product management
│       ├── cartSlice.js        # Shopping cart state
│       └── ordersSlice.js      # Orders & addresses state
├── hooks/                      # Custom hooks
│   ├── useAuth.js              # Authentication hook
│   └── usePayment.js           # Payment processing hook
├── utils/
│   └── api.js                  # Axios instance with auth interceptors
├── layouts/
│   └── MainLayout.jsx          # Header + Footer wrapper
├── App.jsx                     # Route definitions
└── main.jsx                    # Application entry point
```

---

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API base URL | `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | `xxx.apps.googleusercontent.com` |
| `VITE_WEB3FORMS_ACCESS_KEY` | Web3Forms API key (contact form) | `your-key` |
| `VITE_CONTACT_EMAIL` | Contact form recipient email | `support@example.com` |

---

## Pages & Routes

### Public Routes (No Authentication)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page |
| `/about` | About | About the company |
| `/contact` | ContactUs | Contact form |
| `/products` | Products | Product catalog with filtering |
| `/products/:slug` | ProductDetail | Individual product page |
| `/terms` | TermsAndConditions | Legal terms |
| `/privacy` | PrivacyPolicy | Privacy information |
| `/faq` | FAQs | Frequently asked questions |
| `/returns` | ReturnsPolicy | Return policy details |
| `/warranty` | WarrantyInfo | Warranty information |
| `/login` | Login | Authentication page |
| `/register` | Register | User registration |
| `/auth/callback` | GoogleCallback | OAuth callback handler |

### Customer Routes (`customer` role)

| Route | Page | Description |
|-------|------|-------------|
| `/cart` | Cart | Shopping cart |
| `/checkout` | Checkout | Order checkout |
| `/orders` | Orders | Order list |
| `/orders/:orderId` | OrderDetail | Order details |
| `/orders/:orderId/confirmation` | OrderConfirmation | Post-purchase confirmation |
| `/payment/verify` | PaymentVerification | Payment status check |
| `/payment/callback` | PaymentCallback | Payment callback handler |
| `/returns` | MyReturns | Customer's return requests |
| `/returns/:returnId` | ReturnDetail | Return request details |
| `/orders/:orderId/items/:itemId/return` | RequestReturn | Submit return request |

### Supplier Routes (`supplier` role)

| Route | Page | Description |
|-------|------|-------------|
| `/supplier/dashboard` | SupplierDashboard | Stats, alerts, quick actions |
| `/supplier/products` | SupplierProducts | Product inventory management |
| `/supplier/products/new` | AddProduct | Create new product |
| `/supplier/products/edit/:id` | EditProduct | Edit existing product |
| `/supplier/orders` | SupplierOrders | Order fulfillment |
| `/supplier/analytics` | SupplierAnalytics | Sales analytics (Recharts) |
| `/supplier/payouts` | SupplierPayouts | Payout history |
| `/supplier/returns` | SupplierReturns | Return requests management |

### Delivery Agent Routes (`delivery_agent` role)

| Route | Page | Description |
|-------|------|-------------|
| `/delivery/dashboard` | DeliveryDashboard | Agent dashboard |
| `/delivery/orders` | DeliveryOrders | Assigned deliveries |
| `/delivery/payouts` | DeliveryPayouts | Delivery earnings |

### Admin Routes (`admin`, `product_manager`, `finance_admin`, `support_admin`)

| Route | Page | Allowed Roles |
|-------|------|--------------|
| `/admin/dashboard` | AdminDashboard | All admin roles |
| `/admin/analytics` | AdminAnalytics | admin, order_manager |
| `/admin/users` | AdminUsers | admin |
| `/admin/orders` | AdminOrders | admin, order_manager |
| `/admin/returns` | AdminReturnsManagement | admin, order_manager |
| `/admin/payouts` | AdminPayouts | admin |
| `/admin/delivery-zones` | AdminDeliveryZones | admin |
| `/admin/categories` | AdminCategories | admin, product_manager |
| `/admin/delivery` | AdminDeliveryManagement | admin, support_admin |
| `/admin/products` | AdminProductManagement | admin, product_manager |
| `/admin/settings` | AdminSettings | admin |
| `/admin/audit-logs` | AdminAuditLogs | admin |
| `/admin/reports/financial` | AdminFinancialReports | admin, finance_admin |
| `/admin/notifications` | AdminNotifications | admin |
| `/admin/activity` | AdminActivityTimeline | admin |

### Shared Protected Routes (All authenticated users)

| Route | Page | Description |
|-------|------|-------------|
| `/profile` | Profile | User profile view |
| `/profile/edit` | EditProfile | Edit profile |
| `/settings` | Settings | User settings |

---

## Components

| Component | Description |
|-----------|-------------|
| **Header** | Role-aware navigation with desktop and mobile menu. Shows different nav links per role (customer, supplier, delivery_agent, admin). Includes cart badge for customers. |
| **Footer** | Site footer with links, contact info, and social media |
| **ProtectedRoute** | Route wrapper that checks authentication and `allowedRoles` prop. Redirects to `/login` if not authenticated. |
| **ProductCard** | Displays product thumbnail, name, price, stock status, and add-to-cart action |
| **ProductForm** | Form for creating/editing products with image upload, category/brand selection, pricing, and stock |
| **ProductFilters** | Advanced filtering sidebar — category, brand, price range, condition, stock, sort |
| **ImageUpload** | Cloudinary image upload with preview, drag-and-drop support |
| **GoogleAuth** | Google Sign-In button component |
| **GoogleCallback** | Handles OAuth redirect and token exchange |
| **PaymentProcessing** | Payment method selection (M-Pesa / Card / Cash) and processing UI |
| **PaymentPhoneManager** | M-Pesa phone number input with Kenyan format validation |
| **LoadingScreen** | Full-screen loading spinner |
| **MainLayout** | Layout wrapper: `<Header />` + `<Outlet />` + `<Footer />` |

---

## State Management (Redux)

The Redux store is configured with 5 slices:

### Auth Slice (`authSlice.js`)
Manages user authentication state.

**State:** `{ user, token, isError, isSuccess, isLoading, message }`

**Async Thunks:**
- `register(userData)` — Register new user
- `login(credentials)` — Login and get JWT
- `logout()` — Clear session
- `updateProfile(data)` — Update user profile
- `changePassword(data)` — Change password

**Actions:** `reset()`, `setCredentials()`, `updateToken()`, `updateUser()`, `clearAuth()`

### Cart Slice (`cartSlice.js`)
Manages shopping cart with localStorage persistence.

**State:** `{ items, totalItems, totalPrice }`

**Actions:**
- `addToCart(product)` — Add product (increments if exists)
- `removeFromCart(productId)` — Remove item
- `updateQuantity({ productId, quantity })` — Set quantity
- `incrementQuantity(productId)` / `decrementQuantity(productId)`
- `clearCart()` — Empty cart
- `syncCartWithProducts(products)` — Sync stock availability

### Products Slice (`productSlice.js`)
Manages product catalog data.

**State:** `{ products, currentProduct, categories, brands, pagination, filters, isLoading }`

**Async Thunks:**
- `getProducts(params)` — Fetch products with filters/pagination
- `getProduct(id)` / `getProductBySlug(slug)` — Get single product
- `getCategories()` / `getBrands()` — Fetch taxonomy
- `createProduct(data)` / `updateProduct(data)` / `deleteProduct(id)`

**Actions:** `reset()`, `setFilters()`, `clearFilters()`, `clearCurrentProduct()`

### Supplier Products Slice (`supplierProductsSlice.js`)
Manages supplier-specific product CRUD.

**State:** `{ products, categories, brands, filters, isLoading }`

**Async Thunks:** `getProducts()`, `createProduct()`, `updateProduct()`, `uploadProductImage()`, `getCategories()`, `getBrands()`

### Orders Slice (`ordersSlice.js`)
Manages orders, addresses, and delivery zones.

**State:** `{ addresses, deliveryZones, selectedAddress, deliveryFee, orders, currentOrder, isLoading }`

**Async Thunks:**
- Address: `getAddresses()`, `createAddress()`, `updateAddress()`, `deleteAddress()`
- Delivery: `getDeliveryZones()`, `calculateDeliveryFee(county)`
- Orders: `createOrder()`, `getOrders()`, `getOrder()`, `cancelOrder()`

---

## Custom Hooks

### `useAuth()`
Authentication state and actions.

```js
const {
  user,              // Current user object
  token,             // JWT access token
  isAuthenticated,   // Boolean
  isLoading,
  logout,            // Sign out function
  updateProfile,     // Update profile data
  changePassword,    // Change password
  updateUser,        // Update user in state
} = useAuth();
```

### `usePayment()`
Payment processing for M-Pesa and Paystack.

```js
const {
  isProcessing,               // Payment in progress
  paymentStatus,              // Current status
  initiateMpesaPayment,      // STK Push (orderId, phone)
  initiateCardPayment,       // Paystack redirect (orderId)
  verifyCardPayment,         // Verify Paystack (reference)
  checkPaymentStatus,        // Check status (orderId)
  queryMpesaStatus,          // Query M-Pesa (orderId)
  pollMpesaStatus,           // Poll until complete
  checkMpesaConfig,          // Verify M-Pesa setup
} = usePayment();
```

---

## API Client

The `utils/api.js` module exports a configured Axios instance:

- **Base URL:** `VITE_BACKEND_URL + '/api'` (defaults to `http://localhost:5000/api`)
- **Request interceptor:** Automatically attaches `Authorization: Bearer <token>` from localStorage
- **Response interceptor:** On 401 errors, clears auth state and redirects to `/login`

Usage:
```js
import api from '../utils/api';

// GET request (token auto-attached)
const { data } = await api.get('/products');

// POST request
await api.post('/orders', orderData);
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (http://localhost:5173) |
| `npm run build` | Build for production (output: `./build/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
