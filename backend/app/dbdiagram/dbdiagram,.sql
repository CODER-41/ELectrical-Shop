CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "email" varchar UNIQUE,
  "password_hash" varchar,
  "role" varchar,
  "is_active" boolean,
  "is_verified" boolean,
  "created_at" timestamp
);

CREATE TABLE "customer_profiles" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "first_name" varchar,
  "last_name" varchar,
  "phone_number" varchar
);

CREATE TABLE "supplier_profiles" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "business_name" varchar,
  "mpesa_number" varchar,
  "commission_rate" decimal,
  "is_approved" boolean
);

CREATE TABLE "addresses" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "delivery_zone_id" uuid,
  "address_line" varchar,
  "is_default" boolean
);

CREATE TABLE "delivery_zones" (
  "id" uuid PRIMARY KEY,
  "zone_name" varchar,
  "delivery_fee" decimal
);

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY,
  "name" varchar
);

CREATE TABLE "brands" (
  "id" uuid PRIMARY KEY,
  "name" varchar
);

CREATE TABLE "products" (
  "id" uuid PRIMARY KEY,
  "supplier_id" uuid,
  "category_id" uuid,
  "brand_id" uuid,
  "name" varchar,
  "price" decimal,
  "stock_quantity" int,
  "warranty_months" int
);

CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY,
  "customer_id" uuid,
  "delivery_address_id" uuid,
  "total_amount" decimal,
  "payment_status" varchar,
  "order_status" varchar,
  "created_at" timestamp
);

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY,
  "order_id" uuid,
  "product_id" uuid,
  "supplier_id" uuid,
  "quantity" int,
  "subtotal" decimal
);

CREATE TABLE "transactions" (
  "id" uuid PRIMARY KEY,
  "order_id" uuid,
  "amount" decimal,
  "payment_method" varchar,
  "status" varchar
);

CREATE TABLE "supplier_payouts" (
  "id" uuid PRIMARY KEY,
  "supplier_id" uuid,
  "net_payout" decimal,
  "status" varchar
);

CREATE TABLE "returns" (
  "id" uuid PRIMARY KEY,
  "order_item_id" uuid,
  "status" varchar,
  "refund_amount" decimal
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "title" varchar,
  "is_read" boolean
);

ALTER TABLE "customer_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "supplier_profiles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "addresses" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "products" ADD FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles" ("id");

ALTER TABLE "products" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id");

ALTER TABLE "products" ADD FOREIGN KEY ("brand_id") REFERENCES "brands" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("customer_id") REFERENCES "customer_profiles" ("id");

ALTER TABLE "orders" ADD FOREIGN KEY ("delivery_address_id") REFERENCES "addresses" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id");

ALTER TABLE "order_items" ADD FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles" ("id");

ALTER TABLE "transactions" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id");

ALTER TABLE "supplier_payouts" ADD FOREIGN KEY ("supplier_id") REFERENCES "supplier_profiles" ("id");

ALTER TABLE "returns" ADD FOREIGN KEY ("order_item_id") REFERENCES "order_items" ("id");

ALTER TABLE "notifications" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
