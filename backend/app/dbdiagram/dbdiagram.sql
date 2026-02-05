CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "email" varchar UNIQUE,
  "password_hash" varchar,
  "role" varchar,
  "is_active" boolean,
  "is_verified" boolean,
  "two_fa_enabled" boolean,
  "two_fa_secret" varchar,
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
  "created_at" timestamp,
  "updated_at" timestamp
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
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "admin_profiles" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid UNIQUE,
  "first_name" varchar,
  "last_name" varchar,
  "phone_number" varchar,
  "permissions" json,
  "created_at" timestamp,
  "updated_at" timestamp
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
  "assigned_delivery_agent" uuid,
  "assigned_delivery_company" uuid,
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

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "action" varchar,
  "entity_type" varchar,
  "entity_id" uuid,
  "old_values" json,
  "new_values" json,
  "description" text,
  "ip_address" varchar,
  "user_agent" varchar,
  "created_at" timestamp
);

CREATE TABLE "otps" (
  "id" uuid PRIMARY KEY,
  "email" varchar,
  "code" varchar,
  "purpose" varchar,
  "is_used" boolean,
  "attempts" int,
  "expires_at" timestamp,
  "created_at" timestamp
);

ALTER TABLE "customer_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "supplier_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "supplier_profiles" ADD FOREIGN KEY ("payment_phone_change_reviewed_by") REFERENCES "users" ("id");

ALTER TABLE "admin_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "delivery_agent_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "addresses" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "addresses" ADD FOREIGN KEY ("delivery_zone_id") REFERENCES "delivery_zones" ("id");

ALTER TABLE "products" ADD FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles" ("id");

ALTER TABLE "products" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "products" ADD FOREIGN KEY ("brand_id") REFERENCES "brands" ("id");

ALTER TABLE "cart" ADD FOREIGN KEY ("customer_id") REFERENCES "customer_profiles" ("id");

ALTER TABLE "cart_items" ADD FOREIGN KEY ("cart_id") REFERENCES "cart" ("id");

ALTER TABLE "cart_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("customer_id") REFERENCES "customer_profiles" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("delivery_address_id") REFERENCES "addresses" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("assigned_delivery_agent") REFERENCES "delivery_agent_profiles" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("assigned_delivery_company") REFERENCES "delivery_companies" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("cod_collected_by") REFERENCES "users" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("cod_verified_by") REFERENCES "users" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles" ("id");

ALTER TABLE "transactions" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "supplier_payouts" ADD FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles" ("id");

ALTER TABLE "supplier_payouts" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id");

ALTER TABLE "delivery_payouts" ADD FOREIGN KEY ("delivery_agent_id") REFERENCES "delivery_agent_profiles" ("id");

ALTER TABLE "delivery_payouts" ADD FOREIGN KEY ("delivery_company_id") REFERENCES "delivery_companies" ("id");

ALTER TABLE "delivery_payouts" ADD FOREIGN KEY ("processed_by") REFERENCES "users" ("id");

ALTER TABLE "returns" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "returns" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "sessions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "delivery_zone_requests" ADD FOREIGN KEY ("delivery_agent_id") REFERENCES "delivery_agent_profiles" ("id");

ALTER TABLE "delivery_zone_requests" ADD FOREIGN KEY ("zone_id") REFERENCES "delivery_zones" ("id");

ALTER TABLE "delivery_zone_requests" ADD FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id");

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
