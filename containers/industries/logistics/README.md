# Logistics Industry Infrastructure Stack

**Sentinel AI** — Logistics / Supply Chain industry environment.

Models a realistic shipment-tracking and ERP company running on Docker.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   LOGISTICS INDUSTRY STACK                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  OPERATIONS SYSTEMS                                     │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  ERPNext (port 9000)          GitLab (port 9080) │   │   │
│  │  │  Supply chain & ERP           Dev repo & CI/CD   │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AUTHENTICATION                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Keycloak (port 9090)   — Employee SSO & IAM     │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  EVENT PROCESSING                                       │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  Kafka (port 9092)  — Shipment event streams     │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  DATA STORAGE                                           │   │
│  │  ┌──────────────────┐  ┌──────────────┐  ┌──────────┐ │   │
│  │  │ PostgreSQL :9432 │  │ MariaDB      │  │ Redis    │ │   │
│  │  │ Shipment DB      │  │ ERPNext DB   │  │ :9379    │ │   │
│  │  └──────────────────┘  └──────────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MONITORING                                             │   │
│  │  ┌──────────────────────────┐  ┌──────────────────────┐│   │
│  │  │ Prometheus (port 9191)   │→ │ Grafana (port 9100)  ││   │
│  │  └──────────────────────────┘  └──────────────────────┘│   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Services & Ports

| Service            | Port  | Credentials              | Purpose                         |
|--------------------|-------|--------------------------|----------------------------------|
| ERPNext            | 9000  | admin / admin            | ERP & supply chain management    |
| GitLab CE          | 9080  | root / SentinelLogistics!| Source code & CI/CD              |
| GitLab SSH         | 9022  | —                        | Git over SSH                     |
| Keycloak           | 9090  | admin / admin            | Employee authentication (SSO)    |
| Grafana            | 9100  | admin / admin            | Monitoring dashboards            |
| Prometheus         | 9191  | —                        | Metrics collection               |
| PostgreSQL         | 9432  | logistics / logistics_pass | Shipment tracking database      |
| Redis (tracking)   | 9379  | —                        | Real-time tracking cache         |
| Kafka              | 9092  | —                        | Logistics event streaming        |

---

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Pull all images first (GitLab is large ~2.5 GB)
docker compose pull

# 3. Start the stack
docker compose up -d

# 4. Watch startup (GitLab takes 3–5 minutes on first boot)
docker compose logs -f
```

### ERPNext Site Creation (one-time)

ERPNext runs two one-shot containers on first boot:
- `erpnext-configurator` — writes Redis/DB config
- `erpnext-create-site` — creates the `logistics.local` site

These exit automatically when done. Watch with:
```bash
docker compose logs -f erpnext-create-site
```

Once complete, access ERPNext at **http://localhost:9000** and log in with:
- Username: `Administrator`
- Password: `admin` (or what you set in `ERPNEXT_ADMIN_PASSWORD`)

### GitLab

GitLab takes 3–5 minutes to initialize on first boot.
Check readiness: `docker compose exec gitlab gitlab-ctl status`

Access at **http://localhost:9080**
Username: `root`  Password: `SentinelLogistics!`

### Keycloak

Access admin console at **http://localhost:9090/admin**
Username: `admin`  Password: `admin`

---

## Sentinel Scan Targets

When Sentinel scans this environment it will look for:

| Layer         | Target                       | CVE Examples                          |
|---------------|------------------------------|---------------------------------------|
| ERPNext       | `localhost:9000`             | CVE-2024-25136 (SQLi), CVE-2023-46127 |
| GitLab CE     | `localhost:9080`             | CVE-2023-7028 (account takeover)      |
| Keycloak      | `localhost:9090`             | CVE-2024-1132 (path traversal)        |
| PostgreSQL    | `localhost:9432`             | CVE-2024-0985 (privesc)               |
| Kafka         | `localhost:9092`             | Unauthenticated access                |
| Grafana       | `localhost:9100`             | CVE-2021-43798 (path traversal)       |
| Prometheus    | `localhost:9191`             | Unauthenticated metrics exposure      |

---

## Stop / Clean Up

```bash
# Stop containers (preserve volumes)
docker compose down

# Stop and delete all data volumes
docker compose down -v

# Remove images
docker compose down --rmi all
```

---

## Official Documentation References

- ERPNext Docker: https://github.com/frappe/frappe_docker
- GitLab Docker: https://docs.gitlab.com/ee/install/docker/
- Keycloak Docker: https://www.keycloak.org/getting-started/getting-started-docker
- Kafka (Apache): https://hub.docker.com/r/apache/kafka
- PostgreSQL: https://hub.docker.com/_/postgres
- Redis: https://hub.docker.com/_/redis
- Prometheus: https://prometheus.io/docs/prometheus/latest/installation/#using-docker
- Grafana: https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/
