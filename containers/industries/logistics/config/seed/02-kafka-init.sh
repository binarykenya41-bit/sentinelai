#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Kafka seed messages — runs inside kafka-init container after topics are created
# Produces sample events to each logistics topic
# ─────────────────────────────────────────────────────────────────────────────
set -e
BS="kafka:9092"
PROD="/opt/kafka/bin/kafka-console-producer.sh"

echo "=== Seeding shipment-created ==="
for msg in \
  '{"shipment_id":"SHP-000001","status":"created","origin":"New York, NY","destination":"Los Angeles, CA","weight_kg":1250.50,"customer":"Apex Supply Co","item":"ELEC-001","erpnext_dn":"DN-0001","ts":1709769600000}' \
  '{"shipment_id":"SHP-000002","status":"created","origin":"Chicago, IL","destination":"Miami, FL","weight_kg":320.00,"customer":"BlueStar Retail","item":"FOOD-001","erpnext_dn":"DN-0002","ts":1709856000000}' \
  '{"shipment_id":"SHP-000003","status":"created","origin":"Atlanta, GA","destination":"Dallas, TX","weight_kg":85.50,"customer":"Central Pharma Ltd","item":"PHAR-001","erpnext_dn":"DN-0003","ts":1709683200000}' \
  '{"shipment_id":"SHP-000004","status":"created","origin":"Seattle, WA","destination":"San Francisco, CA","weight_kg":560.00,"customer":"Delta Electronics","item":"AUTO-001","erpnext_dn":"DN-0004","ts":1709942400000}' \
  '{"shipment_id":"SHP-000005","status":"created","origin":"New York, NY","destination":"Chicago, IL","weight_kg":2100.00,"customer":"Eagle Auto Parts","item":"AUTO-001","erpnext_dn":"DN-0005","ts":1709900000000}'; do
  echo "$msg" | $PROD --bootstrap-server $BS --topic shipment-created
done

echo "=== Seeding shipment-updated ==="
for msg in \
  '{"shipment_id":"SHP-000001","status":"in_transit","checkpoint":"St. Louis Gateway","lat":38.6270,"lon":-90.1994,"driver":"James Wilson","vehicle":"TRK-001","ts":1709942400000}' \
  '{"shipment_id":"SHP-000002","status":"in_transit","checkpoint":"Nashville Depot","lat":36.1627,"lon":-86.7816,"driver":"Ahmed Khan","vehicle":"VAN-001","ts":1709910000000}' \
  '{"shipment_id":"SHP-000010","status":"failed","reason":"Addressee unreachable","checkpoint":"Portland Hub","lat":45.5051,"lon":-122.6750,"ts":1709769600000}'; do
  echo "$msg" | $PROD --bootstrap-server $BS --topic shipment-updated
done

echo "=== Seeding delivery-confirmed ==="
for msg in \
  '{"shipment_id":"SHP-000003","delivered_at":"2026-03-07T19:00:00Z","signed_by":"J. Smith","location":"Dallas Distribution Park","lat":32.7767,"lon":-96.7970,"erpnext_dn":"DN-0003","ts":1709942400000}' \
  '{"shipment_id":"SHP-000006","delivered_at":"2026-03-08T04:00:00Z","signed_by":"R. Davis","location":"Phoenix Commerce Park","lat":33.4484,"lon":-112.0740,"erpnext_dn":"DN-0006","ts":1709956800000}' \
  '{"shipment_id":"SHP-000011","delivered_at":"2026-03-06T12:00:00Z","signed_by":"M. Johnson","location":"Chicago West Hub","lat":41.9000,"lon":-87.6500,"erpnext_dn":"DN-0011","ts":1709726400000}' \
  '{"shipment_id":"SHP-000014","delivered_at":"2026-03-05T08:00:00Z","signed_by":"A. Williams","location":"Miami Port Logistics","lat":25.7617,"lon":-80.1918,"erpnext_dn":"DN-0014","ts":1709640000000}'; do
  echo "$msg" | $PROD --bootstrap-server $BS --topic delivery-confirmed
