# PostgreSQL Hardening — Patch Guide

## Vulnerabilities Found
| CVE / Issue | Severity | Description |
|-------------|----------|-------------|
| Default credentials | HIGH | logistics:logistics_pass is guessable |
| CVE-2024-0985 | HIGH (8.0) | Privilege escalation via ALTER TABLE SET SCHEMA |
| SSL disabled | MEDIUM | Credentials transmitted in plaintext |
| CONFIG accessible | MEDIUM | pg_hba rules readable by authenticated users |
| MD5 password hashing | MEDIUM | Vulnerable to offline dictionary attacks |

---

## Patch 1 — Strong Credentials

```yaml
# docker-compose.yml — postgres-shipment:
postgres-shipment:
  environment:
    POSTGRES_DB: shipments
    POSTGRES_USER: ${PG_USER:-logistics}
    POSTGRES_PASSWORD: ${PG_PASSWORD}  # Remove default — must be set in .env
```

```bash
# .env:
PG_USER=logistics
PG_PASSWORD=Sh1pm3nt$DB#2024!SecurePass   # Strong, random, 20+ chars
```

---

## Patch 2 — Upgrade to Patched PostgreSQL Version (CVE-2024-0985)

```yaml
# CVE-2024-0985 is fixed in: 16.2, 15.6, 14.11, 13.14, 12.18
postgres-shipment:
  image: postgres:16.2-alpine   # Pinned to patched version
```

---

## Patch 3 — Enable scram-sha-256 and SSL

```sql
-- In init SQL (config/seed/01-shipment-db.sql), add at top:
-- Set password encryption before creating users
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SELECT pg_reload_conf();
```

```yaml
# In docker-compose, mount a custom postgresql.conf:
postgres-shipment:
  volumes:
    - pg-shipment-data:/var/lib/postgresql/data
    - ./config/seed/01-shipment-db.sql:/docker-entrypoint-initdb.d/01-shipment-db.sql:ro
    - ./config/postgresql/postgresql.conf:/etc/postgresql/postgresql.conf:ro
    - ./config/postgresql/pg_hba.conf:/etc/postgresql/pg_hba.conf:ro
  command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

```
# config/postgresql/pg_hba.conf:
# TYPE  DATABASE   USER       ADDRESS         METHOD
local   all        postgres                   peer
local   all        all                        scram-sha-256
host    shipments  logistics  172.16.0.0/12   scram-sha-256
host    all        all        0.0.0.0/0       reject
```

---

## Patch 4 — Remove Host Port Binding

```yaml
# Remove external PostgreSQL port — DB should only be reachable from logistics-net:
postgres-shipment:
  # ports:
  #   - "9432:5432"   # REMOVE in production — use internal network only
  networks:
    - logistics-net
```

---

## Patch 5 — Least Privilege Application User

```sql
-- In 01-shipment-db.sql, create a restricted app user:
-- Drop superuser access for the logistics user
ALTER ROLE logistics NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- Create a read-only role for reporting/Grafana:
CREATE ROLE grafana_reader NOLOGIN;
GRANT CONNECT ON DATABASE shipments TO grafana_reader;
GRANT USAGE ON SCHEMA public TO grafana_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO grafana_reader;

CREATE USER grafana_svc WITH PASSWORD '${GRAFANA_DB_PASSWORD}';
GRANT grafana_reader TO grafana_svc;

-- Application user: only DML, no DDL:
REVOKE CREATE ON SCHEMA public FROM logistics;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO logistics;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO logistics;
```

---

## Patch 6 — Enable Connection Logging

```
# config/postgresql/postgresql.conf:
log_connections = on
log_disconnections = on
log_failed_logins = on
log_duration = on
log_min_duration_statement = 1000   # Log slow queries (>1s)
password_encryption = scram-sha-256
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
```

---

## Verification

```bash
# Run the exploit probe — should fail auth:
python3 exploit-files/tools/postgresql/pg_auth_check.py --host localhost --port 9432
# Expected: "No default credentials worked"

# Verify scram-sha-256:
psql "host=localhost port=9432 dbname=shipments user=logistics" \
  -c "SHOW password_encryption;"
# Expected: scram-sha-256
```
