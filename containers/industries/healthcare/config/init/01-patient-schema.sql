-- MediCore Health Systems — Patient Database Schema

CREATE TABLE IF NOT EXISTS providers (
  provider_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  specialty     TEXT,
  npi           TEXT UNIQUE,
  email         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  patient_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn           TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  dob           DATE,
  ssn_last4     TEXT,
  insurance_id  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  apt_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID REFERENCES patients(patient_id),
  provider_id   UUID REFERENCES providers(provider_id),
  scheduled_at  TIMESTAMPTZ,
  status        TEXT CHECK (status IN ('scheduled','confirmed','completed','cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
  rx_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID REFERENCES patients(patient_id),
  provider_id   UUID REFERENCES providers(provider_id),
  medication    TEXT NOT NULL,
  dosage        TEXT,
  frequency     TEXT,
  prescribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lab_results (
  result_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID REFERENCES patients(patient_id),
  test_name     TEXT NOT NULL,
  result_value  TEXT,
  normal_range  TEXT,
  flagged       BOOLEAN DEFAULT FALSE,
  tested_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Seed providers
INSERT INTO providers (provider_id, name, specialty, npi, email) VALUES
  ('f1000001-cafe-cafe-cafe-000000000001', 'Dr. Sarah Chen', 'Internal Medicine', '1234567890', 'schen@medicore.health'),
  ('f1000001-cafe-cafe-cafe-000000000002', 'Dr. James Wilson', 'Cardiology', '1234567891', 'jwilson@medicore.health'),
  ('f1000001-cafe-cafe-cafe-000000000003', 'Dr. Emily Rodriguez', 'Oncology', '1234567892', 'erodriguez@medicore.health'),
  ('f1000001-cafe-cafe-cafe-000000000004', 'Dr. Michael Park', 'Radiology', '1234567893', 'mpark@medicore.health'),
  ('f1000001-cafe-cafe-cafe-000000000005', 'Dr. Lisa Thompson', 'Neurology', '1234567894', 'lthompson@medicore.health')
ON CONFLICT (npi) DO NOTHING;

-- Seed patients (sample PHI for demo purposes)
INSERT INTO patients (patient_id, mrn, name, dob, ssn_last4, insurance_id) VALUES
  ('a0000001-cafe-cafe-cafe-000000000001', 'MRN-100001', 'Robert Johnson', '1965-08-22', '4821', 'BCBS-882341'),
  ('a0000001-cafe-cafe-cafe-000000000002', 'MRN-100002', 'Maria Garcia', '1978-03-15', '9234', 'AETNA-441892'),
  ('a0000001-cafe-cafe-cafe-000000000003', 'MRN-100003', 'David Kim', '1952-11-07', '6612', 'MEDICARE-338821'),
  ('a0000001-cafe-cafe-cafe-000000000004', 'MRN-100004', 'Jennifer Walsh', '1990-06-30', '1183', 'CIGNA-772341'),
  ('a0000001-cafe-cafe-cafe-000000000005', 'MRN-100005', 'Thomas Brown', '1943-01-19', '7745', 'MEDICARE-009812')
ON CONFLICT (mrn) DO NOTHING;

-- Seed appointments
INSERT INTO appointments (patient_id, provider_id, scheduled_at, status, notes) VALUES
  ('a0000001-cafe-cafe-cafe-000000000001', 'f1000001-cafe-cafe-cafe-000000000001', '2024-01-20 09:00:00+00', 'confirmed', 'Annual checkup'),
  ('a0000001-cafe-cafe-cafe-000000000002', 'f1000001-cafe-cafe-cafe-000000000002', '2024-01-21 10:30:00+00', 'confirmed', 'Cardiology follow-up'),
  ('a0000001-cafe-cafe-cafe-000000000003', 'f1000001-cafe-cafe-cafe-000000000003', '2024-01-22 14:00:00+00', 'scheduled', 'Oncology consultation'),
  ('a0000001-cafe-cafe-cafe-000000000001', 'f1000001-cafe-cafe-cafe-000000000004', '2024-01-23 11:00:00+00', 'completed', 'Chest CT scan'),
  ('a0000001-cafe-cafe-cafe-000000000004', 'f1000001-cafe-cafe-cafe-000000000005', '2024-01-24 15:30:00+00', 'confirmed', 'Neurology evaluation'),
  ('a0000001-cafe-cafe-cafe-000000000005', 'f1000001-cafe-cafe-cafe-000000000001', '2024-01-25 09:30:00+00', 'confirmed', 'Medication review'),
  ('a0000001-cafe-cafe-cafe-000000000002', 'f1000001-cafe-cafe-cafe-000000000001', '2024-01-26 16:00:00+00', 'scheduled', 'Lab results review'),
  ('a0000001-cafe-cafe-cafe-000000000003', 'f1000001-cafe-cafe-cafe-000000000002', '2024-01-27 13:00:00+00', 'scheduled', 'ECG + stress test'),
  ('a0000001-cafe-cafe-cafe-000000000004', 'f1000001-cafe-cafe-cafe-000000000003', '2024-01-28 10:00:00+00', 'scheduled', 'Chemo cycle 3 planning'),
  ('a0000001-cafe-cafe-cafe-000000000005', 'f1000001-cafe-cafe-cafe-000000000004', '2024-01-29 14:30:00+00', 'scheduled', 'MRI brain');

-- Seed prescriptions
INSERT INTO prescriptions (patient_id, provider_id, medication, dosage, frequency) VALUES
  ('a0000001-cafe-cafe-cafe-000000000001', 'f1000001-cafe-cafe-cafe-000000000001', 'Metformin', '500mg', 'Twice daily'),
  ('a0000001-cafe-cafe-cafe-000000000002', 'f1000001-cafe-cafe-cafe-000000000002', 'Lisinopril', '10mg', 'Once daily'),
  ('a0000001-cafe-cafe-cafe-000000000003', 'f1000001-cafe-cafe-cafe-000000000003', 'Tamoxifen', '20mg', 'Once daily'),
  ('a0000001-cafe-cafe-cafe-000000000004', 'f1000001-cafe-cafe-cafe-000000000005', 'Levetiracetam', '500mg', 'Twice daily'),
  ('a0000001-cafe-cafe-cafe-000000000005', 'f1000001-cafe-cafe-cafe-000000000001', 'Atorvastatin', '40mg', 'Once daily at bedtime');

-- Seed lab results
INSERT INTO lab_results (patient_id, test_name, result_value, normal_range, flagged) VALUES
  ('a0000001-cafe-cafe-cafe-000000000001', 'HbA1c', '7.8%', '< 5.7%', TRUE),
  ('a0000001-cafe-cafe-cafe-000000000001', 'Fasting Glucose', '142 mg/dL', '70-99 mg/dL', TRUE),
  ('a0000001-cafe-cafe-cafe-000000000002', 'Troponin I', '0.04 ng/mL', '< 0.04 ng/mL', FALSE),
  ('a0000001-cafe-cafe-cafe-000000000002', 'BNP', '180 pg/mL', '< 100 pg/mL', TRUE),
  ('a0000001-cafe-cafe-cafe-000000000003', 'CA 19-9', '87 U/mL', '< 37 U/mL', TRUE),
  ('a0000001-cafe-cafe-cafe-000000000004', 'Valproic Acid', '68 mcg/mL', '50-100 mcg/mL', FALSE),
  ('a0000001-cafe-cafe-cafe-000000000005', 'LDL Cholesterol', '148 mg/dL', '< 100 mg/dL', TRUE),
  ('a0000001-cafe-cafe-cafe-000000000005', 'TSH', '0.3 mIU/L', '0.4-4.0 mIU/L', TRUE);
