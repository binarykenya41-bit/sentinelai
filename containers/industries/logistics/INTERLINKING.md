# Logistics Stack — Service Interlinking

## Status: COMPLETE ✓

All services are interlinked with local auth (no SSO). Run `docker compose up -d` from this directory.

---

## Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │             sentinel-logistics               │
                    │                Docker Network                │
                    └─────────────────────────────────────────────┘
                         │            │              │
              ┌──────────▼───┐  ┌────▼────┐  ┌─────▼──────┐
              │   ERPNext    │  │ GitLab  │  │  Grafana   │
              │  :9000/:9001 │  │  :9080  │  │   :9100    │
              │  (MariaDB +  │  │ (local  │  │ (local     │
              │   3× Redis)  │  │  auth)  │  │  auth)     │
              └──────┬───────┘  └─────────┘  └─────┬──────┘
                     │  Sales Orders → Kafka         │ reads
                     │                              ▼
              ┌──────▼───────────────┐  ┌──────────────────────┐
              │      Kafka           │  │      Prometheus       │
              │      :9092           │  │       :9191           │
              │  (6 topics,          │  │  (scrapes all         │
              │   27 seed msgs)      │  │   exporters)          │
              └──────────────────────┘  └──────────────────────┘
                                              │ scrapes
                          ┌───────────────────┼────────────────────┐
                          ▼                   ▼                    ▼
              ┌───────────────────┐ ┌──────────────────┐ ┌──────────────────┐
              │  kafka-exporter   │ │postgres-exporter │ │ redis-exporter   │
              │     :9308         │ │     :9187         │ │    :9121         │
              └────────┬──────────┘ └────────┬─────────┘ └───────┬──────────┘
                       │                     │                    │
              ┌────────┘            ┌────────┘           ┌───────┘
              ▼                     ▼                    ▼
        ┌──────────┐     ┌─────────────────────┐  ┌──────────────┐
        │  Kafka   │     │  PostgreSQL          │  │    Redis     │
        │  broker  │     │  shipments DB :9432  │  │  tracking   │
        └──────────┘     │  (15 shipments,      │  │  cache :9379│
                         │   26 events,         │  │  (6 locs,   │
                         │   8 vehicles)        │  │   8 vehicles│
                         └─────────────────────┘  └─────────────┘
                                  ▲                       ▲
                         ERPNext customer refs      ERPNext shipment IDs
```

---

## 1. Prometheus → All Exporters

**Config:** `config/prometheus.yml`

| Job                | Target                    | What it scrapes              |
|--------------------|---------------------------|------------------------------|
| `grafana`          | `grafana:3000/metrics`    | Grafana self-monitoring      |
| `kafka-exporter`   | `kafka-exporter:9308`     | Topic offsets, consumer lag  |
| `postgres-exporter`| `postgres-exporter:9187`  | DB connections, query stats  |
| `redis-exporter`   | `redis-exporter:9121`     | Memory, ops/sec, cache hits  |
| `prometheus`       | `localhost:9090`           | Self                         |

---

## 2. Grafana → Prometheus + PostgreSQL (5 Dashboards)

**Datasources provisioned:** `config/grafana/provisioning/datasources/`
- `prometheus.yml` → UID `prometheus-logistics` → `http://prometheus:9090`
- `postgres.yml`   → UID `postgres-logistics`   → `postgres-shipment:5432/shipments`

**Dashboards provisioned:** `config/grafana/provisioning/dashboards/`

| File                         | Dashboard Name             | Primary Datasource |
|------------------------------|----------------------------|--------------------|
| `01-logistics-overview.json` | Logistics Operations       | PostgreSQL         |
| `02-infrastructure.json`     | Infrastructure Health      | Prometheus         |
| `03-keycloak-auth.json`      | Auth / Security Metrics    | Prometheus         |
| `04-kafka-events.json`       | Kafka Event Streaming      | Prometheus         |
| `05-redis-tracking.json`     | Redis Tracking Cache       | Prometheus         |

---

## 3. Kafka Topics + Seed Messages

**Service:** `kafka-init` (one-shot)
**Script:** `config/seed/02-kafka-init.sh`

| Topic               | Partitions | Seeded Events                         |
|---------------------|------------|---------------------------------------|
| `shipment-created`  | 3          | 5 new shipment events                 |
| `shipment-updated`  | 3          | 3 status updates                      |
| `delivery-confirmed`| 3          | 4 delivery confirmations              |
| `tracking-event`    | 6          | 7 location updates                    |
| `erpnext-order`     | 3          | 5 sales orders (mirror ERPNext SOs)   |
| `alert-triggered`   | 1          | 3 alert events                        |

---

## 4. PostgreSQL Shipment DB Seed

**Service:** `postgres-shipment` (init SQL on first boot)
**Script:** `config/seed/01-shipment-db.sql`

| Table              | Seeded Records |
|--------------------|---------------|
| `vehicles`         | 8             |
| `routes`           | 6             |
| `customers`        | 8             |
| `shipments`        | 15            |
| `tracking_events`  | 26            |

**ERPNext cross-reference:** `shipments.erpnext_delivery_note` → ERPNext DN number
**Customers cross-reference:** `customers.erpnext_id` → ERPNext Customer name

---

## 5. ERPNext Master Data Seed

**Service:** `erpnext-seed` (one-shot, runs after `erpnext-backend` is up)
**Script:** `config/seed/03-erpnext-seed.py`

Creates: 5 Customers, 3 Suppliers, 1 Item Group, 5 Items

Customer names match `customers.erpnext_id` in PostgreSQL:
- Apex Supply Co, BlueStar Retail, Central Pharma Ltd, Delta Electronics, Eagle Auto Parts

Sales Order IDs referenced in `erpnext-order` Kafka topic:
- SO-2026-0001 → SHP-000001, SO-2026-0002 → SHP-000002, etc.

---

## 6. Redis Tracking Cache Seed

**Service:** `redis-seed` (one-shot)
**Script:** `config/seed/04-redis-seed.sh`

| Key pattern              | Count | Content                        |
|--------------------------|-------|--------------------------------|
| `shipment:{id}:location` | 6     | Real-time GPS + driver info    |
| `shipment:{id}:eta`      | 5     | ETA in minutes + ISO timestamp |
| `vehicle:{plate}:status` | 8     | Fuel, status, current shipment |
| `alert:*`                | 3     | Active alert details           |
| `alerts:active`          | 1 set | Set of active alert IDs        |
| `stats:*`                | 6     | Dashboard counters             |

Shipment IDs in Redis (`SHP-000001`, `SHP-000002`, etc.) match PostgreSQL `shipments.id`.
Vehicle plates (`TRK-001`, `VAN-004`, etc.) match PostgreSQL `vehicles.plate`.

---

## Quick Start

```bash
cd containers/industries/logistics
docker compose up -d

# Watch one-shots complete:
docker compose logs -f kafka-init erpnext-seed redis-seed
```

### Service URLs

| Service    | URL                            | Login                              |
|------------|--------------------------------|------------------------------------|
| ERPNext    | http://localhost:9000          | Administrator / admin              |
| GitLab     | http://localhost:9080          | root / SentinelLogistics!          |
| Grafana    | http://localhost:9100          | admin / admin                      |
| Prometheus | http://localhost:9191          | (no auth)                          |
| Kafka      | localhost:9092                 | (no auth)                          |
| PostgreSQL | localhost:9432                 | logistics / logistics_pass         |
| Redis      | localhost:9379                 | (no auth)                          |
