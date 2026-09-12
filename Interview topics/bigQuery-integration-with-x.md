
---
# Integrating BigQuery with Apigee X: Technical Architecture Guide

There are three architectural patterns to integrate Apigee X with BigQuery depending on whether you need custom event ingestion, platform analytics exports, or asynchronous high-throughput pipelines.

---

### Method 1: Ingest Custom Business Events via Pub/Sub (Recommended Production Pattern)

Direct synchronous calls to BigQuery from a proxy create latency spikes and risk quota throttling (`tabledata.insertAll`). The recommended enterprise pattern is to push events asynchronously to **Cloud Pub/Sub**, which streams directly into BigQuery.

1. **Prerequisites:**
* Create a BigQuery dataset and target table in your GCP project.
* Create a Cloud Pub/Sub topic and a **BigQuery subscription** (a native, zero-code subscription that writes incoming messages straight to your BigQuery table).


2. **Permissions:**
* Grant the Apigee service identity or proxy identity the `roles/pubsub.publisher` role.


3. **Use `<ServiceCallout>` in Apigee X with Native Google Auth:**
* Use Apigee X's built-in `<GoogleAccessToken>` tag. Apigee automatically fetches and caches short-lived Google OAuth tokens without custom code or manual key rotation.



**Production XML Configuration:**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ServiceCallout name="SC-Publish-To-PubSub">
    <Request>
        <Set>
            <Headers>
                <Header name="Content-Type">application/json</Header>
            </Headers>
            <Payload contentType="application/json">
                {
                    "messages": [
                        {
                            "data": "{encodeBase64(custom.analytics.payload)}"
                        }
                    ]
                }
            </Payload>
            <Verb>POST</Verb>
        </Set>
    </Request>
    <Response>pubsubResponse</Response>
    <HTTPTargetConnection>
        <!-- Native Google Auth in Apigee X -->
        <Authentication>
            <GoogleAccessToken>
                <Scopes>
                    <Scope>https://www.googleapis.com/auth/pubsub</Scope>
                </Scopes>
            </GoogleAccessToken>
        </Authentication>
        <URL>https://pubsub.googleapis.com/v1/projects/{organization.name}/topics/apigee-events:publish</URL>
    </HTTPTargetConnection>
</ServiceCallout>

```

---

### Method 2: Export Built-In Apigee Analytics Data

Use this pattern to export platform-level metrics (proxy latency, response codes, traffic volumes) to BigQuery for long-term historical reporting.

1. **Service Agent IAM:**
* Find the Apigee Organization Service Agent email via the Apigee API:
```
service-{ORG_PROJECT_NUMBER}@gcp-sa-apigee.iam.gserviceaccount.com

```


* Grant this service account the **BigQuery Data Editor** (`roles/bigquery.dataEditor`) and **BigQuery Job User** (`roles/bigquery.jobUser`) roles on the target GCP project.


2. **Create a Datastore (Apigee Management API):**
* Apigee X does not have an "Admin > Analytics Datastores" UI option like legacy Edge. Create the datastore by making a `POST` request to the Apigee X control plane:


```bash
curl -X POST "https://apigee.googleapis.com/v1/organizations/{ORG}/analytics/datastores" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "bigquery_analytics_sink",
    "targetType": "BIGQUERY",
    "datasetName": "apigee_analytics",
    "tablePrefix": "org_metrics"
  }'

```


3. **Trigger / Schedule Export Jobs:**
* Run export requests specifying the date range using the Apigee X export API endpoint:


```bash
POST https://apigee.googleapis.com/v1/organizations/{ORG}/environments/{ENV}/analytics/exports

```



---

### Method 3: Direct Call to BigQuery REST API (`insertAll`)

If you must write directly to BigQuery from the proxy without Pub/Sub, execute a REST call using `ServiceCallout`. Do not use hardcoded credentials or manual token handling.

1. **Target Table:** Create your BigQuery dataset and table.
2. **IAM:** Grant `roles/bigquery.dataEditor` to the service account executing the request.
3. **Proxy Callout:** Call the BigQuery streaming insert endpoint using `<GoogleAccessToken>` with the BigQuery scope:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ServiceCallout name="SC-Insert-BigQuery">
    <Request>
        <Set>
            <Headers>
                <Header name="Content-Type">application/json</Header>
            </Headers>
            <Payload contentType="application/json">
                {
                    "rows": [
                        {
                            "json": {
                                "client_id": "{client_id}",
                                "request_uri": "{request.uri}",
                                "response_status": {response.status.code},
                                "timestamp": "{system.timestamp}"
                            }
                        }
                    ]
                }
            </Payload>
            <Verb>POST</Verb>
        </Set>
    </Request>
    <Response>bqResponse</Response>
    <HTTPTargetConnection>
        <Authentication>
            <GoogleAccessToken>
                <Scopes>
                    <Scope>https://www.googleapis.com/auth/bigquery.insertdata</Scope>
                </Scopes>
            </GoogleAccessToken>
        </Authentication>
        <URL>https://bigquery.googleapis.com/bigquery/v2/projects/{organization.name}/datasets/my_dataset/tables/api_logs/data</URL>
    </HTTPTargetConnection>
</ServiceCallout>

```

---

### Comparison of Patterns in Apigee X

+---------------------------------------------------------------------------------------------------------+
|                               APIGEE X TO BIGQUERY INTEGRATION PATTERNS                                 |
+------------------------------------+--------------------+--------------------+--------------------------+
| Integration Pattern                | Latency Impact     | Scalability        | Best Used For            |
+------------------------------------+--------------------+--------------------+--------------------------+
| 1. Pub/Sub -> BigQuery             | Negligible         | Massive            | High-volume operational  |
|    [Apigee]                        | (< 15ms)           | (100k+ QPS)        | & transactional business |
|       | ServiceCallout             |                    |                    | events                   |
|       v                            |                    |                    |                          |
|    [Cloud Pub/Sub]                 |                    |                    |                          |
|       | BigQuery Subscription      |                    |                    |                          |
|       v                            |                    |                    |                          |
|    [BigQuery Table]                |                    |                    |                          |
+------------------------------------+--------------------+--------------------+--------------------------+
| 2. Analytics Datastore Export      | None               | Scheduled          | Platform-wide            |
|    [Apigee Analytics Engine]       | (Asynchronous      | Batch Data         | operational health,      |
|       | Scheduled Export Job       |  background job)   |                    | SLAs, and long-term      |
|       v                            |                    |                    | capacity planning        |
|    [Cloud Storage / BigQuery]      |                    |                    |                          |
+------------------------------------+--------------------+--------------------+--------------------------+
| 3. Direct REST Call                | High               | Limited            | Low-throughput proxies   |
|    [Apigee]                        | (50-150ms+         | (Bound by BQ       | requiring immediate,     |
|       | ServiceCallout (insertAll) |  per request)      |  streaming insert  | synchronous BigQuery     |
|       v                            |                    |  API quotas)       | validation               |
|    [BigQuery REST API]             |                    |                    |                          |