Electronics Shop - MVP Masterplan
1. Executive Summary
Project Overview
Electronics Shop is a multi-vendor e-commerce marketplace focused on selling electronic products to local
Kenyan customers. The platform connects suppliers with customers, handling quality control, payments, and
delivery coordination while taking a 25% commission on all sales.
Vision Statement
To become the trusted platform for Kenyans to purchase quality electronics from verified suppliers, offering
both budget-friendly and premium options with reliable delivery and warranty protection.
Core Value Proposition
For Customers: Safe, convenient electronics shopping with quality guarantees, flexible payment options
(M-Pesa, cards, cash on delivery), and warranty tracking
For Suppliers: Access to customers without inventory risk, automated order notifications, self-service
product management, and weekly guaranteed payouts
For the Business: Scalable marketplace model with automated commission collection, quality control,
and comprehensive analytics
2. Target Audience
Primary Users
1. Customers (End Buyers)
Demographics: Kenyan consumers, all income levels
Segments:
Budget-conscious shoppers seeking affordable electronics
Premium buyers looking for high-end products
Tech-savvy young professionals
Families replacing/upgrading home appliances
Needs: Trustworthy sellers, competitive pricing, flexible payments, delivery convenience, warranty
assurance
2. Suppliers (Vendors)
Profile: Electronics suppliers and retailers across KenyaNeeds: Customer access, simplified order management, reliable payouts, inventory control, sales
visibility
3. Platform Administrators
Roles: Super Admin, Product Managers, Order Managers, Customer Support
Needs: Operational control, analytics, user management, quality oversight
3. Core Features & Functionality
3.1 Customer Features
Account Management
Registration & Authentication
Email-based registration (mandatory for purchases)
Secure login with JWT authentication
Email-based 2FA for enhanced security
Password reset functionality
Session timeout after inactivity
Profile management (personal details, delivery addresses, M-Pesa number)
Product Discovery
Browse & Search
Category-based browsing (Phones, Laptops, TVs, Kitchen Appliances, Gaming, Accessories)
Text search by product name, brand, specifications
Filter by: price range, brand, category, stock availability
Sort by: price (low-high, high-low), newest, best-selling
Product Details
Single high-quality product image (expandable)
Flexible specifications (JSON-based, category-specific)
Brand information
Warranty period
Condition (New/Refurbished)
Stock availability count
Supplier information
Product description (short & detailed)Product Comparison
Side-by-side specification comparison
Compare up to 3 products simultaneously
Ideal for electronics decision-making
Recommendations
"You might also like" based on viewed products
"Frequently bought together" suggestions
Shopping Experience
Shopping Cart
Add/remove products
Update quantities (within stock limits)
View subtotal
Persistent cart (saved to user account)
Stock validation before checkout
Checkout Process
Review cart items
Select/add delivery address
Choose delivery location (fixed rate per zone)
View delivery fee calculation
Select payment method:
M-Pesa (Safaricom Daraja API)
Card Payment (via payment gateway)
Cash on Delivery
Generate billing information automatically
Create invoice for every order
Order confirmation
Order Management
Order Tracking
Real-time order status (polling every 10-30 seconds)
Status stages: Order Placed → Payment Confirmed → Quality Check → Shipped → Delivered
Email notifications at each stage
In-app notification center
Estimated delivery timeframesCourier contact information
Order History
Complete purchase history
Reorder functionality
Download invoices
View warranty expiration dates
Returns & Warranty
Returns Process
7-day return window for unopened/unused items
14-day return window for defective products
Category-specific policies (if applicable)
In-platform return request submission
Track return status
Warranty Tracking
Automatic warranty period storage per product
Warranty expiration email reminders (30 days before, 7 days before)
Warranty claim submission
3.2 Supplier Features
Supplier Dashboard
Account Setup
Registration with business details
M-Pesa phone number for payouts
Tax/business registration information
Profile verification by admin
Product Management (Self-Service)
Product CRUD Operations
Add new products with:
Product name, brand, category
Single product image (upload to Cloudinary)
Flexible specifications (JSON key-value pairs with suggested templates)
Warranty periodCondition
Stock quantity
Pricing (supplier sets final customer price, system calculates 25% commission automatically)
Edit existing products
Delete products (soft delete, maintains order history)
Bulk upload products (CSV import - Phase 2)
Inventory Management
Real-time stock level updates
Low stock alerts
Stock history tracking
Order & Sales Management
Order Notifications
Email notification when new order placed
In-app notification center
Order details: product, quantity, customer delivery location, total amount
Order Fulfillment Tracking
View orders by status (pending quality check, approved, shipped, delivered)
Coordinate product delivery for quality check
Financial Dashboard
Weekly payout schedule visibility
View earnings per product/order
Commission breakdown (75% to supplier, 25% to platform)
Outstanding balance owed
Payout history
Return deductions tracking (carried forward if insufficient funds)
Performance Analytics
Sales Metrics (Supplier View)
Total sales volume
Best-selling products
Revenue trends (weekly/monthly)
Return rate for products
3.3 Admin FeaturesUser Management
Role-Based Access Control (RBAC)
Super Admin: Full system access, user management, financial oversight
Product Manager: Product approval, catalog management, supplier coordination
Order Manager: Order processing, customer service, delivery coordination
Customer Support: View-only access, customer assistance
User Administration
Add/edit/deactivate admin users
Assign roles and permissions
Audit log of admin actions
Supplier Management
Approve/reject supplier registrations
View supplier performance metrics
Manage supplier accounts (suspend/activate)
Product & Catalog Management
Product Oversight
Review and approve new supplier products (optional quality gate)
Edit any product details
Remove products (with supplier notification)
Manage categories and brands
Feature products on homepage (Phase 2)
Order Management
Order Operations
View all orders (filterable by status, date, supplier, customer)
Update order status manually
Handle customer support inquiries
Process returns and refunds
Generate shipping labels
Coordinate with couriers
Payment & Commission Management
Financial OperationsView all transactions (M-Pesa, card, cash)
Track commission collected (25% per order)
Weekly supplier payout processing
Send batch M-Pesa payments to suppliers via B2C API
Handle return deductions
Generate payout reports
Reconciliation dashboard
Analytics & Reporting (Phase 1 - MVP)
Product Analytics
Best-selling products (by category, by supplier)
Products with low stock or out of stock
Stock level alerts
Order Analytics
Daily/weekly/monthly sales revenue
Order status breakdown (pending, shipped, delivered, returned)
Peak ordering days/times (basic tracking)
Supplier Analytics
Top-performing suppliers by sales volume
Outstanding payments owed to each supplier
Supplier return rates (basic tracking)
Financial Analytics
Total commission earned
Commission vs supplier payouts (balance overview)
Revenue trends over time
System Health
Total active users (customers, suppliers)
New registrations
Order fulfillment times (basic tracking)
System Configuration
Delivery ZonesSet delivery locations and fixed rates
Update pricing as needed
Email Templates
Customize transactional emails
Notification settings
Payment Gateway Configuration
M-Pesa Daraja API credentials (sandbox → production)
Card payment gateway settings
4. Technical Architecture
4.1 Technology Stack
Frontend
Framework: React 18+
State Management: Redux Toolkit
Routing: React Router v6
Styling: Tailwind CSS (mobile-first responsive design)
HTTP Client: Axios
Form Handling: React Hook Form with Yup validation
Notifications: React Toastify
Image Handling: Cloudinary React SDK
Testing: Jest + React Testing Library
Build Tool: Vite
Deployment: Vercel
Backend
Framework: Flask 3+ (Python)
API Style: RESTful API
Authentication: Flask-JWT-Extended
ORM: SQLAlchemy
Database Migrations: Alembic
Email Service: Flask-Mail (SMTP)
Payment Integration:Safaricom Daraja API (M-Pesa)
Payment gateway SDK for cards (e.g., Flutterwave, Paystack)
Image Storage: Cloudinary Python SDK
Task Queue: Celery with Redis (for async tasks like email sending, payout processing) - Phase 2
Testing: Unittest (Minitests)
CORS: Flask-CORS
Environment Management: python-dotenv
Deployment: Render
Database
Primary Database: PostgreSQL 14+
Hosting: Render (Starter plan $7/month for production)
Connection Pooling: SQLAlchemy built-in pooling
Third-Party Services
Image CDN: Cloudinary (Free tier: 25GB storage, 25GB bandwidth/month)
Email Delivery: SMTP service (Gmail SMTP for MVP, migrate to SendGrid/Mailgun for scale)
Payment Processing:
Safaricom Daraja API (M-Pesa STK Push, B2C for supplier payouts)
Card payment gateway (Flutterwave or Paystack)
Monitoring: Sentry for error tracking (optional for MVP)
4.2 System Architecture Overview
┌─────────────────────────────────────────────────────────────┐
│
CLIENT LAYER (Vercel)
│
│ ┌────────────────────────────────────────────────────────┐ │
│ │ React SPA + Redux Toolkit
││
│ │ - Customer Interface││
│ │ - Supplier Dashboard││
│ │ - Admin Panel
││
│ └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
│ HTTPS
▼
┌─────────────────────────────────────────────────────────────┐
│
API LAYER (Render)
│
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Flask REST API
│ │ - JWT Authentication + 2FA
││
│││ │ - Role-Based Access Control
││
│ │ - Business Logic
││
│ │ - Payment Processing││
│ │ - Order Management││
│ └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
│
┌─────────────────┼─────────────────┐
▼
▼
▼
┌──────────────────┐ ┌──────────────┐ ┌─────────────────┐
│ PostgreSQL
│ │ Cloudinary │ │ External APIs │
│ (Render)│ │ (Images)
│ - User Data│││ │ - Payment GW │
│ - Products│││ │ - Email SMTP │
│ - Orders││││
│ - Transactions │ │
│ │ - Daraja API │
││
│
│
└──────────────────┘ └──────────────┘ └─────────────────┘
4.3 Database Schema Design
Core Entities & Relationships
Users Table
id (UUID, Primary Key)
email (String, Unique, Indexed)
password_hash (String)
role (Enum: customer, supplier, admin, product_manager, order_manager, support)
is_active (Boolean)
is_verified (Boolean)
two_fa_enabled (Boolean)
two_fa_secret (String, Nullable)
created_at (Timestamp)
updated_at (Timestamp)
last_login (Timestamp)
Customer Profiles Table
id (UUID, Primary Key)
user_id (UUID, Foreign Key → Users)
first_name (String)
last_name (String)
phone_number (String)mpesa_number (String, Nullable)
default_address_id (UUID, Foreign Key → Addresses, Nullable)
created_at (Timestamp)
updated_at (Timestamp)
Supplier Profiles Table
id (UUID, Primary Key)
user_id (UUID, Foreign Key → Users)
business_name (String)
business_registration_number (String, Nullable)
contact_person (String)
phone_number (String)
mpesa_number (String) - For payouts
payout_method (Enum: phone, paybill, till)
commission_rate (Decimal, Default: 0.25)
outstanding_balance (Decimal, Default: 0.00) - Can be negative for deductions
total_sales (Decimal, Default: 0.00)
is_approved (Boolean, Default: False)
created_at (Timestamp)
updated_at (Timestamp)
Admin Profiles Table
id (UUID, Primary Key)
user_id (UUID, Foreign Key → Users)
first_name (String)
last_name (String)
phone_number (String)
permissions (JSON) - Granular permissions
created_at (Timestamp)
updated_at (Timestamp)
Addresses Table
id (UUID, Primary Key)
user_id (UUID, Foreign Key → Users)
label (String) - e.g., "Home", "Office"full_name (String)
phone_number (String)
address_line_1 (String)
address_line_2 (String, Nullable)
city (String)
county (String)
delivery_zone_id (UUID, Foreign Key → Delivery Zones)
postal_code (String, Nullable)
is_default (Boolean)
created_at (Timestamp)
updated_at (Timestamp)
Delivery Zones Table
id (UUID, Primary Key)
zone_name (String) - e.g., "Nairobi CBD", "Westlands", "Mombasa"
delivery_fee (Decimal)
is_active (Boolean)
created_at (Timestamp)
updated_at (Timestamp)
Categories Table
id (UUID, Primary Key)
name (String, Unique) - e.g., "Mobile Phones & Tablets"
slug (String, Unique, Indexed)
description (Text, Nullable)
suggested_specs (JSON) - Template for product specifications
is_active (Boolean)
created_at (Timestamp)
updated_at (Timestamp)
Brands Table
id (UUID, Primary Key)
name (String, Unique)
logo_url (String, Nullable)
is_active (Boolean)
created_at (Timestamp)Products Table
id (UUID, Primary Key)
supplier_id (UUID, Foreign Key → Supplier Profiles)
category_id (UUID, Foreign Key → Categories)
brand_id (UUID, Foreign Key → Brands)
name (String, Indexed)
slug (String, Unique, Indexed)
short_description (String, 200 chars)
long_description (Text)
specifications (JSON) - Flexible key-value pairs
condition (Enum: new, refurbished)
warranty_period_months (Integer)
price (Decimal) - Final customer price
supplier_earnings (Decimal) - Auto-calculated: price * 0.75
platform_commission (Decimal) - Auto-calculated: price * 0.25
stock_quantity (Integer)
low_stock_threshold (Integer, Default: 10)
image_url (String) - Cloudinary URL
is_active (Boolean)
view_count (Integer, Default: 0)
purchase_count (Integer, Default: 0)
created_at (Timestamp)
updated_at (Timestamp)
Orders Table
id (UUID, Primary Key)
order_number (String, Unique, Indexed) - e.g., "ORD-20260127-00001"
customer_id (UUID, Foreign Key → Customer Profiles)
delivery_address_id (UUID, Foreign Key → Addresses)
subtotal (Decimal) - Sum of products
delivery_fee (Decimal)
total_amount (Decimal) - subtotal + delivery_fee
payment_method (Enum: mpesa, card, cash_on_delivery)
payment_status (Enum: pending, completed, failed, refunded)order_status (Enum: placed, payment_confirmed, quality_check, shipped, delivered, cancelled, returned)
payment_reference (String, Nullable) - M-Pesa/Card transaction ID
paid_at (Timestamp, Nullable)
shipped_at (Timestamp, Nullable)
delivered_at (Timestamp, Nullable)
courier_name (String, Nullable)
courier_contact (String, Nullable)
tracking_number (String, Nullable)
notes (Text, Nullable)
created_at (Timestamp)
updated_at (Timestamp)
Order Items Table
id (UUID, Primary Key)
order_id (UUID, Foreign Key → Orders)
product_id (UUID, Foreign Key → Products)
supplier_id (UUID, Foreign Key → Supplier Profiles)
product_name (String) - Snapshot at purchase
product_price (Decimal) - Snapshot at purchase
quantity (Integer)
subtotal (Decimal) - price * quantity
supplier_earnings (Decimal) - subtotal * 0.75
platform_commission (Decimal) - subtotal * 0.25
warranty_expiry_date (Date) - Calculated from purchase date + warranty period
created_at (Timestamp)
Transactions Table
id (UUID, Primary Key)
order_id (UUID, Foreign Key → Orders)
transaction_type (Enum: customer_payment, supplier_payout, refund, return_deduction)
payment_method (Enum: mpesa, card, cash_on_delivery)
amount (Decimal)
status (Enum: pending, completed, failed)
reference_number (String) - External transaction ID
mpesa_receipt_number (String, Nullable)
description (Text)metadata (JSON) - Store additional payment details
processed_at (Timestamp, Nullable)
created_at (Timestamp)
Supplier Payouts Table
id (UUID, Primary Key)
supplier_id (UUID, Foreign Key → Supplier Profiles)
payout_period_start (Date)
payout_period_end (Date)
total_earnings (Decimal)
deductions (Decimal) - Returns from previous periods
net_payout (Decimal) - total_earnings - deductions
payout_method (Enum: mpesa_phone, mpesa_paybill, mpesa_till)
mpesa_number (String)
status (Enum: pending, processing, completed, failed)
mpesa_transaction_id (String, Nullable)
processed_at (Timestamp, Nullable)
processed_by (UUID, Foreign Key → Users, Nullable)
notes (Text, Nullable)
created_at (Timestamp)
Returns Table
id (UUID, Primary Key)
order_item_id (UUID, Foreign Key → Order Items)
order_id (UUID, Foreign Key → Orders)
customer_id (UUID, Foreign Key → Customer Profiles)
supplier_id (UUID, Foreign Key → Supplier Profiles)
return_reason (Enum: defective, wrong_item, changed_mind, other)
return_description (Text)
return_type (Enum: unopened_7day, defective_14day)
return_amount (Decimal)
refund_method (Enum: mpesa, original_payment_method)
status (Enum: requested, approved, rejected, refund_processed)
requested_at (Timestamp)
reviewed_at (Timestamp, Nullable)reviewed_by (UUID, Foreign Key → Users, Nullable)
refunded_at (Timestamp, Nullable)
admin_notes (Text, Nullable)
created_at (Timestamp)
updated_at (Timestamp)
Notifications Table
id (UUID, Primary Key)
user_id (UUID, Foreign Key → Users)
type (Enum: order_update, payment, payout, return, warranty_reminder, system)
title (String)
message (Text)
is_read (Boolean, Default: False)
action_url (String, Nullable) - Deep link to relevant page
created_at (Timestamp)
Audit Logs Table
id (UUID, Primary Key)
user_id (UUID, Foreign Key → Users)
action (String) - e.g., "product_created", "order_cancelled"
entity_type (String) - e.g., "product", "order", "user"
entity_id (UUID)
old_values (JSON, Nullable)
new_values (JSON, Nullable)
ip_address (String)
user_agent (String)
created_at (Timestamp)
Sessions Table
id (UUID, Primary Key)
user_id (UUID, Foreign Key → Users)
token (String, Unique, Indexed)
refresh_token (String, Unique, Indexed, Nullable)
ip_address (String)
user_agent (String)
expires_at (Timestamp)created_at (Timestamp)
last_activity (Timestamp)
Key Database Relationships
1. Users → One-to-One → Customer/Supplier/Admin Profiles (via user_id)
2. Users → One-to-Many → Addresses
3. Suppliers → One-to-Many → Products
4. Products → Many-to-One → Categories
5. Products → Many-to-One → Brands
6. Orders → Many-to-One → Customers
7. Orders → One-to-Many → Order Items
8. Order Items → Many-to-One → Products (snapshot relationship)
9. Order Items → Many-to-One → Suppliers
10. Orders → One-to-Many → Transactions
11. Suppliers → One-to-Many → Supplier Payouts
12. Order Items → One-to-One → Returns
4.4 API Architecture
Authentication Endpoints
POST /api/auth/register - Customer/Supplier registration
POST /api/auth/login - Login (returns JWT + refresh token)
POST /api/auth/logout - Logout (invalidate session)
POST /api/auth/refresh - Refresh JWT token
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password - Reset password with token
POST /api/auth/verify-email - Verify email address
POST /api/auth/enable-2fa - Enable 2FA
POST /api/auth/verify-2fa - Verify 2FA code
Customer Endpoints
GET /api/products - List products (with filters, search, pagination)
GET /api/products/:id - Get product details
GET /api/products/compare - Compare multiple products
GET /api/products/recommendations - Get product recommendations
GET /api/categories - List categoriesGET /api/brands - List brands
POST /api/cart - Add item to cart
PUT /api/cart/:id - Update cart item
DELETE /api/cart/:id - Remove cart item
GET /api/cart - Get cart contents
POST /api/orders - Create order
GET /api/orders - List customer's orders
GET /api/orders/:id - Get order details
GET /api/orders/:id/track - Track order status (polling endpoint)
POST /api/returns - Request return
GET /api/returns - List customer's returns
GET /api/addresses - List delivery addresses
POST /api/addresses - Add address
PUT /api/addresses/:id - Update address
DELETE /api/addresses/:id - Delete address
GET /api/notifications - Get notifications
PUT /api/notifications/:id/read - Mark notification as read
Supplier Endpoints
GET /api/supplier/dashboard - Supplier dashboard stats
GET /api/supplier/products - List supplier's products
POST /api/supplier/products - Add new product
PUT /api/supplier/products/:id - Update product
DELETE /api/supplier/products/:id - Delete product
PUT /api/supplier/products/:id/stock - Update stock quantity
GET /api/supplier/orders - List orders for supplier's products
GET /api/supplier/orders/:id - Get order details
GET /api/supplier/payouts - List payout history
GET /api/supplier/payouts/upcoming - View upcoming payout
GET /api/supplier/analytics - Supplier performance metrics
PUT /api/supplier/profile - Update supplier profile
Admin Endpoints
GET /api/admin/dashboard - Admin dashboard analytics
GET /api/admin/users - List all users (with role filter)POST /api/admin/users - Create admin user
PUT /api/admin/users/:id - Update user
DELETE /api/admin/users/:id - Deactivate user
PUT /api/admin/suppliers/:id/approve - Approve supplier
PUT /api/admin/suppliers/:id/suspend - Suspend supplier
GET /api/admin/products - List all products
PUT /api/admin/products/:id - Edit any product
DELETE /api/admin/products/:id - Remove product
GET /api/admin/orders - List all orders (with filters)
PUT /api/admin/orders/:id/status - Update order status
GET /api/admin/returns - List all returns
PUT /api/admin/returns/:id - Approve/reject return
GET /api/admin/transactions - List all transactions
GET /api/admin/payouts - List all payouts
POST /api/admin/payouts/process - Process weekly payouts (batch)
GET /api/admin/analytics/products - Product analytics
GET /api/admin/analytics/orders - Order analytics
GET /api/admin/analytics/suppliers - Supplier analytics
GET /api/admin/analytics/financial - Financial analytics
GET /api/admin/delivery-zones - List delivery zones
POST /api/admin/delivery-zones - Add delivery zone
PUT /api/admin/delivery-zones/:id - Update zone
DELETE /api/admin/delivery-zones/:id - Delete zone
GET /api/admin/audit-logs - View audit logs
Payment Endpoints
POST /api/payments/mpesa/stk-push - Initiate M-Pesa payment
POST /api/payments/mpesa/callback - M-Pesa callback handler
POST /api/payments/card/initialize - Initialize card payment
POST /api/payments/card/callback - Card payment callback
POST /api/payments/verify/:reference - Verify payment status
4.5 Security Implementation
Authentication & Authorization
JWT Tokens: Short-lived access tokens (15 min), long-lived refresh tokens (7 days)Password Security: Bcrypt hashing with salt rounds = 12
2FA: Email-based TOTP (Time-based One-Time Password)
Session Management: Track active sessions, force logout on password change
Session Timeout: Auto-logout after 30 minutes of inactivity
RBAC: Role-based middleware on all protected routes
Data Protection
HTTPS: Enforced on all endpoints (Vercel & Render handle SSL)
CORS: Whitelist only frontend domain
SQL Injection Prevention: SQLAlchemy ORM with parameterized queries
XSS Protection: Input sanitization, Content Security Policy headers
CSRF Protection: CSRF tokens for state-changing operations
Rate Limiting: Flask-Limiter to prevent brute force (e.g., 5 login attempts per 15 min)
Environment Variables: Secrets stored in .env, never in code
Payment Security
PCI Compliance: Never store card details; use payment gateway tokenization
M-Pesa Security: Validate all callbacks with security credentials, verify transaction IDs
Transaction Integrity: Idempotency keys for payment operations
Audit Trail: Log all payment attempts, successes, failures
File Upload Security
Image Validation: Check file types, size limits (max 5MB)
Cloudinary: Handles image processing, no direct file system access
Signed URLs: Use Cloudinary signed uploads for added security
5. User Interface Design Principles
5.1 Design Philosophy
Mobile-First: Kenyan users primarily shop on mobile devices
Performance: Fast load times even on 3G connections
Simplicity: Clear navigation, minimal clicks to purchase
Trust Signals: Professional design, clear policies, secure payment indicators
Accessibility: WCAG 2.1 AA compliance5.2 Figma Wireframe Recommendations
Key Screens to Design
Customer Screens (Mobile Priority)
1. Homepage
Hero section with search bar
Category tiles (6 main categories)
Featured/trending products carousel
"How it works" section (trust building)
Footer with policies, contact
2. Product Listing Page
Filter sidebar (collapsible on mobile)
Product grid (2 columns mobile, 4 columns desktop)
Search bar at top
Sort dropdown
Pagination/infinite scroll
3. Product Detail Page
Product image (zoomable)
Product name, brand, price
Stock availability badge
Specifications accordion
Add to cart button (sticky on mobile)
Warranty info badge
Product description tabs
"You might also like" section
4. Product Comparison Page
Side-by-side spec comparison table
Up to 3 products
Highlight differences
Quick add to cart for each
5. Shopping Cart
Cart items list
Quantity selectors with stock validation
Remove item option
Subtotal"Continue Shopping" and "Checkout" CTAs
6. Checkout Page
Order summary (sticky on mobile)
Delivery address selection/add new
Delivery zone selection → fee calculation
Payment method selection (M-Pesa, Card, Cash)
Order total breakdown
Place order button
7. Order Confirmation Page
Success message
Order number
Order summary
Estimated delivery date
Track order CTA
8. Order Tracking Page
Progress stepper (visual order status)
Real-time status updates (polling)
Courier contact info (when shipped)
Expected delivery date
Order details accordion
9. My Orders Page
Order list with filters (status, date)
Order cards with: order number, date, total, status, quick actions
Search orders
10. Account/Profile Page
Personal info section
Saved addresses
Order history
Returns history
Warranty tracker
Notification preferences
Security settings (2FA toggle)
11. Return Request Page
Select order itemReturn reason selection
Description text area
Submit return button
12. Login/Register Pages
Email + password fields
Social login buttons (Phase 2)
"Forgot password" link
2FA code entry (if enabled)
Supplier Dashboard Screens
1. Supplier Dashboard Home
Sales summary cards (weekly earnings, pending orders, low stock alerts)
Recent orders list
Quick actions (add product, view payouts)
2. Product Management Page
Product list table with search/filter
Quick edit/delete actions
"Add New Product" button
3. Add/Edit Product Form
Product name, brand, category dropdowns
Image upload (Cloudinary widget)
Specifications builder (dynamic key-value pairs with suggested fields)
Price, stock, warranty fields
Description editors (short & long)
Save draft / Publish buttons
4. Orders Page
Order list with filters (status, date)
Order details modal/page
Bulk actions (mark as shipped)
5. Payouts Page
Upcoming payout card (period, amount, date)
Payout history table
Deductions breakdown (returns)
6. Analytics Page
Sales charts (line/bar graphs)Best-selling products table
Performance metrics
Admin Dashboard Screens
1. Admin Dashboard Home
KPI cards (revenue, orders, active users, pending returns)
Sales chart
Recent activity feed
Quick actions
2. User Management Page
User list table with role filter
Search/filter users
Add/edit/deactivate actions
Supplier approval queue
3. Product Management Page
All products table
Advanced filters (category, supplier, stock status)
Bulk actions
4. Order Management Page
All orders table
Advanced filters (status, date range, customer, supplier)
Order details modal
Update status action
5. Returns Management Page
Returns queue
Review return details
Approve/reject actions
6. Payout Management Page
Pending payouts list
Process weekly payouts button (batch action)
Payout history
7. Analytics Dashboard
Multiple chart types (bar, line, pie)
Date range selectorsExport reports (CSV)
Tabs for: Products, Orders, Suppliers, Financial
8. Settings Page
Delivery zones management
Email templates
Payment gateway config
System settings
5.3 Design System Components
Color Palette
Primary: Professional blue (#1E40AF ) - Trust, reliability
Secondary: Vibrant orange (#F97316 ) - CTAs, urgency
#10B981 ) - Confirmations, stock available
Success: Green (
Warning: Amber (
Danger: Red (
#F59E0B ) - Low stock alerts
#EF4444 ) - Errors, out of stock
Neutral: Gray scale (
#F9FAFB to
#111827 )
Typography
Headings: Inter (bold, 600-700 weight)
Body: Inter (regular, 400 weight)
Sizes: 12px, 14px, 16px (base), 18px, 24px, 32px, 48px
Spacing Scale
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
Components Library
Buttons (primary, secondary, outline, ghost, icon)
Form inputs (text, email, number, select, textarea, file upload)
Cards (product card, order card, stat card)
Modals/Dialogs
Toasts/Notifications
Badges (stock status, order status, role)
Tables (sortable, filterable)
Tabs
AccordionsProgress bars/steppers
Loading skeletons
Empty states
Error states
5.4 Responsive Breakpoints
Mobile: 320px - 767px
Tablet: 768px - 1023px
Desktop: 1024px+
6. Development Phases & Milestones
Phase 1: MVP Core (Weeks 1-8)
Week 1-2: Foundation & Setup
Backend:
Initialize Flask project structure
Set up PostgreSQL database (Render)
Configure SQLAlchemy models (Users, Customers, Suppliers, Profiles)
Implement JWT authentication
Basic RBAC middleware
Environment configuration
Frontend:
Initialize React + Vite project
Set up Redux Toolkit store structure
Configure React Router
Install and configure Tailwind CSS
Create base layout components (Header, Footer, Sidebar)
Set up Axios interceptors for API calls
DevOps:
Deploy backend to Render (initial setup)
Deploy frontend to Vercel (initial setup)
Configure CI/CD pipelines (auto-deploy on git push)Set up Cloudinary account and test image uploads
Testing:
Set up Jest for frontend
Set up Unittest for backend
Write authentication test cases
Week 3-4: Product & Category Management
Backend:
Complete Product, Category, Brand models
Implement product CRUD endpoints
Image upload to Cloudinary integration
Stock management logic
Product search & filtering API
Category management API
Frontend:
Product listing page with filters/search
Product detail page
Product comparison feature
Supplier: Add/edit product forms
Admin: Product management interface
Category & brand management (admin)
Testing:
Product CRUD tests (backend)
Product listing/detail component tests (frontend)
Week 5-6: Shopping Cart, Orders & Checkout
Backend:
Cart model & endpoints
Order and Order Items models
Delivery Zones management
Checkout logic (stock validation, price calculation)
Order creation endpointOrder status tracking endpoints
Frontend:
Shopping cart page
Add to cart functionality
Checkout flow (multi-step)
Address management
Delivery zone selection & fee calculation
Order confirmation page
My Orders page
Order tracking page (polling implementation)
Testing:
Cart and checkout flow tests
Order creation tests
Week 7-8: Payment Integration
Backend:
M-Pesa Daraja API integration (STK Push)
M-Pesa callback handler
Card payment gateway integration (Flutterwave/Paystack)
Payment verification logic
Transaction model & endpoints
Payment status webhooks
Frontend:
M-Pesa payment flow
Card payment flow
Cash on delivery option
Payment confirmation pages
Order status updates after payment
Testing:
Payment integration tests (sandbox)
Transaction recording testsMilestone 1 Complete: Basic e-commerce functionality operational - customers can browse, purchase, and
track orders.
Phase 2: Supplier Management & Admin Tools (Weeks 9-12)
Week 9-10: Supplier Features
Backend:
Supplier dashboard analytics endpoints
Supplier Payout model & logic
Weekly payout calculation (automated)
M-Pesa B2C integration for supplier payouts
Return deduction logic (carry forward balances)
Supplier notification system
Frontend:
Supplier dashboard home
Supplier product management (list, add, edit, delete)
Supplier orders page
Supplier payouts page (history & upcoming)
Supplier analytics page
Supplier notifications
Testing:
Payout calculation tests
Supplier dashboard tests
Week 10-11: Admin Analytics & Management
Backend:
Admin analytics endpoints (products, orders, suppliers, financial)
Audit log implementation
User management endpoints (RBAC)
Return management endpoints
Delivery zone CRUD
Frontend:Admin dashboard home (KPI cards, charts)
User management interface
Supplier approval workflow
Order management (all orders, status updates)
Returns management (approve/reject)
Payout processing interface (batch actions)
Analytics dashboard (charts, filters, export)
Delivery zones management
Audit log viewer
Testing:
Admin functionality tests
Analytics calculation tests
Week 12: Returns & Warranty System
Backend:
Returns model & endpoints
Return request logic (7-day, 14-day policies)
Warranty tracking (expiry calculation)
Warranty reminder email scheduler (Celery task)
Refund processing
Frontend:
Customer: Return request form
Customer: Returns history
Customer: Warranty tracker
Admin: Returns queue & review
Supplier: View returns for their products
Testing:
Return workflow tests
Warranty calculation tests
Milestone 2 Complete: Full multi-vendor marketplace with supplier self-service, admin tools, and
comprehensive analytics.Phase 3: Notifications, Polish & Testing (Weeks 13-14)
Week 13: Notifications & Email System
Backend:
Email service configuration (Flask-Mail)
Email templates (order confirmation, payment, shipping, delivery, warranty reminders)
Notification model & endpoints
Real-time notification creation on key events
Email sending for all transactional events
Frontend:
In-app notification center (bell icon)
Notification list page
Mark as read functionality
Notification preferences page
Testing:
Email delivery tests
Notification creation tests
Week 14: UI/UX Polish, Bug Fixes & Comprehensive Testing
Frontend:
UI refinements based on user feedback
Loading states for all async operations
Error handling & user-friendly error messages
Empty states for lists
Mobile responsiveness review & fixes
Accessibility audit & fixes
Backend:
Performance optimization (database indexing, query optimization)
Security audit (SQL injection, XSS, CSRF checks)
Rate limiting implementation
Error logging & monitoring setup (Sentry)
Testing:End-to-end testing of complete user journeys
Cross-browser testing
Mobile device testing
Load testing (basic)
Security testing
Bug fixes from testing
Milestone 3 Complete: Production-ready MVP with all core features, polished UI, and comprehensive testing.
Phase 4: Pre-Launch & Launch (Week 15-16)
Week 15: Pre-Launch Preparation
Migrate from sandbox to production APIs (M-Pesa, payment gateway)
Upgrade database to production tier on Render ($7/month)
Set up production monitoring & alerting
Create user documentation (FAQs, how-to guides)
Onboard initial suppliers (3-5 suppliers with diverse products)
Seed database with initial products
Final security review
Backup & disaster recovery plan
Week 16: Launch & Post-Launch Support
Soft launch with limited user group (beta testers)
Monitor system performance & error rates
Gather user feedback
Fix critical bugs
Public launch announcement
Monitor first transactions closely
Customer support readiness
Iterate based on early user feedback
Milestone 4 Complete: Live production system serving real customers and suppliers.7. Post-MVP Roadmap (Phase 2 Features)
Future Enhancements (After Successful MVP)
Customer Experience
Social login (Google, Facebook)
Wishlist/Save for Later
Product reviews & ratings
Live chat support
Advanced product recommendations (AI-driven)
Product views vs purchases analytics
Slow-moving inventory tracking
Average order value tracking
Peak ordering times analysis
Featured/promoted products on homepage
Multiple product images per product
Product video support
Gift cards/vouchers
Loyalty program
Supplier Tools
Bulk product upload (CSV import)
More advanced analytics (conversion rates, customer demographics)
Promotional campaigns
Supplier performance dashboard (fulfillment speed, return rates)
Automated restock alerts
Admin Capabilities
Automated fraud detection
Customer segmentation
Marketing campaign management
Comprehensive reporting suite (PDF exports)
Advanced analytics (conversion rates, customer lifetime value)
Real-time dashboard (WebSockets upgrade)
Technical ImprovementsReal-time notifications via WebSockets (replace polling)
Push notifications (mobile app)
Caching layer (Redis) for frequently accessed data
Elasticsearch for advanced product search
Background job queue (Celery) for async tasks
Mobile apps (React Native)
PWA features (offline mode, add to home screen)
Multi-language support (Swahili)
Multi-currency support
Logistics
Integrated courier API (Sendy, Glovo)
Real-time delivery tracking via GPS
Automated shipping label generation
Multiple courier options for customers
Pickup points/lockers
8. Potential Challenges & Solutions
Challenge 1: Payment Integration Complexity
Risk: M-Pesa and card payment integrations can be tricky, with callback handling, timeout issues, and
reconciliation problems.
Solutions:
Start with M-Pesa sandbox extensively before production
Implement robust idempotency for payment operations
Create comprehensive logging for all payment events
Build admin tools for manual payment reconciliation
Have backup payment verification methods
Test edge cases (timeouts, failed callbacks, duplicate payments)
Challenge 2: Supplier Coordination & Quality Control
Risk: Suppliers may not deliver products on time, quality issues may arise, or products may not match
descriptions.
Solutions:Clear supplier onboarding & agreement documentation
Mandatory quality check process before customer delivery
Supplier performance tracking and ratings (internal)
Ability to suspend/deactivate problematic suppliers
Clear communication channels (email, phone, in-app)
Build trust with reliable suppliers first
Start with limited suppliers and expand gradually
Challenge 3: Inventory Management Accuracy
Risk: Stock levels may become inaccurate if suppliers don't update regularly, leading to orders for out-of-stock
items.
Solutions:
Make stock updates easy and visible for suppliers
Send automated low-stock alerts to suppliers
Validate stock before allowing checkout
Implement "reserved stock" when order is placed (release if payment fails)
Periodic stock audits (manual for MVP, automated later)
Penalty for repeated stock discrepancies
Challenge 4: Delivery Logistics in Kenya
Risk: Unreliable courier services, delivery delays, lost packages, incorrect addresses.
Solutions:
Partner with multiple courier services (redundancy)
Collect detailed delivery addresses (landmarks are crucial in Kenya)
Phone number verification (couriers will call customers)
Send tracking info to customers immediately
Build relationships with reliable local couriers
Insurance for high-value items
Clear delivery timeframe expectations (under-promise, over-deliver)
Challenge 5: Payment Fraud & Chargebacks
Risk: Fraudulent orders, stolen cards, M-Pesa payment disputes.
Solutions:
Implement basic fraud detection (unusual order patterns, high-value first orders)Phone verification for large orders
Require account creation (creates accountability)
Clear refund and dispute resolution policies
Transaction monitoring and alerting
Insurance or reserve fund for chargebacks
Work closely with payment gateway fraud prevention tools
Challenge 6: Customer Trust & Adoption
Risk: Kenyans may be hesitant to buy electronics online due to trust issues.
Solutions:
Professional, polished UI/UX (builds credibility)
Clear return and warranty policies (prominently displayed)
Trust signals (secure payment badges, SSL, contact info)
Start with marketing to friends/family for social proof
Customer testimonials and reviews (post-MVP)
Social media presence (Instagram, Facebook, TikTok)
Responsive customer support
Showcase quality check process in marketing
Challenge 7: Scalability & Performance
Risk: As orders grow, database queries slow down, payment processing bottlenecks.
Solutions:
Database indexing on frequently queried fields (email, order_number, product slug)
Pagination for all list endpoints
Lazy loading for frontend (don't load all products at once)
Cloudinary CDN for fast image delivery
Monitor performance with tools like Sentry
Plan for horizontal scaling (Render makes this easy)
Consider caching layer (Redis) when needed
Upgrade database plan as needed
Challenge 8: Regulatory Compliance
Risk: Tax regulations, business licensing, data protection laws.
Solutions:Consult with Kenyan business lawyer (get proper licenses)
Understand VAT requirements for e-commerce
Implement data privacy best practices (even if not legally required yet)
Clear terms of service and privacy policy
Keep detailed records for tax purposes
Reserve funds for taxes (commission income is taxable)
9. Success Metrics & KPIs
Customer Acquisition
New customer registrations per week/month
Customer acquisition cost (CAC)
Traffic sources (direct, social, referral)
Engagement
Product views per session
Add-to-cart rate
Cart abandonment rate
Repeat purchase rate
Average order value (AOV)
Conversion
Conversion rate (visitors → orders)
Payment success rate (by method)
Time from registration to first purchase
Supplier Performance
Number of active suppliers
Average products per supplier
Supplier fulfillment time (order → quality check)
Supplier return rates
Financial
Gross Merchandise Value (GMV) - total value of products soldRevenue (25% commission)
Average commission per order
Weekly/monthly revenue growth
Customer lifetime value (CLV)
Operational
Order fulfillment time (order → delivery)
Return rate
Customer support response time
System uptime (aim for 99.5%+)
Average page load time
Customer Satisfaction
Net Promoter Score (NPS) - post-MVP surveys
Customer support ticket resolution rate
Product rating averages (post-MVP)
Repeat customer rate
10. Budget Estimates (MVP Phase)
Development Costs
Your Time: Solo development (16 weeks full-time equivalent)
Tools & Subscriptions:
GitHub (Free tier)
Figma (Free tier)
Postman (Free tier)
Hosting & Infrastructure (Monthly)
Frontend (Vercel): Free tier (sufficient for MVP)
Backend (Render):
Web service: Free tier for testing → $7/month for production
PostgreSQL: Free tier for testing → $7/month for production (Starter plan)
Cloudinary: Free tier (25GB storage, 25GB bandwidth)
Total Monthly: ~$0 (testing phase) → $14/month (production phase)Third-Party Services
M-Pesa Daraja API:
Go-live fee: ~KES 2,000 (one-time)
Transaction fees: Standard M-Pesa rates (passed to customer or absorbed)
Card Payment Gateway (Flutterwave/Paystack):
Setup: Free
Transaction fees: ~3.8% + fees (passed to customer)
Email Service (Gmail SMTP for MVP): Free
SendGrid/Mailgun (Future): Free tier → $15/month for scale
Business Costs
Domain Name: ~$12/year (.com or .co.ke)
SSL Certificate: Free (Vercel & Render provide automatically)
Business Registration (Kenya): ~KES 10,000-20,000 (one-time)
Legal Consultation: ~KES 20,000-50,000 (for T&Cs, contracts)
Contingency & Buffer
Reserve ~KES 50,000 for unexpected costs (courier issues, chargebacks, testing budget)
Total Initial Investment (Rough Estimate)
Setup & Legal: ~KES 50,000-80,000
First 3 Months Operations: ~$42 (~KES 6,000) hosting + transaction fees
Total: ~KES 56,000-86,000 + transaction fees (which are covered by sales)
11. Risk Mitigation Strategy
Technical Risks
Risk: API integrations fail or have breaking changes
Mitigation: Extensive error handling, fallback mechanisms, version pinning
Risk: Data loss or corruption
Mitigation: Automated daily backups (Render provides this), test restoration process
Risk: Security breach
Mitigation: Security best practices from day one, regular audits, monitoringBusiness Risks
Risk: Low customer adoption
Mitigation: Start with strong marketing, initial promotions, targeted launch
Risk: Supplier dropout or unreliability
Mitigation: Onboard multiple suppliers per category, clear agreements, incentives
Risk: Cash flow issues (paying suppliers before receiving customer payments)
Mitigation: Weekly payout schedule, not instant; hold reserve fund
Risk: High return rates cutting into profits
Mitigation: Quality control process, clear product descriptions, supplier accountability
Operational Risks
Risk: Customer support overwhelmed
Mitigation: Comprehensive FAQs, clear policies, scalable support tools
Risk: Delivery failures damaging reputation
Mitigation: Reliable courier partnerships, communication, tracking
12. Next Steps (Immediate Actions)
Before Development Starts
1. Legal & Business Setup
Register business in Kenya
Consult lawyer for T&Cs, supplier agreements, privacy policy
Apply for M-Pesa Daraja API credentials (start in sandbox)
2. Design & Planning
Create Figma wireframes (use the recommendations in Section 5)
Finalize database schema (use ERD tool like dbdiagram.io)
Design detailed user flows
Create a clickable prototype (optional but helpful)
3. Supplier Relationships
Identify 3-5 initial suppliers
Draft supplier agreements (commission structure, return policies, quality standards)
Gather initial product data (names, images, specs, prices)
4. Infrastructure SetupCreate accounts: GitHub, Vercel, Render, Cloudinary
Purchase domain name
Set up Google Workspace or email service (professional email)
5. Project Management
Break down each phase into detailed tasks
Set up Trello/Jira/Notion board for task tracking
Define daily/weekly development goals
Development Start
1. Week 1 Day 1: Initialize Git repository, backend & frontend projects
2. Follow the phase-by-phase plan in Section 6
3. Daily: Commit code, test features, update task board
4. Weekly: Review progress, adjust timeline if needed, test deployed versions
13. Conclusion
This masterplan provides a comprehensive blueprint for building a successful multi-vendor electronics e-
commerce platform tailored for the Kenyan market. The phased approach ensures you can launch a functional
MVP within 16 weeks while leaving room for future enhancements based on real user feedback.
Key Success Factors
1. Focus on Trust: Quality control, clear policies, and professional design will differentiate you
2. Supplier Relationships: Your success depends on reliable suppliers; nurture these partnerships
3. Mobile-First: Kenyan users shop on mobile; prioritize this experience
4. Iterative Approach: Launch the MVP, gather data, iterate quickly
5. Customer Support: Be responsive and helpful; word-of-mouth is powerful in Kenya
Final Thoughts
You're building more than just an e-commerce site—you're creating a trusted marketplace that connects Kenyan
customers with quality electronics while empowering local suppliers to grow their businesses. The 25%
commission model is sustainable, and the quality control process will be your competitive advantage.
Remember: Start small, focus on excellence, and scale sustainably. Your first 100 satisfied customers will be
your best marketing tool.
Good luck with your build!
🚀Appendix A: Recommended Tools & Resources
Development Tools
VS Code: IDE with extensions (Python, JavaScript, ESLint, Prettier)
Postman: API testing
pgAdmin: PostgreSQL database management
Redux DevTools: State debugging (browser extension)
Learning Resources
Flask Documentation: https://flask.palletsprojects.com/
React Documentation: https://react.dev/
Redux Toolkit: https://redux-toolkit.js.org/
Safaricom Daraja API Docs: https://developer.safaricom.co.ke/
SQLAlchemy Tutorial: https://docs.sqlalchemy.org/en/20/tutorial/
Design Resources
Tailwind CSS Docs: https://tailwindcss.com/docs
Heroicons: Free icon library
Unsplash: Free product placeholder images
Coolors: Color palette generator
Business Resources
Kenya Business Registration: https://www.businessregistration.go.ke/
KRA (Tax Authority): https://www.kra.go.ke/
Safaricom M-Pesa for Business: https://www.safaricom.co.ke/personal/m-pesa/lipa-na-m-pesa
Appendix B: Database ERD (Entity Relationship Diagram) Guide
Creating Your ERD
Use tools like:
dbdiagram.io (recommended - simple, web-based)
Lucidchart
draw.ioKey Relationships to Visualize
1. Users → Customer/Supplier/Admin Profiles (1:1)
2. Suppliers → Products (1:Many)
3. Products → Categories & Brands (Many:1)
4. Customers → Orders (1:Many)
5. Orders → Order Items (1:Many)
6. Order Items → Products (Many:1)
7. Orders → Transactions (1:Many)
8. Suppliers → Payouts (1:Many)
9. Order Items → Returns (1:1)
Include cardinality (1:1, 1:Many, Many:Many) and foreign key relationships.
End of Masterplan