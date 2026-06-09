---
type: "docs"
title: "Configure AWS SQS Reaction"
linkTitle: "AWS SQS"
weight: 15
description: "Send messages to Amazon SQS when query results change"
related:
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Configure HTTP Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-http-reaction/"
    - title: "Configure gRPC Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-grpc-reaction/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

The AWS SQS {{< term "Reaction" >}} sends messages to Amazon Simple Queue Service (SQS) when query {{< term "Result Change Event" "results change" >}}. Use it to decouple downstream consumers, trigger asynchronous workflows, and integrate with AWS services.

## Basic Configuration

```yaml
reactions:
  - kind: aws-sqs
    id: order-notifications
    queries: [new-orders]
    queueUrl: https://sqs.us-east-1.amazonaws.com/123456789012/orders
    region: us-east-1
    defaultTemplate:
      added:
        body: '{"event":"new_order","data":{{json after}}}'
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `aws-sqs` |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `autoStart` | boolean | `true` | Start reaction automatically |
| `queueUrl` | string | Required | Full SQS queue URL |
| `region` | string | None | AWS region override |
| `endpointUrl` | string | None | Custom SQS endpoint (ElasticMQ/LocalStack) |
| `accessKeyId` | string | None | Explicit AWS access key ID |
| `secretAccessKey` | string | None | Explicit AWS secret access key |
| `fifoQueue` | boolean | `false` | Enable FIFO queue options |
| `messageGroupIdTemplate` | string | None | Handlebars template for FIFO `MessageGroupId` |
| `routes` | object | `{}` | Per-query templates |
| `defaultTemplate` | object | None | Fallback templates when a query-specific route is not defined |

## Route Configuration

Routes define how each change type is rendered into SQS messages. You can configure per-query routes or use `defaultTemplate` as a fallback.

Each query can have templates for different change types:

| Change Type | When Triggered | Data Available |
|-------------|----------------|----------------|
| `added` | New item in results | `{{after}}` |
| `updated` | Item changed | `{{before}}`, `{{after}}` |
| `deleted` | Item removed | `{{before}}` |

### Template Spec

Each change type accepts a template spec:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `body` | string | Empty (raw JSON fallback) | Handlebars template for the SQS message body |
| `messageAttributes` | object | `{}` | SQS message attributes with Handlebars-rendered values |

### Per-Query Routing

```yaml
reactions:
  - kind: aws-sqs
    id: multi-query-sqs
    queries: [orders, inventory]
    queueUrl: https://sqs.us-east-1.amazonaws.com/123456789012/events
    region: us-east-1
    routes:
      orders:
        added:
          body: '{"type":"order_created","order":{{json after}}}'
          messageAttributes:
            entity-type: order
            entity-id: "{{after.id}}"
        deleted:
          body: '{"type":"order_cancelled","id":"{{before.id}}"}'
      inventory:
        updated:
          body: '{"type":"stock_changed","sku":"{{after.sku}}","qty":{{after.quantity}}}'
    defaultTemplate:
      added:
        body: '{{json after}}'
      updated:
        body: '{{json after}}'
      deleted:
        body: '{{json before}}'
```

## Handlebars Templates

Message bodies and attribute values support Handlebars templating.

### Template Variables

| Variable | Available On | Description |
|----------|-------------|-------------|
| `{{after}}` | `added`, `updated` | The new data object |
| `{{after.property}}` | `added`, `updated` | Specific property from new data |
| `{{before}}` | `updated`, `deleted` | The previous data object |
| `{{before.property}}` | `updated`, `deleted` | Specific property from previous data |
| `{{query_id}}` | All | The query ID that produced this change |
| `{{query_name}}` | All | The query name |
| `{{operation}}` | All | The operation type (`add`, `update`, `delete`) |
| `{{timestamp}}` | All | Event timestamp |
| `{{json value}}` | All | JSON-serializes nested objects |

### Example Template

```yaml
defaultTemplate:
  added:
    body: |
      {
        "event": "created",
        "id": "{{after.id}}",
        "data": {{json after}},
        "query": "{{query_id}}",
        "timestamp": "{{timestamp}}"
      }
    messageAttributes:
      entity-id: "{{after.id}}"
      event-type: created
