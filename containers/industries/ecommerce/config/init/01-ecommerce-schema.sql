-- ShopVault Commerce — Inventory Database Schema

CREATE TABLE IF NOT EXISTS categories (
  category_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE,
  parent_id     UUID REFERENCES categories(category_id)
);

CREATE TABLE IF NOT EXISTS products (
  product_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku           TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  stock         INT DEFAULT 0,
  category_id   UUID REFERENCES categories(category_id),
  status        TEXT CHECK (status IN ('active','inactive','discontinued')) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  order_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  total         NUMERIC(10,2),
  status        TEXT CHECK (status IN ('pending','processing','shipped','delivered','cancelled')) DEFAULT 'pending',
  shipping_addr JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (category_id, name, slug) VALUES
  ('d0000001-shop-shop-shop-000000000001', 'Electronics', 'electronics'),
  ('d0000001-shop-shop-shop-000000000002', 'Accessories', 'accessories'),
  ('d0000001-shop-shop-shop-000000000003', 'Software', 'software'),
  ('d0000001-shop-shop-shop-000000000004', 'Office', 'office')
ON CONFLICT (slug) DO NOTHING;

-- Seed products
INSERT INTO products (sku, name, description, price, stock, category_id) VALUES
  ('LAP-PRO-001', 'Laptop Pro 16"', 'High-performance laptop', 1299.99, 45, 'd0000001-shop-shop-shop-000000000001'),
  ('PHN-X15-002', 'SmartPhone X15', 'Latest flagship phone', 899.99, 120, 'd0000001-shop-shop-shop-000000000001'),
  ('MOU-WL-003',  'Wireless Mouse', 'Ergonomic wireless mouse', 49.99, 280, 'd0000001-shop-shop-shop-000000000002'),
  ('KEY-MEC-004', 'Mechanical Keyboard', 'RGB mechanical keyboard', 129.99, 95, 'd0000001-shop-shop-shop-000000000002'),
  ('SW-SEC-005',  'SecureVault Pro', 'Password manager license', 59.99, 9999, 'd0000001-shop-shop-shop-000000000003'),
  ('DSK-SIT-006', 'Standing Desk', 'Height-adjustable desk', 449.99, 18, 'd0000001-shop-shop-shop-000000000004')
ON CONFLICT (sku) DO NOTHING;

-- Seed orders
INSERT INTO orders (customer_email, total, status, shipping_addr) VALUES
  ('alice@example.com', 1349.98, 'delivered', '{"street":"123 Main St","city":"San Francisco","state":"CA","zip":"94105"}'),
  ('bob@company.com', 179.98, 'shipped', '{"street":"456 Oak Ave","city":"Austin","state":"TX","zip":"78701"}'),
  ('carol@startup.io', 899.99, 'processing', '{"street":"789 Pine Rd","city":"Seattle","state":"WA","zip":"98101"}'),
  ('dave@corp.net', 509.98, 'pending', '{"street":"321 Elm St","city":"Chicago","state":"IL","zip":"60601"}');
