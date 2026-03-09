# Grafana Hardening — Patch Guide

## Vulnerabilities Found
| CVE / Issue | Severity | Description |
|-------------|----------|-------------|
| CVE-2021-43798 | HIGH (7.5) KEV | Path traversal → arbitrary file read |
| Default credentials | HIGH | admin:admin leaks all dashboard data |
| Anonymous access | MEDIUM | Dashboards readable without login |
| Datasource SSRF | MEDIUM | PostgreSQL datasource allows internal network scanning |

---

## Patch 1 — Upgrade Grafana (CVE-2021-43798)

```yaml
# docker-compose.yml — use a patched version:
grafana:
  image: grafana/grafana:10.4.2  # Pin to recent stable — CVE fixed in 8.3.2+
  # Current stack uses grafana/grafana:latest which should be patched
  # But pinning prevents silent regressions
```

CVE-2021-43798 is fixed in: 8.0.7, 8.1.8, 8.2.7, 8.3.2+

---

## Patch 2 — Change Default Credentials + Disable Anonymous

```yaml
grafana:
  environment:
    GF_SECURITY_ADMIN_USER: ${GF_ADMIN_USER:-grafana-admin}
    GF_SECURITY_ADMIN_PASSWORD: ${GF_ADMIN_PASSWORD}   # Remove default in .env
    GF_SECURITY_SECRET_KEY: ${GF_SECRET_KEY}           # Strong random secret
    GF_USERS_ALLOW_SIGN_UP: "false"
    GF_AUTH_ANONYMOUS_ENABLED: "false"
    GF_AUTH_DISABLE_LOGIN_FORM: "false"
    GF_SECURITY_DISABLE_GRAVATAR: "true"
    GF_SECURITY_COOKIE_SECURE: "true"
    GF_SECURITY_COOKIE_SAMESITE: strict
    GF_SECURITY_X_CONTENT_TYPE_OPTIONS: "true"
    GF_SECURITY_X_XSS_PROTECTION: "true"
    GF_SECURITY_CONTENT_SECURITY_POLICY: "true"
```

```bash
# .env:
GF_ADMIN_PASSWORD=Gr@f@na$ecure#2024!
GF_SECRET_KEY=$(openssl rand -base64 32)
```

---

## Patch 3 — Remove Host Port Binding

```yaml
# Grafana should only be accessible via a reverse proxy with auth:
grafana:
  # ports:
  #   - "9100:3000"   # Replace with Nginx reverse proxy + mTLS
  expose:
    - "3000"           # Internal only — accessible from logistics-net
```

Add Nginx/Traefik in front with:
- HTTPS termination
- Rate limiting on `/login`
- IP allowlist for admin access

---

## Patch 4 — Restrict Datasource Access (SSRF Prevention)

```yaml
# grafana.ini or environment variables:
GF_DATASOURCES_DEFAULT_ACCESS_CONTROL_ENABLED: "true"

# In provisioning/datasources/datasources.yml:
# Set access: server (not proxy) and add allowed_urls:
datasources:
  - name: PostgreSQL-Shipments
    type: postgres
    url: postgres-shipment:5432
    user: grafana_svc          # Use read-only grafana_svc user (see PG patch)
    secureJsonData:
      password: ${GRAFANA_DB_PASSWORD}
    jsonData:
      sslmode: require
      maxOpenConns: 5
      maxIdleConns: 2
```

---

## Patch 5 — Plugin Directory Hardening (CVE-2021-43798 Defense-in-Depth)

```ini
# grafana.ini:
[plugins]
allow_loading_unsigned_plugins =
enable_alpha = false

[paths]
plugins = /var/lib/grafana/plugins
# Ensure the plugins directory is read-only after provisioning:
# chmod 555 /var/lib/grafana/plugins
```

---

## Verification

```bash
# Test path traversal — should return 403 or redirect to login:
python3 exploit-files/tools/grafana/cve_2021_43798.py --target http://localhost:9100
# Expected: "Not readable (patched, perms, or file missing)" for all files

# Confirm default creds are rejected:
curl -s -o /dev/null -w "%{http_code}" \
  -X POST http://localhost:9100/api/login \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","password":"admin"}'
# Expected: 401
```