```

## Message Attributes

Every SQS message automatically includes the following system attributes:

| Attribute | Description |
|-----------|-------------|
| `drasi-query-id` | The ID of the query that produced the change |
| `drasi-operation` | The operation type (`add`, `update`, `delete`) |

User-defined attributes from `messageAttributes` are merged after system attributes. You can override system attribute keys if needed.

## FIFO Queue Support

For SQS FIFO queues, enable the `fifoQueue` option and optionally provide a `messageGroupIdTemplate`:

```yaml
reactions:
  - kind: aws-sqs
    id: ordered-events
    queries: [transactions]
    queueUrl: https://sqs.us-east-1.amazonaws.com/123456789012/events.fifo
    region: us-east-1
    fifoQueue: true
    messageGroupIdTemplate: "{{after.account_id}}"
    defaultTemplate:
      added:
        body: '{{json after}}'
      updated:
        body: '{{json after}}'
```

When `messageGroupIdTemplate` is omitted, the query ID is used as the message group ID.

{{< alert title="FIFO Queues" color="info" >}}
FIFO queue URLs must end in `.fifo`. SQS automatically generates a deduplication ID based on the message content unless content-based deduplication is disabled on the queue.
{{< /alert >}}

## Authentication

### IAM Roles (Recommended)

In production, use IAM roles attached to your compute environment (EC2 instance profile, ECS task role, etc.). No explicit credentials are needed in the configuration:

```yaml
reactions:
  - kind: aws-sqs
    id: sqs-iam
    queries: [events]
    queueUrl: https://sqs.us-east-1.amazonaws.com/123456789012/events
    region: us-east-1
    defaultTemplate:
      added:
        body: '{{json after}}'
```

The AWS SDK credential chain will resolve credentials automatically.

### Explicit Credentials (Development Only)

For local development or testing, provide explicit credentials:

```yaml
reactions:
  - kind: aws-sqs
    id: sqs-local
    queries: [events]
    queueUrl: http://localhost:4566/000000000000/test-queue
    region: us-east-1
    endpointUrl: http://localhost:4566
    accessKeyId: ${AWS_ACCESS_KEY_ID:-test}
    secretAccessKey: ${AWS_SECRET_ACCESS_KEY:-test}
    defaultTemplate:
      added:
        body: '{{json after}}'
```

{{< alert title="Security" color="warning" >}}
Never embed production AWS credentials directly in configuration files. Use IAM roles or environment variable interpolation.
{{< /alert >}}

## Examples

### Simple Event Queue

```yaml
reactions:
  - kind: aws-sqs
    id: event-queue
    queries: [user-signups]
    queueUrl: https://sqs.us-east-1.amazonaws.com/123456789012/signups
    region: us-east-1
    defaultTemplate:
      added:
        body: '{"userId":"{{after.id}}","email":"{{after.email}}","signedUpAt":"{{timestamp}}"}'
        messageAttributes:
          event-type: user-signup
```

### Multi-Query with Custom Routing

```yaml
reactions:
  - kind: aws-sqs
    id: order-pipeline
    queries: [new-orders, cancelled-orders, shipped-orders]
    queueUrl: https://sqs.us-east-1.amazonaws.com/123456789012/order-events
    region: ${AWS_REGION:-us-east-1}
    routes:
      new-orders:
        added:
          body: |
            {
              "event": "order_created",
              "orderId": "{{after.id}}",
              "total": {{after.total}},
              "customer": "{{after.customer_id}}"
            }
          messageAttributes:
            event-type: order_created
            priority: "{{after.priority}}"
      cancelled-orders:
        added:
          body: '{"event":"order_cancelled","orderId":"{{after.id}}","reason":"{{after.reason}}"}'
          messageAttributes:
            event-type: order_cancelled
      shipped-orders:
        added:
          body: '{"event":"order_shipped","orderId":"{{after.id}}","trackingNumber":"{{after.tracking}}"}'
          messageAttributes:
            event-type: order_shipped
```

### FIFO Queue with Account Grouping

```yaml
reactions:
  - kind: aws-sqs
    id: account-events
    queries: [balance-changes]
    queueUrl: https://sqs.us-east-1.amazonaws.com/123456789012/account-events.fifo
    region: us-east-1
    fifoQueue: true
    messageGroupIdTemplate: "{{after.account_id}}"
    routes:
      balance-changes:
        updated:
          body: |
            {
              "account": "{{after.account_id}}",
              "previousBalance": {{before.balance}},
              "newBalance": {{after.balance}},
              "change": {{after.change_amount}}
            }
          messageAttributes:
            account-id: "{{after.account_id}}"
