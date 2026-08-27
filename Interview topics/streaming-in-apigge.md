File streaming in Apigee allows proxies to pass large request or response payloads (like large JSON, XML, images, or media files) directly through the Message Processor chunk-by-chunk without buffering the entire payload in memory.

---

### How It Works

By default, Apigee buffers the complete HTTP message payload in memory to inspect, transform, or log it (enforcing a default limit, typically around 10 MB).

When **streaming** is enabled:

* The payload bypasses Apigee’s memory buffer.
* Apigee streams data chunks in real time as they arrive from the client to the target (request streaming) or from the target to the client (response streaming).
* This eliminates `413 Payload Too Large` errors and prevents out-of-memory crashes on Message Processors.

---

### How to Configure It

Streaming is enabled by setting specific flow variables to `true` inside a TargetEndpoint or ProxyEndpoint definition using `HTTPTargetConnection` properties or an `AssignMessage` policy.

#### 1. Setting Properties in Endpoint XML (Recommended)

Add `<Property>` elements directly inside the `<HTTPTargetConnection>` block of your TargetEndpoint definition:

```xml
<TargetEndpoint name="default">
  <HTTPTargetConnection>
    <URL>https://backend.example.com/files</URL>
    <Properties>
      <!-- Enable streaming for file uploads (Client -> Apigee -> Backend) -->
      <Property name="request.streaming.enabled">true</Property>
      
      <!-- Enable streaming for file downloads (Backend -> Apigee -> Client) -->
      <Property name="response.streaming.enabled">true</Property>
    </Properties>
  </HTTPTargetConnection>
</TargetEndpoint>

```

#### 2. Setting Dynamically via Flow Variables

You can also toggle streaming dynamically in the request flow using an `AssignMessage` policy:

```xml
<AssignMessage name="AM-EnableStreaming">
  <AssignVariable>
    <Name>request.streaming.enabled</Name>
    <Value>true</Value>
  </AssignVariable>
  <AssignVariable>
    <Name>response.streaming.enabled</Name>
    <Value>true</Value>
  </AssignVariable>
</AssignMessage>

```

---

### Critical Constraints When Streaming is Enabled

Because payloads are passed as a stream and not retained in memory:

* **No Payload Inspection/Transformation:** Policies that read or alter the payload (e.g., `JSONtoXML`, `XMLToJSON`, `ExtractVariables`, `JSONThreatProtection`) cannot access message bodies and will fail or disable streaming.
* **No Response Caching:** The `ResponseCache` policy cannot cache a streamed response.
* **Headers/Query Params Only:** Security policies (like `OAuthV2`, `VerifyAPIKey`, `SpikeArrest`) must operate strictly on HTTP headers, query parameters, or paths.