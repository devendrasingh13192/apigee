On the **Apigee (Edge / X)** side, a Shipping API Proxy acts as the mediation, protocol translation, orchestration, and caching gateway between front-end consumers (e-commerce checkout, warehouse systems) and heterogeneous external carriers (FedEx, UPS, DHL, regional couriers).

The core responsibilities in Apigee are handling **rate calculation caching**, **protocol translation (REST to SOAP/XML)**, **parallel carrier rate shopping via ServiceCallouts**, and **asynchronous webhook ingestion**.

---

### High-Level Apigee Pipeline Architecture

```
[ Client: E-commerce / WMS / Mobile ]
                 │ (REST / JSON + OAuth2 / API Key)
                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      APIGEE PROXY ENDPOINT (INBOUND)                    │
│                                                                         │
│  1. Ingress & Security                                                  │
│     • SpikeArrest (Protect against traffic surges)                      │
│     • VerifyAPIKey / OAuthV2 (Authenticate merchant / client app)       │
│     • JSONThreatProtection (Inspect payload size & depth)               │
│                                                                         │
│  2. Cache Interception (Rating Flow)                                    │
│     • LookupCache (Key: FROM_ZIP + TO_ZIP + WEIGHT_BRACKET)             │
│     • If Cache Hit: Populate response and skip to RouteRule (no-target) │
│                                                                         │
│  3. Multi-Carrier Rate Shopping (Parallel Orchestration Flow)          │
│     • JavaScript / JavaCallout (Build carrier-specific payloads)        │
│     • ServiceCallout (FedEx REST API)                                   │
│     • ServiceCallout (UPS SOAP/XML API)                                 │
│     • ServiceCallout (DHL Express API)                                  │
│     • JavaScript (Aggregate, compare, and rank best rates)              │
│                                                                         │
│  4. RouteRule Routing                                                   │
│     • Condition-based routing to specific Carrier TargetEndpoints       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     APIGEE TARGET ENDPOINTS (OUTBOUND)                  │
│                                                                         │
│  5. Protocol & Payload Transformation                                   │
│     • JSONtoXML / XSLT (Transform modern JSON into carrier SOAP/XML)    │
│     • AssignMessage (Inject Carrier Account Numbers, API Secrets)       │
│     • Target Server Load Balancing & Failover (HealthMonitor)           │
│                                                                         │
│  6. Response Mediation & Caching                                        │
│     • XMLtoJSON (Convert SOAP envelope back to standard JSON)           │
│     • PopulateCache (Cache successful zone-based rate quotes)           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (mTLS / Carrier Auth)
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │                  EXTERNAL LOGISTICS APIS                │
        │   • FedEx REST APIs                                     │
        │   • UPS SOAP Web Services                               │
        │   • DHL Express / Regional Couriers                     │
        │   • Internal Warehouse / Manifest DB                    │
        └─────────────────────────────────────────────────────────┘

```

---

### Key Design Patterns on the Apigee Gateway

**1. Address-Zone & Weight Rate Caching**

* **The Challenge:** Querying live carrier APIs during every product page or cart view introduces latency (300ms–1500ms) and incurs API billing costs.
* **Apigee Implementation:**
* Use **`LookupCache`** in the `ProxyEndpoint` PreFlow.
* Generate composite cache keys:
```xml
<Key>
  <Prefix>RATE</Prefix>
  <Fragment ref="request.queryparam.origin_zip"/>
  <Fragment ref="request.queryparam.dest_zip"/>
  <Fragment ref="flow.weight_bracket"/>
</Key>

```


* Cache hits bypass external carrier calls completely via `<RouteRule name="no-target"/>`.



**2. Multi-Carrier Rate Shopping via Parallel ServiceCallouts**

* For dynamic rate shopping where multiple carriers must be quoted simultaneously:
* In the Request flow, use multiple parallel **`<ServiceCallout>`** policies pointing to different carrier endpoints.
* A subsequent **`<JavaScript>`** step aggregates responses, eliminates expired options, extracts the cheapest/fastest delivery windows, and normalizes them into a unified JSON format:
```json
{
  "quotes": [
    {"carrier": "FEDEX", "service": "GROUND", "cost": 12.50, "days": 3},
    {"carrier": "UPS", "service": "GROUND", "cost": 11.90, "days": 3}
  ]
}

```





**3. Legacy SOAP to Modern REST Transformation**

* Many enterprise carriers (e.g., legacy UPS, freight LTL providers) still use SOAP/XML interfaces.
* **In Request Flow:** Apigee accepts standard JSON from modern web apps, uses **`JSONtoXML`** or **`XSL`** policies to wrap it inside a SOAP `<Envelope><Body>...` structure, and sets the appropriate `SOAPAction` header.
* **In Response Flow:** Apigee runs **`XMLtoJSON`** and an **`AssignMessage`** / **`JavaScript`** policy to strip the verbose SOAP envelope and return clean JSON to the client.

**4. Carrier Credential & Secret Management**

* Carrier developer keys, meter numbers, and secrets should never be supplied by front-end clients.
* Use Apigee **Encrypted KVMs (Key Value Maps)** to look up carrier account numbers, client IDs, and secret tokens per environment or merchant tier.
* Use **`AssignMessage`** in the Target Request flow to inject these credentials right before dispatching to the carrier.

**5. Asynchronous Tracking Webhook Ingestion**

* Inbound tracking webhooks from carriers (e.g., package scanned, out for delivery) are received at dedicated Apigee webhook endpoints.
* **Authentication:** Verify HMAC signatures or bearer tokens from the carrier.
* **Buffer/Offload:** Instead of processing long-running business logic in the gateway, Apigee uses a **`<ServiceCallout>`** to push the event payload directly to a message broker (such as Google Cloud Pub/Sub or Apache Kafka) and immediately returns an HTTP `200 OK` to the carrier.

**6. Audit & Analytics in `PostClientFlow**`

* Log shipment metadata (Carrier, Service Level, Zone, Transit Time, Response Status) to telemetry destinations (BigQuery, Datadog, or Splunk) via **`<MessageLogging>`** in the **`PostClientFlow`** so that logging overhead does not add latency to label printing or checkout flows.