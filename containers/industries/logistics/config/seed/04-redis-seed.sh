#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Redis Tracking Cache Seed — populates redis-tracking with active shipment
# locations, driver status, and ETA data
# Runs inside redis-seed container after redis-tracking is healthy
# ─────────────────────────────────────────────────────────────────────────────
R="redis-cli -h redis-tracking"

echo "=== Seeding Redis tracking cache ==="

# ── Active shipment locations (JSON) ──────────────────────────────────────────
# Key: shipment:{id}:location  TTL: 4h (active transit)
$R SET "shipment:SHP-000001:location" '{"lat":38.6270,"lon":-90.1994,"checkpoint":"St. Louis Gateway","driver":"James Wilson","vehicle":"TRK-001","speed_kmh":85,"heading":"W","updated":"2026-03-08T05:00:00Z"}' EX 14400
$R SET "shipment:SHP-000002:location" '{"lat":36.1627,"lon":-86.7816,"checkpoint":"Nashville Depot","driver":"Ahmed Khan","vehicle":"VAN-001","speed_kmh":80,"heading":"S","updated":"2026-03-08T04:00:00Z"}' EX 14400
$R SET "shipment:SHP-000005:location" '{"lat":40.6892,"lon":-74.0445,"checkpoint":"NYC Metro Hub","driver":"Lisa Park","vehicle":"TRK-003","speed_kmh":0,"heading":"W","updated":"2026-03-07T20:00:00Z"}' EX 14400
$R SET "shipment:SHP-000009:location" '{"lat":33.6890,"lon":-84.4720,"checkpoint":"Atlanta Southside Hub","driver":"Carlos Rivera","vehicle":"VAN-004","speed_kmh":70,"heading":"W","updated":"2026-03-08T02:00:00Z"}' EX 14400
$R SET "shipment:SHP-000012:location" '{"lat":34.1066,"lon":-117.5929,"checkpoint":"LA Inland Hub","driver":"Tom Brown","vehicle":"MCY-001","speed_kmh":55,"heading":"E","updated":"2026-03-08T05:30:00Z"}' EX 14400
$R SET "shipment:SHP-000015:location" '{"lat":33.8121,"lon":-84.3535,"checkpoint":"Atlanta Northeast Hub","driver":"David Lee","vehicle":"VAN-003","speed_kmh":75,"heading":"W","updated":"2026-03-07T14:00:00Z"}' EX 14400

# ── ETA cache (minutes remaining) ─────────────────────────────────────────────
# Key: shipment:{id}:eta  TTL: 30min (recalculated frequently)
$R SET "shipment:SHP-000001:eta" '{"eta_minutes":600,"eta_iso":"2026-03-08T15:00:00Z","distance_remaining_km":1200}' EX 1800
$R SET "shipment:SHP-000002:eta" '{"eta_minutes":720,"eta_iso":"2026-03-08T17:00:00Z","distance_remaining_km":980}' EX 1800
$R SET "shipment:SHP-000009:eta" '{"eta_minutes":360,"eta_iso":"2026-03-08T11:00:00Z","distance_remaining_km":520}' EX 1800
$R SET "shipment:SHP-000012:eta" '{"eta_minutes":180,"eta_iso":"2026-03-08T08:30:00Z","distance_remaining_km":250}' EX 1800
$R SET "shipment:SHP-000015:eta" '{"eta_minutes":480,"eta_iso":"2026-03-08T13:00:00Z","distance_remaining_km":700}' EX 1800

# ── Vehicle status ─────────────────────────────────────────────────────────────
# Key: vehicle:{plate}:status  TTL: 1h
$R SET "vehicle:TRK-001:status" '{"status":"in_transit","current_shipment":"SHP-000001","driver":"James Wilson","lat":38.6270,"lon":-90.1994,"fuel_pct":65}' EX 3600
$R SET "vehicle:TRK-002:status" '{"status":"available","current_shipment":null,"driver":"Maria Garcia","lat":34.0522,"lon":-118.2437,"fuel_pct":90}' EX 3600
$R SET "vehicle:TRK-003:status" '{"status":"in_transit","current_shipment":"SHP-000005","driver":"Lisa Park","lat":40.6892,"lon":-74.0445,"fuel_pct":80}' EX 3600
$R SET "vehicle:VAN-001:status" '{"status":"in_transit","current_shipment":"SHP-000002","driver":"Ahmed Khan","lat":36.1627,"lon":-86.7816,"fuel_pct":55}' EX 3600
$R SET "vehicle:VAN-002:status" '{"status":"available","current_shipment":null,"driver":"Sarah Chen","lat":29.7604,"lon":-95.3698,"fuel_pct":95}' EX 3600
$R SET "vehicle:VAN-003:status" '{"status":"in_transit","current_shipment":"SHP-000015","driver":"David Lee","lat":33.8121,"lon":-84.3535,"fuel_pct":70}' EX 3600
$R SET "vehicle:VAN-004:status" '{"status":"in_transit","current_shipment":"SHP-000009","driver":"Carlos Rivera","lat":33.6890,"lon":-84.4720,"fuel_pct":60}' EX 3600
$R SET "vehicle:MCY-001:status" '{"status":"in_transit","current_shipment":"SHP-000012","driver":"Tom Brown","lat":34.1066,"lon":-117.5929,"fuel_pct":88}' EX 3600

# ── Active alerts ──────────────────────────────────────────────────────────────
# Key: alerts:active  (set of alert IDs)
$R SADD "alerts:active" "ALT-001" "ALT-002" "ALT-003"
$R SET "alert:ALT-001" '{"id":"ALT-001","type":"delivery_failure","shipment":"SHP-000010","severity":"high","message":"Delivery failed — addressee unreachable at Portland Hub","ts":"2026-03-05T10:00:00Z"}' EX 86400
$R SET "alert:ALT-002" '{"id":"ALT-002","type":"vehicle_maintenance","vehicle":"TRK-003","severity":"medium","message":"TRK-003 due for scheduled maintenance","ts":"2026-03-06T08:00:00Z"}' EX 86400
$R SET "alert:ALT-003" '{"id":"ALT-003","type":"route_delay","shipment":"SHP-000010","severity":"medium","message":"I-5 road closure — 4h delay on SEA-SFO route","ts":"2026-03-05T08:00:00Z"}' EX 86400

# ── Dashboard counters (real-time stats) ───────────────────────────────────────
$R SET "stats:shipments:total"      15  EX 300
$R SET "stats:shipments:in_transit"  6  EX 300
$R SET "stats:shipments:pending"     4  EX 300
$R SET "stats:shipments:delivered"   4  EX 300
$R SET "stats:shipments:failed"      1  EX 300
$R SET "stats:vehicles:active"       6  EX 300

echo "=== Redis seed completed: $(redis-cli -h redis-tracking DBSIZE) keys ==="
