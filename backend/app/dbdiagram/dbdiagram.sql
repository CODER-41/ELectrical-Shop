CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "email" varchar UNIQUE,
  "password_hash" varchar,
  "role" varchar,
  "is_active" boolean,
  "is_verified" boolean,
  "auth_provider" varchar,
  "google_id" varchar,
  "profile_picture" varchar,
  "created_at" timestamp,
  "updated_at" timestamp,
  "last_login" timestamp
);

CREATE TABLE "customer_profiles" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid UNIQUE,
  "first_name" varchar,
  "last_name" varchar,
  "phone_number" varchar,
  "mpesa_number" varchar,
  "default_address_id" uuid,
  "created_at" timestamp
);

CREATE TABLE "supplier_profiles" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid UNIQUE,
  "business_name" varchar,
  "business_registration_number" varchar,
  "contact_person" varchar,
  "phone_number" varchar,
  "mpesa_number" varchar,
  "payout_method" varchar,
  "commission_rate" decimal,
  "outstanding_balance" decimal,
  "total_sales" decimal,
  "is_approved" boolean,
  "payment_phone_pending" varchar,
  "payment_phone_change_status" varchar,
  "payment_phone_change_requested_at" timestamp,
  "payment_phone_change_reviewed_at" timestamp,
  "payment_phone_change_reviewed_by" uuid,
  "payment_phone_change_reason" varchar,
  "created_at" timestamp
);

CREATE TABLE "admin_profiles" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid UNIQUE,
  "first_name" varchar,
  "last_name" varchar,
  "phone_number" varchar,
  "permissions" json,
  "created_at" timestamp
);

CREATE TABLE "delivery_agent_profiles" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid UNIQUE,
  "first_name" varchar,
  "last_name" varchar,
  "phone_number" varchar,
  "id_number" varchar,
  "vehicle_type" varchar,
  "vehicle_registration" varchar,
  "assigned_zones" json,
  "is_available" boolean,
  "total_deliveries" int,
  "total_cod_collected" decimal,
  "partner_type" varchar,
  "mpesa_number" varchar,
  "delivery_fee_percentage" decimal,
  "total_earnings" decimal,
  "pending_payout" decimal,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "delivery_companies" (
  "id" uuid PRIMARY KEY,
  "name" varchar UNIQUE,
  "contact_email" varchar,
  "contact_phone" varchar,
  "api_key" varchar,
  "api_endpoint" varchar,
  "webhook_url" varchar,
  "is_api_integrated" boolean,
  "mpesa_paybill" varchar,
  "mpesa_account" varchar,
  "delivery_fee_percentage" decimal,
  "settlement_period_days" int,
  "minimum_payout_amount" decimal,
  "pending_balance" decimal,
  "total_paid" decimal,
  "is_active" boolean,
  "service_zones" json,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "delivery_zones" (
  "id" uuid PRIMARY KEY,
  "name" varchar UNIQUE,
  "counties" json,
  "delivery_fee" decimal,
  "estimated_days" int,
  "is_active" boolean,
  "created_at" timestamp
);

CREATE TABLE "addresses" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "delivery_zone_id" uuid,
  "label" varchar,
  "address_line" varchar,
  "city" varchar,
  "county" varchar,
  "postal_code" varchar,
  "is_default" boolean,
  "created_at" timestamp
);

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY,
  "name" varchar,
  "slug" varchar UNIQUE,
  "description" text,
  "image_url" varchar,
  "is_active" boolean,
  "created_at" timestamp
);

CREATE TABLE "brands" (
  "id" uuid PRIMARY KEY,
  "name" varchar,
  "slug" varchar UNIQUE,
  "logo_url" varchar,
  "is_active" boolean,
  "created_at" timestamp
);

