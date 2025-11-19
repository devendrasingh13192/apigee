### **Example Apigee Policies for Handling Large Responses (>10MB)**  

Since Apigee has a **10MB limit**, here are practical solutions with example policies:

---

## **1. Pagination Policy (Split Large Responses into Pages)**  
**Use Case**: Your backend returns 50MB of data, but you want to split it into 1MB chunks.  

### **Step 1: Modify Backend to Support Pagination**  
Ensure your backend accepts `limit` and `offset` (or `page` + `pageSize`) parameters.  

### **Step 2: Apigee Proxy Implementation**  
#### **A. Assign Query Parameters (JavaScript Policy)**  
```xml
<JavaScript name="JS-SetPaginationParams">
  <ResourceURL>jsc://set-pagination.js</ResourceURL>
</JavaScript>
```
**`set-pagination.js`** (Sets default pagination if not provided):  
```javascript
var limit = context.getVariable("request.queryparam.limit") || "1000"; // Default: 1000 records
var offset = context.getVariable("request.queryparam.offset") || "0";

context.setVariable("target.queryparam.limit", limit);
context.setVariable("target.queryparam.offset", offset);
```

#### **B. Target Endpoint Configuration**  
```xml
<TargetEndpoint name="paginated-backend">
  <HTTPTargetConnection>
    <URL>https://backend-api.example.com/data</URL>
    <Properties>
      <Property name="request.timeout.millis">60000</Property>
    </Properties>
  </HTTPTargetConnection>
</TargetEndpoint>
```

#### **C. Response (Add Next Page Link)**  
Use **ExtractVariables** to inject a `next_page` URL:  
```xml
<ExtractVariables name="EV-AddPaginationLinks">
  <Source>response</Source>
  <JSONPayload>
    <Variable name="next_offset" type="integer">
      <JSONPath>$.pagination.next_offset</JSONPath>
    </Variable>
  </JSONPayload>
  <VariablePrefix>pagination</VariablePrefix>
</ExtractVariables>
<AssignMessage name="AM-AddNextPageLink">
  <AssignVariable>
    <Name>response.header.next_page</Name>
    <Template>https://myapigee-api.com/data?limit={request.queryparam.limit}&offset={pagination.next_offset}</Template>
  </AssignVariable>
</AssignMessage>
```

---

## **2. External Storage Policy (Return a Downloadable Link)**  
**Use Case**: Your backend generates a 100MB CSV, but Apigee can’t handle it.  

### **Step 1: Upload to Cloud Storage (Backend Task)**  
- Backend uploads the file to **Google Cloud Storage (GCS), S3, or Azure Blob**.  
- Returns a **signed URL** (temporary download link).  

### **Step 2: Apigee Returns the Link**  
#### **A. ServiceCallout to Backend**  
```xml
<ServiceCallout name="SC-GetFileLink">
  <Request>
    <Set>
      <Headers>
        <Header name="Authorization">Bearer {request.header.auth}</Header>
      </Headers>
    </Set>
  </Request>
  <Response>file_link_response</Response>
  <HTTPTargetConnection>
    <URL>https://backend-api.example.com/generate-file</URL>
  </HTTPTargetConnection>
</ServiceCallout>
```

#### **B. Extract Link & Return to Client**  
```xml
<ExtractVariables name="EV-ExtractFileLink">
  <Source>file_link_response</Source>
  <JSONPayload>
    <Variable name="download_url">
      <JSONPath>$.file_url</JSONPath>
    </Variable>
  </JSONPayload>
</ExtractVariables>
<AssignMessage name="AM-ReturnFileLink">
  <Set>
    <Payload contentType="application/json">
      {
        "file_url": "{download_url}",
        "expires_in": "3600"
      }
    </Payload>
  </Set>
</AssignMessage>
```

---

## **3. Compression Policy (Reduce Response Size)**  
If your payload is **slightly over 10MB**, enable GZIP compression:  
```xml
<Properties>
  <Property name="response.compression.enabled">true</Property>
</Properties>
```

---

### **Which Solution Should You Use?**  
| Method               | When to Use                          | Example Policy Above |  
|----------------------|--------------------------------------|----------------------|  
| **Pagination**       | Large JSON/XML datasets              | ✅ Yes               |  
| **External Storage** | Huge files (PDF/CSV/ZIP)             | ✅ Yes               |  
| **Compression**      | If response is just over 10MB        | ✅ Simple config     |  

Would you like a **full API Proxy bundle** (ZIP) for any of these approaches? I can provide a ready-to-deploy example! 🚀