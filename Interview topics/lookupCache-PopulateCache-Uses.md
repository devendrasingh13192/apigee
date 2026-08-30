<PopulateCache name="Cache-Mobile-Response">
    <CacheResource>mobile-cache</CacheResource>
    <Scope>Exclusive</Scope>
    <ExpirySettings>
        <TimeoutInSec>300</TimeoutInSec> <!-- 5 minutes -->
    </ExpirySettings>
    <Source>response</Source>
    <Key>
        <Prefix>MOBILE_{client.app.id}</Prefix>
        <Fragment>
            <Prefix>_</Prefix>
            <Value>request.uri</Value>
        </Fragment>
    </Key>
</<PopulateCache>      

This policy writes the backend target's HTTP response object into Apigee’s distributed in-memory cache so future requests can retrieve it without hitting the backend server.

---

### Breakdown of What Each Element Does

* **`<CacheResource>mobile-cache</CacheResource>`**
Specifies the dedicated cache resource where the data lives. If not created explicitly in the environment, Apigee falls back to the default shared cache.
* **`<Scope>Exclusive</Scope>`**
Restricts the cache entry's visibility so it can only be accessed by this specific API proxy in this specific environment, preventing other proxies from overwriting or reading this data.
* **`<TimeoutInSec>300</TimeoutInSec>`**
Sets the Time-To-Live (TTL). The cached response stays in memory for **5 minutes (300 seconds)** before expiring automatically.
* **`<Source>response</Source>`**
Defines the data payload to cache. In this case, it captures the entire response message (headers and payload) received from the target backend.
* **`<Key>` Construction**
Generates a dynamic, composite cache key to store the entry under:
* **`<Prefix>MOBILE_{client.app.id}</Prefix>`**: Segregates cached responses per client application ID (e.g., `MOBILE_app123`).
* **`<Fragment>`**: Appends a delimiter (`_`) followed by the requested URI path and query string (e.g., `/products?category=phones`).
* **Resulting Cache Key Example:** `MOBILE_app123_/products?category=phones`



---

### How It Works in Practice

1. Typically placed in the **Target Response Flow** (or **Proxy Response Flow**).
2. When a mobile app makes a request, the backend responds.
3. This policy saves that backend response using the constructed key.
4. On subsequent calls, a companion **`<LookupCache>`** policy placed in the Request Flow can read from this same key and return the cached response immediately, bypassing the backend entirely.

---------------------------------------------------------------------------------------------------------------


<LookupCache name="Lookup-Mobile-Response">
    <CacheResource>mobile-cache</CacheResource>
    <Scope>Exclusive</Scope>
    <AssignTo>response</AssignTo>
    <Key>
        <Prefix>MOBILE_{client.app.id}</Prefix>
        <Fragment>
            <Prefix>_</Prefix>
            <Value>request.uri</Value>
        </Fragment>
    </Key>
</LookupCache>

```xml
<LookupCache name="Lookup-Mobile-Response">
    <CacheResource>mobile-cache</CacheResource>
    <Scope>Exclusive</Scope>
    <AssignTo>response</AssignTo>
    <Key>
        <Prefix>MOBILE_{client.app.id}</Prefix>
        <Fragment>
            <Prefix>_</Prefix>
            <Value>request.uri</Value>
        </Fragment>
    </Key>
</LookupCache>

```

**Key Details:**

* **Matching Configuration:** `<CacheResource>`, `<Scope>`, and the `<Key>` structure are identical to your `PopulateCache` policy so the cache keys match perfectly.
* **`<AssignTo>response</AssignTo>`:** Automatically populates the incoming client `response` object with the cached content on a cache hit, allowing Apigee to bypass the target endpoint and return the cached data immediately.

---------------------------------------------------------------------------------------------------------------------

Attach `LookupCache` in the **ProxyEndpoint Request PreFlow** to intercept requests early, and `PopulateCache` in the **TargetEndpoint Response PostFlow** only when a successful response is received from the backend.

```xml
<!-- /apiproxy/proxies/default.xml -->
<ProxyEndpoint name="default">
    <PreFlow name="PreFlow">
        <Request>
            <!-- 1. Authenticate to populate client.app.id -->
            <Step>
                <Name>Verify-API-Key</Name>
            </Step>
            <!-- 2. Attempt cache lookup -->
            <Step>
                <Name>Lookup-Mobile-Response</Name>
                <Condition>request.verb = "GET"</Condition>
            </Step>
        </Request>
        <Response/>
    </PreFlow>

    <RouteRule name="default">
        <!-- 3. If cache hit occurred, skip target backend routing -->
        <Condition>lookupcache.Lookup-Mobile-Response.cachehit = false</Condition>
        <TargetEndpoint>default</TargetEndpoint>
    </RouteRule>
    <!-- RouteRule without a TargetEndpoint acts as a null target for cache hits -->
    <RouteRule name="no-target"/>
</ProxyEndpoint>

```

```xml
<!-- /apiproxy/targets/default.xml -->
<TargetEndpoint name="default">
    <HTTPTargetConnection>
        <URL>https://api.example.com</URL>
    </HTTPTargetConnection>

    <PostFlow name="PostFlow">
        <Request/>
        <Response>
            <!-- 4. Save to cache only on HTTP 200 GET responses -->
            <Step>
                <Name>Cache-Mobile-Response</Name>
                <Condition>(response.status.code = 200) and (request.verb = "GET")</Condition>
            </Step>
        </Response>
    </PostFlow>
</TargetEndpoint>

```

**Key Execution Rules:**

* **`lookupcache.{policy-name}.cachehit`:** Automatically set to `true` or `false` by Apigee. Setting the conditional `RouteRule` ensures cache hits do not forward requests to your backend server.
* **Authentication First:** `Verify-API-Key` (or `OAuthV2`) must run before `LookupCache` so variables like `{client.app.id}` are resolved for the cache key.
* **Status Code Guards:** `PopulateCache` should always be guarded with `response.status.code = 200` and `request.verb = "GET"` to avoid caching errors (5xx/4xx) or mutations (POST/PUT/DELETE).