```

## Testing

### Local Testing with LocalStack

Use [LocalStack](https://localstack.cloud/) to test SQS locally:

```bash
# Start LocalStack
docker run -d --name localstack -p 4566:4566 localstack/localstack

# Create a test queue
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name test-queue
```

Configure the reaction to use the LocalStack endpoint:

```yaml
reactions:
  - kind: aws-sqs
    id: local-test
    queries: [my-query]
    queueUrl: http://localhost:4566/000000000000/test-queue
    region: us-east-1
    endpointUrl: http://localhost:4566
    accessKeyId: test
    secretAccessKey: test
    defaultTemplate:
      added:
        body: '{{json after}}'
      updated:
        body: '{{json after}}'
      deleted:
        body: '{{json before}}'
```

Verify messages are received:

```bash
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url http://localhost:4566/000000000000/test-queue
```

### Local Testing with ElasticMQ

[ElasticMQ](https://github.com/softwaremill/elasticmq) is a lightweight SQS-compatible message queue:

```bash
docker run -d --name elasticmq -p 9324:9324 softwaremill/elasticmq
```

```yaml
reactions:
  - kind: aws-sqs
    id: elasticmq-test
    queries: [my-query]
    queueUrl: http://localhost:9324/queue/test-queue
    region: us-east-1
    endpointUrl: http://localhost:9324
    accessKeyId: x
    secretAccessKey: x
    defaultTemplate:
      added:
        body: '{{json after}}'
```

## Limitations

- Messages are sent one at a time (no `SendMessageBatch` optimization)
- SQS message size limit applies (256 KB)
- Aggregation diffs are sent as `update` messages
- Noop diffs are silently ignored

## Complete Example

```yaml
host: 0.0.0.0
port: 8080
logLevel: info

sources:
  - kind: postgres
    id: products-db
    host: ${DB_HOST}
    database: inventory
    user: ${DB_USER}
    password: ${DB_PASSWORD}
    tables:
      - public.products

queries:
  - id: low-stock
    query: |
      MATCH (p:products)
      WHERE p.quantity < 10
      RETURN p.id, p.name, p.sku, p.quantity
    sources:
      - sourceId: products-db

reactions:
  - kind: aws-sqs
    id: stock-alerts
    queries: [low-stock]
    queueUrl: ${SQS_QUEUE_URL}
    region: ${AWS_REGION:-us-east-1}
    fifoQueue: false
    routes:
      low-stock:
        added:
          body: |
            {
              "alert": "low_stock",
              "product": "{{after.name}}",
              "sku": "{{after.sku}}",
              "currentStock": {{after.quantity}}
            }
          messageAttributes:
            alert-type: low_stock
            sku: "{{after.sku}}"
        updated:
          body: |
            {
              "alert": "stock_update",
              "product": "{{after.name}}",
              "sku": "{{after.sku}}",
              "previousStock": {{before.quantity}},
              "currentStock": {{after.quantity}}
            }
          messageAttributes:
            alert-type: stock_update
            sku: "{{after.sku}}"
        deleted:
          body: |
            {
              "alert": "product_removed",
              "product": "{{before.name}}",
              "sku": "{{before.sku}}"
            }
          messageAttributes:
            alert-type: product_removed
```

## Documentation resources

<div class="card-grid card-grid--2">
  <a href="https://github.com/drasi-project/drasi-core/blob/main/components/reactions/aws-sqs/README.md" target="_blank" rel="noopener">
    <div class="unified-card unified-card--tutorials">
      <div class="unified-card-icon"><i class="fab fa-github"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">AWS SQS Reaction README</h3>
        <p class="unified-card-summary">Plugin configuration, templates, and testing</p>
      </div>
    </div>
  </a>
  <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fab fa-aws"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Amazon SQS Developer Guide</h3>
        <p class="unified-card-summary">AWS documentation for SQS concepts and best practices</p>
      </div>
    </div>
  </a>
</div>

## Next steps

- [Configure HTTP Reaction](/drasi-server/how-to-guides/configuration/configure-reactions/configure-http-reaction/)
- [Configure gRPC Reaction](/drasi-server/how-to-guides/configuration/configure-reactions/configure-grpc-reaction/)
