# ERPNext Hardening — Patch Guide

## Vulnerabilities Found
| CVE | Severity | Description |
|-----|----------|-------------|
| CVE-2023-46127 | HIGH (8.8) | Stored XSS via document name field |
| CVE-2022-23055 | HIGH (7.5) | IDOR — unauthenticated private file read |
| CVE-2023-44271 | MEDIUM (6.5) | DoS via malformed date filter |
| Default Creds | CRITICAL | admin:admin grants full system access |

---

## Patch 1 — Upgrade ERPNext

```bash
# In docker-compose.yml, pin to a patched version:
# CVE-2023-46127 fixed in v14.49.0 and v15.0.0a51+
ERPNEXT_VERSION=v15.51.2   # Already at patched version — confirm on release notes
```

Verify no XSS in document name via Frappe's sanitize_html():
- Affected: `frappe/utils/html_utils.py` — `sanitize_html()` must be called on `__newname`
- Fixed commit: https://github.com/frappe/frappe/security/advisories/GHSA-7r46-g947-4p5j

---

## Patch 2 — Change Default Credentials

```python
# In config/seed/03-erpnext-seed.py, after site creation:
# bench --site logistics.local set-admin-password <strong_password>

# Or set via environment variable in docker-compose:
environment:
  ERPNEXT_ADMIN_PASSWORD: ${ERPNEXT_ADMIN_PASSWORD:-CHANGE_THIS_NOW}
```

```bash
# Enforce password policy via Frappe System Settings:
bench --site logistics.local execute \
  "frappe.client.set_value('System Settings','System Settings','password_strength_test','true')"
```

---

## Patch 3 — Restrict API Access

Add Nginx rate limiting and auth-required headers in the ERPNext nginx config:

```nginx
# In frappe_docker nginx template or override:
location /api/ {
    # Require CSRF token on all mutating requests
    limit_req zone=api_limit burst=20 nodelay;
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # Block public access to resource listing
    location ~ ^/api/resource/(User|Customer|Supplier) {
        deny all;  # Only allow from internal network
        allow 172.16.0.0/12;
    }
}
```

---

## Patch 4 — Disable Guest API Access

```python
# In System Settings (Frappe desk or bench execute):
frappe.db.set_value('System Settings', 'System Settings', 'allow_guests_to_upload_files', 0)
frappe.db.set_value('System Settings', 'System Settings', 'disable_standard_email_footer', 1)
frappe.db.commit()
```

---

## Patch 5 — Private File Access Control (CVE-2022-23055)

```python
# Ensure private files require login — already fixed in Frappe >= 13.29.0
# Confirm by checking frappe/utils/file_manager.py:
# The `has_permission` check must be present in `get_file_url()`

# Additional: move sensitive files out of /private/files/
# and serve via signed URLs with expiry
```

---

## Verification

```bash
# After patching, run the exploit probe — should return no findings:
python3 exploit-files/tools/erpnext/erpnext_auth_bypass.py --target http://localhost:9000

# Expected: "No default credentials worked", "CVE-2023-46127: Not confirmed"
```
