-- NexaPay Financial — Banking Database Schema

CREATE TABLE IF NOT EXISTS accounts (
  account_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_no    TEXT UNIQUE NOT NULL,
  account_type  TEXT CHECK (account_type IN ('checking','savings','credit','investment')),
  holder_name   TEXT NOT NULL,
  balance       NUMERIC(15,2) DEFAULT 0.00,
  currency      TEXT DEFAULT 'USD',
  status        TEXT CHECK (status IN ('active','frozen','closed')) DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  tx_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID REFERENCES accounts(account_id),
  type          TEXT CHECK (type IN ('debit','credit','transfer','fee')),
  amount        NUMERIC(15,2) NOT NULL,
  currency      TEXT DEFAULT 'USD',
  description   TEXT,
  merchant      TEXT,
  fraud_score   NUMERIC(4,3),
  status        TEXT CHECK (status IN ('pending','cleared','flagged','reversed')) DEFAULT 'cleared',
  executed_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  alert_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id         UUID REFERENCES transactions(tx_id),
  account_id    UUID REFERENCES accounts(account_id),
  risk_score    NUMERIC(4,3),
  reason        TEXT,
  resolved      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed accounts
INSERT INTO accounts (account_id, account_no, account_type, holder_name, balance) VALUES
  ('c1000001-bead-bead-bead-000000000001', 'NXP-CHK-001847', 'checking', 'Acme Corp', 248932.50),
  ('c1000001-bead-bead-bead-000000000002', 'NXP-SAV-008821', 'savings',  'Globex Industries', 1823441.00),
  ('c1000001-bead-bead-bead-000000000003', 'NXP-CRD-003312', 'credit',   'Initech LLC', -42183.75),
  ('c1000001-bead-bead-bead-000000000004', 'NXP-INV-007732', 'investment','Umbrella Corp', 5821039.22),
  ('c1000001-bead-bead-bead-000000000005', 'NXP-CHK-009181', 'checking', 'Soylent Green Co', 83421.00)
ON CONFLICT (account_no) DO NOTHING;

-- Seed transactions
INSERT INTO transactions (account_id, type, amount, description, merchant, fraud_score, status) VALUES
  ('c1000001-bead-bead-bead-000000000001', 'debit',  12500.00, 'Wire transfer', 'INT-WIRE', 0.02, 'cleared'),
  ('c1000001-bead-bead-bead-000000000001', 'credit', 85000.00, 'Payroll deposit', 'PAYROLL', 0.01, 'cleared'),
  ('c1000001-bead-bead-bead-000000000002', 'credit', 500000.00, 'Investment return', 'BROKER-001', 0.03, 'cleared'),
  ('c1000001-bead-bead-bead-000000000003', 'debit',  8200.00, 'Equipment purchase', 'VENDOR-CC', 0.15, 'cleared'),
  ('c1000001-bead-bead-bead-000000000004', 'debit',  250000.00, 'Portfolio rebalance', 'INVEST-MGMT', 0.04, 'cleared'),
  ('c1000001-bead-bead-bead-000000000001', 'debit',  48300.00, 'Unusual wire - flagged', 'UNKNOWN-INT', 0.87, 'flagged'),
  ('c1000001-bead-bead-bead-000000000005', 'debit',  15000.00, 'ATM withdrawal - suspicious', 'ATM-OVERSEAS', 0.92, 'flagged');

-- Seed fraud alerts
INSERT INTO fraud_alerts (tx_id, account_id, risk_score, reason) 
SELECT t.tx_id, t.account_id, t.fraud_score, 
  CASE WHEN t.fraud_score > 0.85 THEN 'High-risk international wire' ELSE 'Velocity anomaly' END
FROM transactions t WHERE t.status = 'flagged';
