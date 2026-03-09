-- ─────────────────────────────────────────────────────────────────────────────
-- Sentinel AI — Logistics Shipment DB Schema + Seed Data
-- Runs automatically on postgres-shipment first boot via initdb.d
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Schema ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicles (
  id            SERIAL PRIMARY KEY,
  plate         VARCHAR(20)   UNIQUE NOT NULL,
  type          VARCHAR(20)   NOT NULL,  -- truck | van | motorcycle
  driver_name   VARCHAR(100),
  status        VARCHAR(20)   DEFAULT 'available', -- available | in_transit | maintenance
  current_lat   DECIMAL(10,8),
  current_lon   DECIMAL(11,8),
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  origin        VARCHAR(100)  NOT NULL,
  destination   VARCHAR(100)  NOT NULL,
  distance_km   DECIMAL(8,2),
  est_hours     DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS customers (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100),
  phone         VARCHAR(20),
  address       TEXT,
  -- link to ERPNext Customer record
  erpnext_id    VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS shipments (
  id                    VARCHAR(20)   PRIMARY KEY,  -- SHP-XXXXXX
  customer_id           INT           REFERENCES customers(id),
  vehicle_id            INT           REFERENCES vehicles(id),
  route_id              INT           REFERENCES routes(id),
  status                VARCHAR(20)   DEFAULT 'pending', -- pending | in_transit | delivered | failed
  origin                VARCHAR(100),
  destination           VARCHAR(100),
  weight_kg             DECIMAL(8,2),
  volume_m3             DECIMAL(8,2),
  -- Cross-reference to ERPNext Delivery Note (interlink)
  erpnext_delivery_note VARCHAR(50),
  created_at            TIMESTAMPTZ   DEFAULT NOW(),
  pickup_at             TIMESTAMPTZ,
  delivered_at          TIMESTAMPTZ,
  notes                 TEXT
);

CREATE TABLE IF NOT EXISTS tracking_events (
  id            SERIAL PRIMARY KEY,
  shipment_id   VARCHAR(20)   REFERENCES shipments(id),
  event_type    VARCHAR(50),  -- pickup | checkpoint | delay | delivered | failed-attempt
  location_name VARCHAR(100),
  lat           DECIMAL(10,8),
  lon           DECIMAL(11,8),
  message       TEXT,
  recorded_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_shipments_status      ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_customer    ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created     ON shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_shipment     ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_recorded     ON tracking_events(recorded_at DESC);

-- ── Seed: Vehicles ─────────────────────────────────────────────────────────────

INSERT INTO vehicles (plate, type, driver_name, status, current_lat, current_lon) VALUES
  ('TRK-001', 'truck',      'James Wilson',   'in_transit',  40.7128,  -74.0060),
  ('TRK-002', 'truck',      'Maria Garcia',   'available',   34.0522, -118.2437),
  ('TRK-003', 'truck',      'Lisa Park',      'maintenance', 47.6062, -122.3321),
  ('VAN-001', 'van',        'Ahmed Khan',     'in_transit',  41.8781,  -87.6298),
  ('VAN-002', 'van',        'Sarah Chen',     'available',   29.7604,  -95.3698),
  ('VAN-003', 'van',        'David Lee',      'in_transit',  33.4484, -112.0740),
  ('VAN-004', 'van',        'Carlos Rivera',  'in_transit',  32.7767,  -96.7970),
  ('MCY-001', 'motorcycle', 'Tom Brown',      'available',   25.7617,  -80.1918)
ON CONFLICT DO NOTHING;

-- ── Seed: Routes ───────────────────────────────────────────────────────────────

INSERT INTO routes (name, origin, destination, distance_km, est_hours) VALUES
  ('NYC-LAX', 'New York, NY',      'Los Angeles, CA',   4490, 44),
  ('CHI-MIA', 'Chicago, IL',       'Miami, FL',         2210, 22),
  ('SEA-SFO', 'Seattle, WA',       'San Francisco, CA', 1320, 13),
  ('ATL-DFW', 'Atlanta, GA',       'Dallas, TX',        1200, 12),
  ('NYC-CHI', 'New York, NY',      'Chicago, IL',       1270, 13),
  ('LAX-PHX', 'Los Angeles, CA',   'Phoenix, AZ',        600,  6)
ON CONFLICT DO NOTHING;

-- ── Seed: Customers (mirror of ERPNext customers) ──────────────────────────────

INSERT INTO customers (name, email, phone, address, erpnext_id) VALUES
  ('Apex Supply Co',      'orders@apexsupply.com',      '+1-555-0101', '123 Business Ave, New York, NY',     'Apex Supply Co'),
  ('BlueStar Retail',     'logistics@bluestar.com',     '+1-555-0102', '456 Commerce St, Chicago, IL',       'BlueStar Retail'),
  ('Central Pharma Ltd',  'supply@centralpharma.com',   '+1-555-0103', '789 Medical Blvd, Atlanta, GA',      'Central Pharma Ltd'),
  ('Delta Electronics',   'warehousing@deltaelec.com',  '+1-555-0104', '321 Tech Park, San Jose, CA',        'Delta Electronics'),
  ('Eagle Auto Parts',    'freight@eagleauto.com',      '+1-555-0105', '654 Industrial Rd, Detroit, MI',     'Eagle Auto Parts'),
  ('FastForward Inc',     'logistics@fastforward.com',  '+1-555-0106', '987 Speed Lane, Dallas, TX',         NULL),
  ('Global Trade LLC',    'imports@globaltrade.com',    '+1-555-0107', '147 Harbor View, Los Angeles, CA',   NULL),
  ('Harbor Goods',        'receiving@harborgoods.com',  '+1-555-0108', '258 Port Rd, Miami, FL',             NULL)
ON CONFLICT DO NOTHING;

-- ── Seed: Shipments ────────────────────────────────────────────────────────────

INSERT INTO shipments (id, customer_id, vehicle_id, route_id, status, origin, destination, weight_kg, volume_m3, erpnext_delivery_note, pickup_at, delivered_at) VALUES
  ('SHP-000001', 1, 1, 1, 'in_transit',  'New York, NY',      'Los Angeles, CA',   1250.50,  8.20, 'DN-0001', NOW() - INTERVAL '2 days',    NULL),
  ('SHP-000002', 2, 4, 2, 'in_transit',  'Chicago, IL',       'Miami, FL',          320.00,  2.40, 'DN-0002', NOW() - INTERVAL '1 day',     NULL),
  ('SHP-000003', 3, 2, 4, 'delivered',   'Atlanta, GA',       'Dallas, TX',          85.50,  0.50, 'DN-0003', NOW() - INTERVAL '3 days',    NOW() - INTERVAL '1 hour'),
  ('SHP-000004', 4, NULL,3, 'pending',   'Seattle, WA',       'San Francisco, CA',  560.00,  4.10, 'DN-0004', NULL,                         NULL),
  ('SHP-000005', 5, 3, 5, 'in_transit',  'New York, NY',      'Chicago, IL',       2100.00, 14.30, 'DN-0005', NOW() - INTERVAL '12 hours',  NULL),
  ('SHP-000006', 6, 5, 6, 'delivered',   'Los Angeles, CA',   'Phoenix, AZ',         45.00,  0.30, 'DN-0006', NOW() - INTERVAL '2 days',    NOW() - INTERVAL '4 hours'),
  ('SHP-000007', 7, 1, 1, 'pending',     'New York, NY',      'Los Angeles, CA',    750.00,  5.50, NULL,      NULL,                         NULL),
  ('SHP-000008', 8, NULL,2, 'pending',   'Chicago, IL',       'Miami, FL',          190.00,  1.60, NULL,      NULL,                         NULL),
  ('SHP-000009', 1, 7, 4, 'in_transit',  'Atlanta, GA',       'Dallas, TX',         430.00,  3.20, 'DN-0009', NOW() - INTERVAL '6 hours',   NULL),
  ('SHP-000010', 2, 2, 3, 'failed',      'Seattle, WA',       'San Francisco, CA',  280.00,  2.10, 'DN-0010', NOW() - INTERVAL '3 days',    NULL),
  ('SHP-000011', 3, 4, 5, 'delivered',   'New York, NY',      'Chicago, IL',        165.00,  1.20, 'DN-0011', NOW() - INTERVAL '4 days',    NOW() - INTERVAL '2 days'),
  ('SHP-000012', 4, 6, 6, 'in_transit',  'Los Angeles, CA',   'Phoenix, AZ',         95.00,  0.70, 'DN-0012', NOW() - INTERVAL '3 hours',   NULL),
  ('SHP-000013', 5, NULL,1, 'pending',   'New York, NY',      'Los Angeles, CA',   1800.00, 12.00, NULL,      NULL,                         NULL),
  ('SHP-000014', 6, 5, 2, 'delivered',   'Chicago, IL',       'Miami, FL',          400.00,  3.00, 'DN-0014', NOW() - INTERVAL '5 days',    NOW() - INTERVAL '3 days'),
  ('SHP-000015', 7, 3, 4, 'in_transit',  'Atlanta, GA',       'Dallas, TX',         670.00,  4.80, 'DN-0015', NOW() - INTERVAL '18 hours',  NULL)
ON CONFLICT DO NOTHING;

-- ── Seed: Tracking Events ──────────────────────────────────────────────────────

INSERT INTO tracking_events (shipment_id, event_type, location_name, lat, lon, message, recorded_at) VALUES
  ('SHP-000001', 'pickup',      'NYC Distribution Center',  40.7128, -74.0060, 'Package collected from sender',               NOW() - INTERVAL '48 hours'),
  ('SHP-000001', 'checkpoint',  'Philadelphia Hub',         39.9526, -75.1652, 'In transit — on schedule',                    NOW() - INTERVAL '40 hours'),
  ('SHP-000001', 'checkpoint',  'Pittsburgh Depot',         40.4406, -79.9959, 'Customs clearance completed',                 NOW() - INTERVAL '30 hours'),
  ('SHP-000001', 'checkpoint',  'Columbus Relay',           39.9612, -82.9988, 'Driver rest stop — resuming shortly',         NOW() - INTERVAL '20 hours'),
  ('SHP-000001', 'checkpoint',  'St. Louis Gateway',        38.6270, -90.1994, 'Fuel & vehicle inspection passed',            NOW() - INTERVAL '10 hours'),
  ('SHP-000002', 'pickup',      'Chicago North Hub',        41.8781, -87.6298, 'Shipment loaded on VAN-001',                  NOW() - INTERVAL '24 hours'),
  ('SHP-000002', 'checkpoint',  'Indianapolis Relay',       39.7684, -86.1581, 'In transit — 2h ahead of schedule',           NOW() - INTERVAL '20 hours'),
  ('SHP-000002', 'checkpoint',  'Nashville Depot',          36.1627, -86.7816, 'On schedule — ETA 14h',                       NOW() - INTERVAL '12 hours'),
  ('SHP-000003', 'pickup',      'Atlanta Logistics Center', 33.7490, -84.3880, 'Collected by TRK-002',                        NOW() - INTERVAL '72 hours'),
  ('SHP-000003', 'checkpoint',  'Birmingham Hub',           33.5186, -86.8104, 'Checkpoint passed',                           NOW() - INTERVAL '60 hours'),
  ('SHP-000003', 'checkpoint',  'Jackson Relay',            32.2988, -90.1848, 'In transit',                                  NOW() - INTERVAL '48 hours'),
  ('SHP-000003', 'delivered',   'Dallas Distribution Park', 32.7767, -96.7970, 'Delivered — signed by J. Smith',              NOW() - INTERVAL '1 hour'),
  ('SHP-000005', 'pickup',      'NYC Metro Hub',            40.6892, -74.0445, 'Collected on TRK-003',                        NOW() - INTERVAL '12 hours'),
  ('SHP-000006', 'pickup',      'LA Port Warehouse',        33.7297,-118.2620, 'Picked up from port',                         NOW() - INTERVAL '48 hours'),
  ('SHP-000006', 'checkpoint',  'Ontario Relay',            34.0633,-117.6509, 'Highway I-10 — on track',                     NOW() - INTERVAL '36 hours'),
  ('SHP-000006', 'delivered',   'Phoenix Commerce Park',    33.4484,-112.0740, 'Delivered successfully — recipient: R. Davis', NOW() - INTERVAL '4 hours'),
  ('SHP-000009', 'pickup',      'Atlanta Southside Hub',    33.6890, -84.4720, 'Loaded on VAN-004',                           NOW() - INTERVAL '6 hours'),
  ('SHP-000010', 'pickup',      'Seattle Marine Terminal',  47.6062,-122.3321, 'Container loaded',                            NOW() - INTERVAL '72 hours'),
  ('SHP-000010', 'checkpoint',  'Portland Hub',             45.5051,-122.6750, 'Delay — road closure on I-5',                 NOW() - INTERVAL '50 hours'),
  ('SHP-000010', 'failed-attempt', 'Portland Hub',          45.5051,-122.6750, 'Delivery attempt failed — addressee unreachable', NOW() - INTERVAL '48 hours'),
  ('SHP-000011', 'pickup',      'NYC Downtown Hub',         40.7580, -73.9855, 'Collected',                                   NOW() - INTERVAL '96 hours'),
  ('SHP-000011', 'delivered',   'Chicago West Hub',         41.9000, -87.6500, 'Delivered successfully',                      NOW() - INTERVAL '48 hours'),
  ('SHP-000012', 'pickup',      'LA Inland Hub',            34.1066,-117.5929, 'Loaded on MCY-001',                           NOW() - INTERVAL '3 hours'),
  ('SHP-000014', 'pickup',      'Chicago O''Hare Hub',      41.9742, -87.9073, 'Collected on VAN-002',                        NOW() - INTERVAL '120 hours'),
  ('SHP-000014', 'delivered',   'Miami Port Logistics',     25.7617, -80.1918, 'Delivered — all items intact',                NOW() - INTERVAL '72 hours'),
  ('SHP-000015', 'pickup',      'Atlanta Northeast Hub',    33.8121, -84.3535, 'Loaded on TRK-003',                           NOW() - INTERVAL '18 hours')
ON CONFLICT DO NOTHING;