CREATE TABLE "products" (
  "id" uuid PRIMARY KEY,
  "supplier_id" uuid,
  "category_id" uuid,
  "brand_id" uuid,
  "name" varchar,
  "slug" varchar UNIQUE,
  "description" text,
  "price" decimal,
  "stock_quantity" int,
  "warranty_period_months" int,
  "image_url" varchar,
  "is_active" boolean,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "cart" (
  "id" uuid PRIMARY KEY,
  "customer_id" uuid,
  "is_active" boolean,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "cart_items" (
  "id" uuid PRIMARY KEY,
  "cart_id" uuid,
  "product_id" uuid,
  "quantity" int,
  "created_at" timestamp
);

CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY,
  "order_number" varchar UNIQUE,
  "customer_id" uuid,
  "delivery_address_id" uuid,
  "delivery_fee" decimal,
  "subtotal" decimal,
  "total" decimal,
  "payment_method" varchar,
  "payment_status" varchar,
  "payment_reference" varchar,
  "paid_at" timestamp,
  "cod_collected_by" uuid,
  "cod_collected_at" timestamp,
  "cod_amount_collected" decimal,
  "cod_verified_by" uuid,
  "cod_verified_at" timestamp,
  "assigned_delivery_agent" uuid,
  "assigned_delivery_company" uuid,
  "delivery_confirmed_by_agent" boolean,
  "delivery_confirmed_at" timestamp,
  "delivery_proof_photo" varchar,
  "delivery_recipient_name" varchar,
  "delivery_notes" text,
  "customer_confirmed_delivery" boolean,
  "customer_confirmed_at" timestamp,
  "customer_dispute" boolean,
  "customer_dispute_reason" text,
  "auto_confirmed" boolean,
  "auto_confirm_deadline" timestamp,
  "delivery_fee_paid" boolean,
  "delivery_fee_paid_at" timestamp,
  "delivery_payment_reference" varchar,
  "status" varchar,
  "customer_notes" text,
  "admin_notes" text,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY,
  "order_id" uuid,
  "product_id" uuid,
  "supplier_id" uuid,
  "product_name" varchar,
  "product_price" decimal,
  "quantity" int,
  "subtotal" decimal,
  "commission_rate" decimal,
  "commission_amount" decimal,
  "supplier_net_amount" decimal,
  "warranty_period_months" int,
  "warranty_expires_at" timestamp,
  "created_at" timestamp
);

CREATE TABLE "transactions" (
  "id" uuid PRIMARY KEY,
  "order_id" uuid,
  "payment_method" varchar,
  "amount" decimal,
  "status" varchar,
  "reference" varchar,
  "checkout_request_id" varchar,
  "merchant_request_id" varchar,
  "mpesa_receipt_number" varchar,
  "phone_number" varchar,
  "result_code" varchar,
  "result_description" text,
  "callback_payload" json,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "supplier_payouts" (
  "id" uuid PRIMARY KEY,
  "payout_number" varchar UNIQUE,
  "supplier_id" uuid,
  "amount" decimal,
  "net_amount" decimal,
  "status" varchar,
  "payment_reference" varchar,
  "notes" text,
  "created_at" timestamp,
  "paid_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp
);

CREATE TABLE "delivery_payouts" (
  "id" uuid PRIMARY KEY,
  "payout_number" varchar UNIQUE,
  "payout_type" varchar,
  "delivery_agent_id" uuid,
  "delivery_company_id" uuid,
  "gross_amount" decimal,
  "platform_fee" decimal,
  "net_amount" decimal,
  "order_count" int,
  "order_ids" json,
  "status" varchar,
  "payment_method" varchar,
  "payment_reference" varchar,
  "mpesa_number" varchar,
  "period_start" timestamp,
  "period_end" timestamp,
  "notes" text,
  "created_at" timestamp,
  "processed_at" timestamp,
  "processed_by" uuid,
  "updated_at" timestamp
);

CREATE TABLE "returns" (
  "id" uuid PRIMARY KEY,
  "order_id" uuid,
  "user_id" uuid,
  "reason" varchar,
  "status" varchar,
  "refund_amount" decimal,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "title" varchar,
  "message" text,
  "type" varchar,
  "is_read" boolean,
  "created_at" timestamp
);

CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "refresh_token" varchar,
  "device_info" varchar,
  "ip_address" varchar,
  "is_active" boolean,
  "created_at" timestamp,
  "expires_at" timestamp
);

CREATE TABLE "delivery_zone_requests" (
  "id" uuid PRIMARY KEY,
  "delivery_agent_id" uuid,
  "zone_id" uuid,
  "reason" text,
  "experience" text,
  "status" varchar,
  "admin_notes" text,
  "created_at" timestamp,
  "reviewed_at" timestamp,
  "reviewed_by" uuid
);

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "customer_profiles" ("user_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "supplier_profiles" ("user_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "admin_profiles" ("user_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "delivery_agent_profiles" ("user_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "addresses" ("user_id");

ALTER TABLE "delivery_zones" ADD FOREIGN KEY ("id") REFERENCES "addresses" ("delivery_zone_id");

ALTER TABLE "supplier_profiles" ADD FOREIGN KEY ("id") REFERENCES "products" ("supplier_id");

ALTER TABLE "categories" ADD FOREIGN KEY ("id") REFERENCES "products" ("category_id");

ALTER TABLE "brands" ADD FOREIGN KEY ("id") REFERENCES "products" ("brand_id");

ALTER TABLE "customer_profiles" ADD FOREIGN KEY ("id") REFERENCES "cart" ("customer_id");

ALTER TABLE "cart" ADD FOREIGN KEY ("id") REFERENCES "cart_items" ("cart_id");

ALTER TABLE "products" ADD FOREIGN KEY ("id") REFERENCES "cart_items" ("product_id");

ALTER TABLE "customer_profiles" ADD FOREIGN KEY ("id") REFERENCES "orders" ("customer_id");

ALTER TABLE "addresses" ADD FOREIGN KEY ("id") REFERENCES "orders" ("delivery_address_id");

ALTER TABLE "delivery_agent_profiles" ADD FOREIGN KEY ("id") REFERENCES "orders" ("assigned_delivery_agent");

ALTER TABLE "delivery_companies" ADD FOREIGN KEY ("id") REFERENCES "orders" ("assigned_delivery_company");

ALTER TABLE "orders" ADD FOREIGN KEY ("id") REFERENCES "order_items" ("order_id");

ALTER TABLE "products" ADD FOREIGN KEY ("id") REFERENCES "order_items" ("product_id");

ALTER TABLE "supplier_profiles" ADD FOREIGN KEY ("id") REFERENCES "order_items" ("supplier_id");

ALTER TABLE "orders" ADD FOREIGN KEY ("id") REFERENCES "transactions" ("order_id");

ALTER TABLE "supplier_profiles" ADD FOREIGN KEY ("id") REFERENCES "supplier_payouts" ("supplier_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "supplier_payouts" ("created_by");

ALTER TABLE "delivery_agent_profiles" ADD FOREIGN KEY ("id") REFERENCES "delivery_payouts" ("delivery_agent_id");

ALTER TABLE "delivery_companies" ADD FOREIGN KEY ("id") REFERENCES "delivery_payouts" ("delivery_company_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "delivery_payouts" ("processed_by");

ALTER TABLE "orders" ADD FOREIGN KEY ("id") REFERENCES "returns" ("order_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "returns" ("user_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "notifications" ("user_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "sessions" ("user_id");

ALTER TABLE "delivery_agent_profiles" ADD FOREIGN KEY ("id") REFERENCES "delivery_zone_requests" ("delivery_agent_id");

ALTER TABLE "delivery_zones" ADD FOREIGN KEY ("id") REFERENCES "delivery_zone_requests" ("zone_id");

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "delivery_zone_requests" ("reviewed_by");
