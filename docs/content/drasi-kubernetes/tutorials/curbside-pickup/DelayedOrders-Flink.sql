-- 1. Define the Orders Source Table (PostgreSQL CDC via Kafka)
CREATE TABLE orders (
  order_id STRING,
  pickup_vehicle_plate STRING,
  order_status STRING,
  event_time TIMESTAMP(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND,
  PRIMARY KEY (pickup_vehicle_plate) NOT ENFORCED
) WITH (
  'connector' = 'kafka',
  'topic' = 'order_changes',
  'properties.bootstrap.servers' = 'localhost:9092',
  'format' = 'debezium-json',
  'scan.startup.mode' = 'earliest-offset'
);

-- 2. Define the Vehicles Source Table (MySQL CDC via Kafka)
CREATE TABLE vehicles (
  pickup_vehicle_plate STRING,
  vehicle_location STRING,
  event_time TIMESTAMP(3),
  WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND,
  PRIMARY KEY (pickup_vehicle_plate) NOT ENFORCED
) WITH (
  'connector' = 'kafka',
  'topic' = 'vehicle_changes',
  'properties.bootstrap.servers' = 'localhost:9092',
  'format' = 'debezium-json',
  'scan.startup.mode' = 'earliest-offset'
);

-- 3. Enrich Vehicle Events with Latest Order Status
CREATE VIEW enriched_vehicle_events AS
SELECT 
  v.pickup_vehicle_plate,
  v.vehicle_location,
  o.order_status,
  v.event_time
FROM vehicles v
LEFT JOIN orders FOR SYSTEM_TIME AS OF v.event_time AS o
ON v.pickup_vehicle_plate = o.pickup_vehicle_plate;

-- 4. Enrich Order Events with Latest Vehicle Location
CREATE VIEW enriched_order_events AS
SELECT 
  o.pickup_vehicle_plate,
  v.vehicle_location,
  o.order_status,
  o.event_time
FROM orders o
LEFT JOIN vehicles FOR SYSTEM_TIME AS OF o.event_time AS v
ON o.pickup_vehicle_plate = v.pickup_vehicle_plate;

-- 5. Combine All Enriched Events into a Single Stream
CREATE VIEW all_enriched_events AS
SELECT 
  'vehicle' AS event_type,
  pickup_vehicle_plate,
  vehicle_location,
  order_status,
  event_time
FROM enriched_vehicle_events
UNION ALL
SELECT 
  'order' AS event_type,
  pickup_vehicle_plate,
  vehicle_location,
  order_status,
  event_time
FROM enriched_order_events;

-- 6. Track Waiting State and Transitions
CREATE VIEW events_with_state AS
SELECT 
  *,
  vehicle_location = 'Curbside' AND order_status != 'Ready' AS is_waiting,
  LAG(vehicle_location = 'Curbside' AND order_status != 'Ready', 1, FALSE) 
    OVER (PARTITION BY pickup_vehicle_plate ORDER BY event_time) AS prev_is_waiting
FROM all_enriched_events;

-- 7. Identify Start Events (Waiting Begins)
CREATE VIEW start_events AS
SELECT 
  pickup_vehicle_plate,
  event_time AS start_time
FROM events_with_state
WHERE is_waiting AND NOT prev_is_waiting;

-- 8. Identify End Events (Waiting Ends)
CREATE VIEW end_events AS
SELECT 
  pickup_vehicle_plate,
  event_time AS end_time
FROM events_with_state
WHERE NOT is_waiting AND prev_is_waiting;

-- 9. Define the Output Sink Table
CREATE TABLE delayed_orders (
  op STRING,
  pickup_vehicle_plate STRING,
  time TIMESTAMP(3)
) WITH (
  'connector' = 'kafka',
  'topic' = 'delayed_orders',
  'properties.bootstrap.servers' = 'localhost:9092',
  'format' = 'json'
);

-- 10. Generate Insert and Delete Events
INSERT INTO delayed_orders
SELECT 
  'insert' AS op,
  s.pickup_vehicle_plate,
  s.start_time AS time
FROM start_events s
LEFT OUTER JOIN end_events e
ON s.pickup_vehicle_plate = e.pickup_vehicle_plate 
AND e.end_time > s.start_time 
AND e.end_time <= s.start_time + INTERVAL '5' MINUTE
WHERE e.end_time IS NULL
UNION ALL
SELECT 
  'delete' AS op,
  pickup_vehicle_plate,
  end_time AS time
FROM end_events;