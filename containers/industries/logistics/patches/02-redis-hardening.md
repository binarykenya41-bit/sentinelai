# Redis Hardening — Patch Guide

## Vulnerabilities Found
| CVE / Issue | Severity | Description |
|-------------|----------|-------------|
| No Authentication | CRITICAL | Any network client reads/writes all keys |
| CVE-2022-0543 | CRITICAL (10.0) | Lua sandbox escape → OS RCE (Debian/Ubuntu) |
| CONFIG SET RCE | CRITICAL | File write via CONFIG + BGSAVE |
| SLAVEOF attack | HIGH | Replication hijack → module load RCE |

---

## Patch 1 — Require Authentication

```yaml
# docker-compose.yml — redis-tracking service:
redis-tracking:
  image: redis:7-alpine
  command: >
    redis-server
    --requirepass ${REDIS_TRACKING_PASSWORD:-change_me_strong_pass}
    --save 60 1
    --maxmemory 256mb
    --maxmemory-policy allkeys-lru
    --protected-mode yes
    --bind 0.0.0.0
```

```bash
# Add to .env:
REDIS_TRACKING_PASSWORD=Tr@ckingR3dis#2024!
```

---

## Patch 2 — Disable Dangerous Commands

```yaml
# In redis command config, rename dangerous commands to empty string:
redis-tracking:
  command: >
    redis-server
    --requirepass ${REDIS_TRACKING_PASSWORD}
    --rename-command CONFIG ""
    --rename-command DEBUG ""
    --rename-command SLAVEOF ""
    --rename-command REPLICAOF ""
    --rename-command MODULE ""
    --rename-command KEYS ""
    --protected-mode yes
```

---

## Patch 3 — Fix CVE-2022-0543 (Lua Escape)

```yaml
# Use the official Redis image, NOT Debian/Ubuntu system packages.
# The vulnerability is in Debian-packaged redis-server that links
# against system liblua5.1.so.0 instead of the bundled Lua.
# Official Docker image (redis:7-alpine) is NOT affected.

# Confirm you're using:
image: redis:7-alpine  # Alpine-based — no system liblua5.1 — NOT vulnerable

# Avoid:
# image: redis:7         # Debian-based — potentially vulnerable
# apt-get install redis  # Debian package — VULNERABLE on Ubuntu/Debian
```

---

## Patch 4 — Network Isolation

```yaml
# Remove the host port binding — Redis should only be reachable
# from other containers on the logistics-net network:
redis-tracking:
  # ports:
  #   - "9379:6379"   # REMOVE THIS — no host exposure needed
  networks:
    - logistics-net
```

---

## Patch 5 — ACL-Based Access Control (Redis 6+)

```
# redis-acl.conf — mount into container:
user default off               # Disable default user
user sentinel on >Tr@ckingR3dis#2024! ~shipment:* ~tracking:* +GET +SET +DEL +EXPIRE +TTL
user erpnext on >ErpR3dis#2024! ~cache:* ~session:* +GET +SET +DEL +EXPIRE
user admin on >AdmR3dis#2024! ~* +@all
```

```yaml
redis-tracking:
  command: redis-server --aclfile /etc/redis/redis-acl.conf
  volumes:
    - ./config/redis-acl.conf:/etc/redis/redis-acl.conf:ro
```

---

## Verification

```bash
# After patching — should refuse unauthenticated:
redis-cli -h localhost -p 9379 ping
# Expected: NOAUTH Authentication required

# Confirm CVE-2022-0543 is not present:
python3 exploit-files/tools/redis/logistics_redis_rce.py --port 9379 --check-cve-0543
# Expected: "Authentication required" and no Lua escape
```
