# Sentinel Logistics — Service Credentials

> **Scope:** Local demo / security research environment only.
> All services run inside the `sentinel-logistics` Docker network.
> External ports are listed for host-machine access.
> **Auth:** Local accounts only — no SSO.

---

## Application Services

### ERPNext ERP (http://localhost:9000)
| Account       | Username        | Password   | Role              |
|---------------|-----------------|------------|-------------------|
| Admin         | `Administrator` | `admin`    | System Manager    |

### GitLab CE (http://localhost:9080)
| Account       | Username | Password             | Role       |
|---------------|----------|----------------------|------------|
| Root admin    | `root`   | `SentinelLogistics!` | Admin      |

### Grafana (http://localhost:9100)
| Account       | Username | Password | Role        |
|---------------|----------|----------|-------------|
| Local admin   | `admin`  | `admin`  | Grafana Admin |

---

## Databases

### PostgreSQL — Shipment DB (localhost:9432)
| Role      | Username    | Password        | Database   |
|-----------|-------------|-----------------|------------|
| App user  | `logistics` | `logistics_pass`| `shipments`|

```bash
psql -h localhost -p 9432 -U logistics -d shipments
```

### MariaDB — ERPNext DB (internal only, port 3306)
| Role      | Username | Password       | Note                  |
|-----------|----------|----------------|-----------------------|
| Root      | `root`   | `erpnext_root` | Internal network only |

---

## Message Broker / Cache

### Apache Kafka (localhost:9092)
| Auth   | Bootstrap server | Note                  |
|--------|------------------|-----------------------|
| **None** | `localhost:9092` | Unauthenticated PLAINTEXT |

**Topics:** `shipment-created`, `shipment-updated`, `delivery-confirmed`, `tracking-event`, `erpnext-order`, `alert-triggered`

```bash
# Produce
kafka-console-producer.sh --bootstrap-server localhost:9092 --topic shipment-created
# Consume
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic shipment-created --from-beginning
```

### Redis — Tracking Cache (localhost:9379)
| Auth   | Connection string     | Note                        |
|--------|-----------------------|-----------------------------|
| **None** | `redis://localhost:9379` | No password, no TLS       |

```bash
redis-cli -h localhost -p 9379
```

---

## Monitoring

### Prometheus (http://localhost:9191)
| Auth   | Note                       |
|--------|----------------------------|
| **None** | Metrics exposed publicly |

### Grafana API (http://localhost:9100/api)
| Method         | Header / Query                    |
|----------------|-----------------------------------|
| Basic Auth     | `admin:admin`                     |
| Bearer Token   | Generate at /api/auth/keys        |

---

## Seed Data Summary

| Service        | Seeded Records                                                    |
|----------------|-------------------------------------------------------------------|
| ERPNext        | 5 customers, 3 suppliers, 5 items, 1 item group                  |
| PostgreSQL     | 8 vehicles, 6 routes, 8 customers, 15 shipments, 26 tracking events |
| Kafka          | 6 topics, 27 seed messages (shipment lifecycle events)            |
| Redis          | 6 shipment locations, 5 ETAs, 8 vehicle statuses, 3 alerts, 6 stats |
| GitLab         | Root account only — projects seeded manually                      |
| Grafana        | 5 dashboards, 2 datasources (Prometheus + PostgreSQL)             |

---

## Cross-Service Data Links

| Link                                      | From              | To                     |
|-------------------------------------------|-------------------|------------------------|
| `customers.erpnext_id`                    | PostgreSQL        | ERPNext Customer name  |
| `shipments.erpnext_delivery_note`         | PostgreSQL        | ERPNext Delivery Note  |
| `erpnext-order` Kafka topic               | Kafka             | ERPNext Sales Orders   |
| `shipment:*` Redis keys                   | Redis             | PostgreSQL shipments   |
| Grafana `postgres-logistics` datasource   | Grafana           | PostgreSQL shipments DB |
| Grafana `prometheus-logistics` datasource | Grafana           | Prometheus metrics     |
| Prometheus scrapes                        | Prometheus        | kafka-exporter, postgres-exporter, redis-exporter, grafana |

---

## Quick Connection Test

```bash
# Postgres
psql -h localhost -p 9432 -U logistics -d shipments -c "SELECT count(*) FROM shipments;"

# Redis
redis-cli -h localhost -p 9379 KEYS "shipment:*"

# Kafka topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# ERPNext API ping
curl http://localhost:9000/api/method/ping

# GitLab health
curl http://localhost:9080/-/health

# Grafana health
curl http://localhost:9100/api/health
```
