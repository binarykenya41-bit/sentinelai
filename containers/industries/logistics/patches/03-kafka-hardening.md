# Apache Kafka Hardening — Patch Guide

## Vulnerabilities Found
| CVE / Issue | Severity | Description |
|-------------|----------|-------------|
| No SASL/TLS | CRITICAL | Plaintext unauthenticated access to all topics |
| CVE-2023-25194 | HIGH (8.8) | MirrorMaker2 JAAS injection → RCE |
| Topic enumeration | HIGH | Internal topology fully visible |
| Message exfiltration | HIGH | Customer PII in shipment-created topic |
| Unauthorized produce | HIGH | Supply chain event poisoning |

---

## Patch 1 — Enable SASL/SCRAM Authentication

```yaml
# docker-compose.yml — kafka service environment:
kafka:
  environment:
    KAFKA_NODE_ID: 0
    KAFKA_PROCESS_ROLES: broker,controller
    # Use SASL_PLAINTEXT (or SASL_SSL for production):
    KAFKA_LISTENERS: SASL_PLAINTEXT://:9092,CONTROLLER://:9093
    KAFKA_ADVERTISED_LISTENERS: SASL_PLAINTEXT://kafka:9092
    KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,SASL_PLAINTEXT:SASL_PLAINTEXT
    KAFKA_SASL_ENABLED_MECHANISMS: SCRAM-SHA-512
    KAFKA_SASL_MECHANISM_INTER_BROKER_PROTOCOL: SCRAM-SHA-512
    KAFKA_INTER_BROKER_LISTENER_NAME: SASL_PLAINTEXT
    # JAAS config for broker
    KAFKA_OPTS: >
      -Djava.security.auth.login.config=/etc/kafka/kafka_server_jaas.conf
    KAFKA_ALLOW_EVERYONE_IF_NO_ACL_FOUND: "false"
    KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"  # Disable auto-create
  volumes:
    - ./config/kafka/kafka_server_jaas.conf:/etc/kafka/kafka_server_jaas.conf:ro
```

```
# config/kafka/kafka_server_jaas.conf:
KafkaServer {
    org.apache.kafka.common.security.scram.ScramLoginModule required
    username="admin"
    password="${KAFKA_ADMIN_PASSWORD}";
};
```

---

## Patch 2 — Remove Host Port Binding

```yaml
# Remove external Kafka port — only accessible from within Docker network:
kafka:
  # ports:
  #   - "9092:9092"   # REMOVE — Kafka should not be exposed to host
  networks:
    - logistics-net
```

---

## Patch 3 — Enable ACLs

```bash
# After enabling SASL, create per-service users with minimal ACLs:

# Create SCRAM users:
kafka-configs.sh --bootstrap-server kafka:9092 \
  --command-config admin.properties \
  --alter --add-config 'SCRAM-SHA-512=[iterations=8192,password=erpnext_pass]' \
  --entity-type users --entity-name erpnext-svc

kafka-configs.sh --bootstrap-server kafka:9092 \
  --command-config admin.properties \
  --alter --add-config 'SCRAM-SHA-512=[iterations=8192,password=tracker_pass]' \
  --entity-type users --entity-name tracker-svc

# Grant minimal ACLs:
kafka-acls.sh --bootstrap-server kafka:9092 --command-config admin.properties \
  --add --allow-principal User:erpnext-svc \
  --operation Write --topic erpnext-order

kafka-acls.sh --bootstrap-server kafka:9092 --command-config admin.properties \
  --add --allow-principal User:tracker-svc \
  --operation Read --topic shipment-created \
  --operation Read --topic shipment-updated \
  --operation Write --topic tracking-event
```

---

## Patch 4 — TLS Encryption (Production)

```yaml
# For production, add TLS:
KAFKA_LISTENERS: SSL://:9092,CONTROLLER://:9093
KAFKA_SSL_KEYSTORE_LOCATION: /etc/kafka/certs/kafka.keystore.jks
KAFKA_SSL_KEYSTORE_PASSWORD: ${KAFKA_KEYSTORE_PASSWORD}
KAFKA_SSL_KEY_PASSWORD: ${KAFKA_KEY_PASSWORD}
KAFKA_SSL_TRUSTSTORE_LOCATION: /etc/kafka/certs/kafka.truststore.jks
KAFKA_SSL_TRUSTSTORE_PASSWORD: ${KAFKA_TRUSTSTORE_PASSWORD}
KAFKA_SSL_CLIENT_AUTH: required
```

---

## Patch 5 — CVE-2023-25194 (Kafka Connect)

```yaml
# If you use Kafka Connect, restrict the REST API to localhost:
CONNECT_REST_HOST_NAME: 127.0.0.1  # Not 0.0.0.0
CONNECT_REST_PORT: 8083

# Validate connector configs — disallow JAAS overrides from user input:
# In connect-distributed.properties:
connector.client.config.override.policy=None
```

---

## Verification

```bash
# After patching — should refuse unauthenticated:
python3 exploit-files/tools/kafka/kafka_enum.py --bootstrap localhost:9092
# Expected: "SSL handshake failed" or "SASL authentication required"

# Verify with valid credentials:
kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --consumer.config consumer.properties \  # contains SASL credentials
  --topic shipment-created --from-beginning
```