done

echo "=== Seeding tracking-event ==="
for msg in \
  '{"shipment_id":"SHP-000001","event":"checkpoint","location":"St. Louis Gateway","lat":38.6270,"lon":-90.1994,"eta_h":10,"speed_kmh":85,"ts":1709942400000}' \
  '{"shipment_id":"SHP-000002","event":"checkpoint","location":"Nashville Depot","lat":36.1627,"lon":-86.7816,"eta_h":12,"speed_kmh":80,"ts":1709910000000}' \
  '{"shipment_id":"SHP-000005","event":"pickup","location":"NYC Metro Hub","lat":40.6892,"lon":-74.0445,"speed_kmh":0,"ts":1709900000000}' \
  '{"shipment_id":"SHP-000009","event":"pickup","location":"Atlanta Southside Hub","lat":33.6890,"lon":-84.4720,"speed_kmh":0,"ts":1709920000000}' \
  '{"shipment_id":"SHP-000012","event":"pickup","location":"LA Inland Hub","lat":34.1066,"lon":-117.5929,"eta_h":3,"speed_kmh":0,"ts":1709945600000}' \
  '{"shipment_id":"SHP-000015","event":"pickup","location":"Atlanta Northeast Hub","lat":33.8121,"lon":-84.3535,"eta_h":8,"speed_kmh":0,"ts":1709893200000}' \
  '{"shipment_id":"SHP-000010","event":"delay","location":"Portland Hub","lat":45.5051,"lon":-122.6750,"reason":"Road closure I-5","delay_h":4,"ts":1709769600000}'; do
  echo "$msg" | $PROD --bootstrap-server $BS --topic tracking-event
done

echo "=== Seeding erpnext-order ==="
for msg in \
  '{"order_id":"SO-2026-0001","customer":"Apex Supply Co","item":"ELEC-001","qty":50,"amount":125000,"status":"To Deliver","shipment_id":"SHP-000001","ts":1709769600000}' \
  '{"order_id":"SO-2026-0002","customer":"BlueStar Retail","item":"FOOD-001","qty":320,"amount":48000,"status":"To Deliver","shipment_id":"SHP-000002","ts":1709856000000}' \
  '{"order_id":"SO-2026-0003","customer":"Central Pharma Ltd","item":"PHAR-001","qty":85,"amount":212500,"status":"Completed","shipment_id":"SHP-000003","ts":1709683200000}' \
  '{"order_id":"SO-2026-0004","customer":"Delta Electronics","item":"AUTO-001","qty":140,"amount":84000,"status":"To Deliver","shipment_id":"SHP-000004","ts":1709942400000}' \
  '{"order_id":"SO-2026-0005","customer":"Eagle Auto Parts","item":"AUTO-001","qty":420,"amount":210000,"status":"To Deliver","shipment_id":"SHP-000005","ts":1709900000000}'; do
  echo "$msg" | $PROD --bootstrap-server $BS --topic erpnext-order
done

echo "=== Seeding alert-triggered ==="
for msg in \
  '{"alert_id":"ALT-001","type":"delivery_failure","shipment_id":"SHP-000010","severity":"high","message":"Delivery failed after 1 attempt at Portland Hub","notify":["ops@logistics.local"],"ts":1709769600000}' \
  '{"alert_id":"ALT-002","type":"vehicle_maintenance","vehicle":"TRK-003","severity":"medium","message":"TRK-003 scheduled for maintenance — no new assignments","ts":1709856000000}' \
  '{"alert_id":"ALT-003","type":"route_delay","shipment_id":"SHP-000010","severity":"medium","message":"I-5 road closure causing 4h delay on SEA-SFO route","ts":1709769600000}'; do
  echo "$msg" | $PROD --bootstrap-server $BS --topic alert-triggered
done

echo "=== All Kafka topics seeded ==="
