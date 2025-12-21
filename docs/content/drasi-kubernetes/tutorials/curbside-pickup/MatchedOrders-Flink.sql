-- Define the order_changes table (source from PostgreSQL via Debezium)
CREATE TABLE order_changes (
    order_id STRING,
    customer_name STRING,
    driver_name STRING,
    vehicle_plate STRING,
    status STRING,
    PRIMARY KEY (order_id) NOT ENFORCED
) WITH (
    'connector' = 'kafka',
    'topic' = 'order_changes',
    'properties.bootstrap.servers' = 'localhost:9092',
    'format' = 'debezium-json'
);

-- Define the vehicle_changes table (source from MySQL via Debezium)
CREATE TABLE vehicle_changes (
    vehicle_plate STRING,
    make STRING,
    model STRING,
    color STRING,
    location STRING,
    PRIMARY KEY (vehicle_plate) NOT ENFORCED
) WITH (
    'connector' = 'kafka',
    'topic' = 'vehicle_changes',
    'properties.bootstrap.servers' = 'localhost:9092',
    'format' = 'debezium-json'
);

-- Define the matched_orders table (sink to Kafka)
CREATE TABLE matched_orders (
    order_id STRING,
    customer_name STRING,
    driver_name STRING,
    vehicle_plate STRING,
    make STRING,
    model STRING,
    color STRING
) WITH (
    'connector' = 'kafka',
    'topic' = 'matched_orders',
    'properties.bootstrap.servers' = 'localhost:9092',
    'format' = 'changelog-json'
);

INSERT INTO matched_orders
SELECT 
    o.order_id,
    o.customer_name,
    o.driver_name,
    o.vehicle_plate,
    v.make,
    v.model,
    v.color
FROM 
    order_changes o
JOIN 
    vehicle_changes v
ON 
    o.vehicle_plate = v.vehicle_plate
WHERE 
    o.status = 'Ready' AND v.location = 'Curbside';