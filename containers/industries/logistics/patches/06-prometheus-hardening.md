# Prometheus Hardening — Patch Guide

## Vulnerabilities Found
| CVE / Issue | Severity | Description |
|-------------|----------|-------------|
| CVE-2019-3826 | MEDIUM (6.1) | Stored XSS via alert label values |
| Unauthenticated /metrics | HIGH | Full metrics exposure, internal host discovery |
| Unauthenticated /-/config | HIGH | Configuration file readable (may contain credentials) |
| Unauthenticated PromQL | HIGH | Arbitrary metric queries, data exfiltration |
| Internal host enumeration | MEDIUM | /api/v1/targets reveals all scrape endpoints |

---

## Patch 1 — Upgrade Prometheus (CVE-2019-3826)

```yaml
# docker-compose.yml — pin to patched version:
prometheus:
  image: prom/prometheus:v2.51.2   # Latest stable — CVE-2019-3826 fixed in 2.7.2+
```

---

## Patch 2 — Enable Basic Authentication

Prometheus >= 2.24.0 supports native web config with TLS + basic auth.

```yaml
prometheus:
  command:
    - "--config.file=/etc/prometheus/prometheus.yml"
    - "--storage.tsdb.path=/prometheus"
    - "--web.config.file=/etc/prometheus/web-config.yml"  # ADD THIS
    - "--web.enable-lifecycle"
  volumes:
    - ./config/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - ./config/prometheus-web-config.yml:/etc/prometheus/web-config.yml:ro
    - prometheus-data:/prometheus
```

```yaml
# config/prometheus-web-config.yml:
# Generate hash: htpasswd -nBC 12 "" | tr -d ':\n'
basic_auth_users:
  prometheus-admin: "$2y$12$REPLACE_WITH_BCRYPT_HASH"
  grafana-scraper: "$2y$12$REPLACE_WITH_BCRYPT_HASH_2"

tls_server_config:
  # Optional but recommended for production:
  # cert_file: /etc/prometheus/tls/server.crt
  # key_file: /etc/prometheus/tls/server.key
```

```bash
# Generate bcrypt hash:
htpasswd -nBC 12 prometheus-admin
# Paste result into web-config.yml

# .env additions:
PROMETHEUS_ADMIN_PASSWORD=Pr0m3th3us$2024!
```

---

## Patch 3 — Update Grafana Datasource to Use Auth

```yaml
# provisioning/datasources/datasources.yml:
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    basicAuth: true
    basicAuthUser: grafana-scraper
    secureJsonData:
      basicAuthPassword: ${GRAFANA_PROMETHEUS_PASSWORD}
```

---

## Patch 4 — Remove Host Port Binding

```yaml
# Prometheus should not be externally accessible — use Grafana as the UI:
prometheus:
  # ports:
  #   - "9191:9090"   # REMOVE — only Grafana needs to reach Prometheus
  expose:
    - "9090"
  networks:
    - logistics-net
```

---

## Patch 5 — Restrict Scrape Targets and Disable Lifecycle API

```yaml
# Remove --web.enable-lifecycle in production (allows config reload via HTTP POST)
# Only enable if you need remote config reloads:
prometheus:
  command:
    - "--config.file=/etc/prometheus/prometheus.yml"
    - "--storage.tsdb.path=/prometheus"
    - "--web.config.file=/etc/prometheus/web-config.yml"
    # Remove: - "--web.enable-lifecycle"
```

```yaml
# config/prometheus.yml — restrict scrape access:
global:
  scrape_interval: 30s
  external_labels:
    env: logistics

scrape_configs:
  - job_name: postgres
    static_configs:
      - targets: ['postgres-exporter:9187']
    basic_auth:  # If exporters also require auth
      username: prometheus-scraper
      password_file: /etc/prometheus/scraper_password

  - job_name: redis
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: kafka
    static_configs:
      - targets: ['kafka-exporter:9308']
```

---

## Patch 6 — Alert Label Sanitization (CVE-2019-3826)

```yaml
# Alertmanager config — add template sanitization:
# In alertmanager.yml:
templates:
  - '/etc/alertmanager/templates/*.tmpl'
# Ensure templates escape HTML:
# {{ .Labels.alertname | html }}  -- always use | html filter
```

---

## Verification

```bash
# Run the exploit probe — all endpoints should require auth:
python3 exploit-files/tools/prometheus/cve_2019_3826.py --target http://localhost:9191
# Expected: "HTTP 401" or "HTTP 403" on all sensitive endpoints

# Verify basic auth works:
curl -u prometheus-admin:${PROMETHEUS_ADMIN_PASSWORD} \
  http://localhost:9191/api/v1/query?query=up
# Expected: 200 with data

# Verify unauthenticated is blocked:
curl http://localhost:9191/-/config
# Expected: 401
```
