## Meaning of Cache Warming

**Cache warming** is the process of **pre-populating a cache** with data before it's actually needed by users.

### Simple Analogy:
- **Without warming**: Like a restaurant cooking food only after you order → you wait longer
- **With warming**: Like a buffet with food already prepared → instant service when you arrive

### Real-World Example:

**Before Cache Warming (Cold Cache):**
```javascript
User 1: Requests product details → Cache empty → Go to backend (slow) → Store in cache → Return to user
User 2: Requests same product → Cache has it → Return instantly (fast)
```

**After Cache Warming (Warm Cache):**
```javascript
// At 3 AM (before users arrive)
System: Pre-loads top 100 products into cache

User 1 (morning): Requests product → Cache already has it → Instant response
User 2 (afternoon): Requests product → Cache already has it → Instant response
```

### Why Warm Cache?
1. **First user isn't punished** with slow response
2. **Backend load is reduced** during peak hours
3. **Better user experience** from the start

### In Apigee Context:
```xml
<!-- Without warming: First request is slow -->
GET /products/123 → Cache MISS → Backend (500ms) → Cache → Response

<!-- With warming: All requests are fast -->
GET /products/123 → Cache HIT → Response (10ms)
```

**Key Point**: Cache warming = "Loading data into cache BEFORE users request it"

-----------------------------------------------------------------------------------------------------------------

## Cache Warming Strategies in Apigee

### 1. **Scheduled Job Approach**
```xml
<!-- Create a separate proxy for cache warming -->
<ProxyEndpoint name="cache-warmer">
    <RouteRule name="NoTarget">
        <Condition>true</Condition>
    </RouteRule>
    
    <PostFlow>
        <Request>
            <Step>
                <Name>JS-WarmCache</Name>
            </Step>
        </Request>
    </PostFlow>
</ProxyEndpoint>

<!-- JavaScript to populate cache -->
<Javascript name="JS-WarmCache">
    var popularKeys = ['product_123', 'product_456', 'config_prod'];
    for(var i=0; i<popularKeys.length; i++) {
        var data = getDataFromBackend(popularKeys[i]);
        cache.put(popularKeys[i], data, 3600); // 1 hour TTL
    }
</Javascript>
```

### 2. **First Request Warming**
```xml
<Flow name="CacheWarmOnFirstRequest">
    <Condition>(cache.somekey == null) and (request.verb = "GET")</Condition>
    <Request>
        <!-- Populate cache on first request -->
        <Step>
            <Name>ServiceCallout-GetData</Name>
        </Step>
        <Step>
            <Name>AM-StoreInCache</Name>
        </Step>
    </Request>
</Flow>
```

### 3. **Using PopulateCache Policy**
```xml
<PopulateCache name="PopulateCache-ProductData">
    <CacheKey>
        <KeyFragment ref="request.queryparam.productId"/>
    </CacheKey>
    <CacheResource>product-cache</CacheResource>
    <ExpirySettings>
        <TimeoutInSeconds>3600</TimeoutInSeconds>
    </ExpirySettings>
    <Source>response.content</Source>
</PopulateCache>
```

### 4. **Scheduled Warm-up with Cloud Scheduler**
- Set up a cron job (Google Cloud Scheduler, etc.)
- Call your API endpoints periodically
- Automatically populate cache during off-peak hours

### 5. **Deployment Hook Warming**
```javascript
// In your proxy bundle, include initialization code
if (context.getVariable("request.verb") == "WARMUP") {
    var cache = context.getVariable("cache");
    cache.put("app.config", loadConfigFromBackend(), 1800);
    context.setVariable("response.status", 200);
}
```

### 6. **KeyCache Policy for Preloading**
```xml
<KeyCache name="KeyCache-Preload">
    <CacheKey>
        <KeyFragment>preload-data</KeyFragment>
    </CacheKey>
    <CacheResource>my-cache</CacheResource>
    <Scope>Global</Scope>
    <KeyValues>
        <KeyValue>product-1:data</KeyValue>
        <KeyValue>product-2:data</KeyValue>
    </KeyValues>
</KeyCache>
```

### 7. **Simple Python Script for Warming**
```python
# External warming script
import requests
import time

endpoints = [
    "/products/123",
    "/products/456", 
    "/config/settings"
]

for endpoint in endpoints:
    requests.get(f"https://api.example.com{endpoint}")
    time.sleep(0.1)  # Rate limiting
```

**Best Practice**: Combine scheduled warming (off-peak) with lazy loading (on-demand) for optimal cache performance.