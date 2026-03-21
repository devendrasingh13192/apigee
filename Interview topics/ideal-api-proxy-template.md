Here's an ideal, comprehensive `default.xml` API proxy template in Apigee with all the enterprise-grade components you requested:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<APIProxy revision="1" name="your-api-proxy">
    
    <!-- =============================================== -->
    <!-- IDEAL API PROXY TEMPLATE                        -->
    <!-- Includes: Authentication, Rate Limiting,        -->
    <!-- Message Formatting, Service Callout,            -->
    <!-- User Data Aggregation, Error Handling           -->
    <!-- =============================================== -->
    
    <ConfigurationVersion majorVersion="4" minorVersion="0"/>
    
    <!-- ==================== PROXY ENDPOINT ==================== -->
    <ProxyEndpoint name="default">
        <PreFlow name="PreFlow">
            <Request>
                <!-- Step 1: Authentication - Validate API Key or OAuth token -->
                <Step>
                    <Name>Verify-API-Key</Name>
                    <Condition>(request.verb != "OPTIONS")</Condition> <!-- Skip for CORS preflight -->
                </Step>
                
                <!-- Step 2: Spike Arrest - First line of defense against bursts -->
                <Step>
                    <Name>Spike-Arrest</Name>
                </Step>
                
                <!-- Step 3: Quota - Enforce rate limits per consumer -->
                <Step>
                    <Name>Quota-Limit</Name>
                    <Condition>verify-api-key.validated = true</Condition>
                </Step>
                
                <!-- Step 4: Message Validation - Check required headers/params -->
                <Step>
                    <Name>Validate-Request</Name>
                </Step>
            </Request>
            
            <Response>
                <!-- Step 5: Standardize success responses -->
                <Step>
                    <Name>Format-Success-Response</Name>
                    <Condition>(response.status.code = 200) or (response.status.code = 201)</Condition>
                </Step>
                
                <!-- Step 6: Add CORS headers to all responses -->
                <Step>
                    <Name>Add-CORS-Headers</Name>
                </Step>
            </Response>
        </PreFlow>
        
        <!-- ================ FLOWS ================ -->
        
        <!-- GET /users/{id} - Retrieve user data -->
        <Flow name="GetUser">
            <Condition>(proxy.pathsuffix MatchesPath "/users/*") and (request.verb = "GET")</Condition>
            <Request>
                <!-- Extract user ID from path -->
                <Step>
                    <Name>Extract-User-ID</Name>
                </Step>
                
                <!-- Check cache first -->
                <Step>
                    <Name>Lookup-Cache-User</Name>
                </Step>
            </Request>
            <Response>
                <!-- Aggregate data if needed -->
                <Step>
                    <Name>Service-Callout-Get-Orders</Name>
                    <Condition>(lookup-cache-user.cachehit != "true") and (user.has_orders = "true")</Condition>
                </Step>
                
                <!-- Populate cache for future requests -->
                <Step>
                    <Name>Populate-Cache-User</Name>
                    <Condition>(lookup-cache-user.cachehit != "true")</Condition>
                </Step>
                
                <!-- Format the aggregated response -->
                <Step>
                    <Name>Format-User-Response</Name>
                </Step>
            </Response>
        </Flow>
        
        <!-- POST /users - Create new user -->
        <Flow name="CreateUser">
            <Condition>(proxy.pathsuffix = "/users") and (request.verb = "POST")</Condition>
            <Request>
                <!-- Validate request payload -->
                <Step>
                    <Name>Validate-Create-User-Payload</Name>
                </Step>
                
                <!-- Transform request to backend format -->
                <Step>
                    <Name>Transform-Create-User-Request</Name>
                </Step>
            </Request>
        </Flow>
        
        <!-- GET /users/{id}/dashboard - Aggregated user dashboard -->
        <Flow name="GetUserDashboard">
            <Condition>(proxy.pathsuffix MatchesPath "/users/*/dashboard") and (request.verb = "GET")</Condition>
            <Request>
                <!-- Extract parameters -->
                <Step>
                    <Name>Extract-User-ID</Name>
                </Step>
            </Request>
            <Response>
                <!-- Parallel service callouts for data aggregation -->
                <Step>
                    <Name>Service-Callout-Get-Profile</Name>
                </Step>
                <Step>
                    <Name>Service-Callout-Get-Orders</Name>
                </Step>
                <Step>
                    <Name>Service-Callout-Get-Preferences</Name>
                </Step>
                
                <!-- Aggregate all data into single response -->
                <Step>
                    <Name>JavaScript-Aggregate-Dashboard</Name>
                </Step>
            </Response>
        </Flow>
        
        <!-- OPTIONS - CORS preflight -->
        <Flow name="OptionsPreFlight">
            <Condition>request.verb = "OPTIONS"</Condition>
            <Response>
                <Step>
                    <Name>Add-CORS-Headers</Name>
                </Step>
                <Step>
                    <Name>Set-Empty-Response</Name>
                </Step>
            </Response>
        </Flow>
        
        <!-- ================ POST FLOW / ERROR HANDLING ================ -->
        <PostFlow name="PostFlow">
            <Request/>
            <Response>
                <!-- Logging for analytics -->
                <Step>
                    <Name>Log-Transaction</Name>
                </Step>
            </Response>
        </PostFlow>
        
        <!-- ================ FAULT RULES ================ -->
        <FaultRules>
            <!-- Authentication Error Handler -->
            <FaultRule name="Authentication-Errors">
                <Condition>(fault.name = "InvalidApiKey") or (fault.name = "ApiKeyMissing") or 
                          (fault.name = "AccessTokenExpired") or (fault.name = "InvalidAccessToken")</Condition>
                <Step>
                    <Name>Set-Error-Response-Auth</Name>
                </Step>
                <Step>
                    <Name>Add-CORS-Headers</Name>
                </Step>
            </FaultRule>
            
            <!-- Rate Limit Error Handler -->
            <FaultRule name="RateLimit-Errors">
                <Condition>(fault.name = "QuotaViolation") or (fault.name = "SpikeArrestViolation")</Condition>
                <Step>
                    <Name>Set-Error-Response-RateLimit</Name>
                </Step>
                <Step>
                    <Name>Add-CORS-Headers</Name>
                </Step>
            </FaultRule>
            
            <!-- Validation Error Handler -->
            <FaultRule name="Validation-Errors">
                <Condition>(fault.name = "Step:Validate-Request:ThrowsError") or 
                          (fault.name = "Step:Validate-Create-User-Payload:ThrowsError")</Condition>
                <Step>
                    <Name>Set-Error-Response-Validation</Name>
                </Step>
                <Step>
                    <Name>Add-CORS-Headers</Name>
                </Step>
            </FaultRule>
            
            <!-- Backend/Service Error Handler -->
            <FaultRule name="Backend-Errors">
                <Condition>(fault.name = "ServiceCalloutError") or 
                          (fault.category = "target") or 
                          (response.status.code >= 500)</Condition>
                <Step>
                    <Name>Set-Error-Response-Backend</Name>
                </Step>
                <Step>
                    <Name>Add-CORS-Headers</Name>
                </Step>
            </FaultRule>
            
            <!-- Default Error Handler (catch-all) -->
            <FaultRule name="Default-Error-Handler">
                <Step>
                    <Name>Set-Error-Response-Default</Name>
                </Step>
                <Step>
                    <Name>Add-CORS-Headers</Name>
                </Step>
            </FaultRule>
        </FaultRules>
        
        <!-- ================ DEFAULT ROUTE ================ -->
        <DefaultFaultRule name="Default-Fault-Rule">
            <Step>
                <Name>Set-Error-Response-Default</Name>
            </Step>
            <Step>
                <Name>Add-CORS-Headers</Name>
            </Step>
        </DefaultFaultRule>
        
        <HTTPProxyConnection>
            <BasePath>/v1/your-api</BasePath>
            <VirtualHost>secure</VirtualHost>
        </HTTPProxyConnection>
        
        <RouteRule name="default">
            <TargetEndpoint>default</TargetEndpoint>
        </RouteRule>
    </ProxyEndpoint>
    
    <!-- ==================== TARGET ENDPOINT ==================== -->
    <TargetEndpoint name="default">
        <PreFlow name="PreFlow">
            <Request>
                <!-- Remove headers that shouldn't go to backend -->
                <Step>
                    <Name>Remove-Sensitive-Headers</Name>
                </Step>
                
                <!-- Add backend-specific headers -->
                <Step>
                    <Name>Set-Backend-Headers</Name>
                </Step>
            </Request>
            <Response>
                <!-- Transform backend response if needed -->
                <Step>
                    <Name>Transform-Backend-Response</Name>
                    <Condition>response.status.code = 200</Condition>
                </Step>
            </Response>
        </PreFlow>
        
        <!-- ================ TARGET FLOWS ================ -->
        <Flows/>
        
        <!-- ================ TARGET FAULT RULES ================ -->
        <FaultRules/>
        
        <HTTPTargetConnection>
            <URL>https://your-backend-service.example.com</URL>
            
            <!-- SSL/TLS Configuration -->
            <SSLInfo>
                <Enabled>true</Enabled>
                <ClientAuthEnabled>false</ClientAuthEnabled>
                <KeyStore>ref://your-keystore-ref</KeyStore>
                <KeyAlias>your-key-alias</KeyAlias>
                <TrustStore>ref://your-truststore-ref</TrustStore>
            </SSLInfo>
            
            <!-- Connection Settings -->
            <Properties>
                <Property name="connect.timeout.millis">5000</Property>
                <Property name="read.timeout.millis">30000</Property>
                <Property name="max.connections">100</Property>
            </Properties>
        </HTTPTargetConnection>
    </TargetEndpoint>
    
</APIProxy>
```

## Accompanying Policy XML Files

### 1. **Verify-API-Key.xml** (Authentication)
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<VerifyAPIKey name="Verify-API-Key">
    <DisplayName>Verify API Key</DisplayName>
    <APIKey ref="request.header.x-api-key"/>
</VerifyAPIKey>
```

### 2. **Spike-Arrest.xml** (Burst Protection)
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<SpikeArrest name="Spike-Arrest">
    <DisplayName>Spike Arrest</DisplayName>
    <Rate>100pm</Rate> <!-- 100 requests per minute -->
    <UseEffectiveCount>true</UseEffectiveCount>
</SpikeArrest>
```

### 3. **Quota-Limit.xml** (Rate Limiting)
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Quota name="Quota-Limit">
    <DisplayName>Quota Limit</DisplayName>
    <Interval>1</Interval>
    <TimeUnit>minute</TimeUnit>
    <Allow count="50" countRef="verifyapikey.Verify-API-Key.developer.quota"/> <!-- 50 per minute -->
    <Distributed>true</Distributed>
    <Synchronize>true</Synchronize>
</Quota>
```

### 4. **Service-Callout-Get-Orders.xml** (Service Callout)
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ServiceCallout name="Service-Callout-Get-Orders">
    <DisplayName>Get User Orders</DisplayName>
    <Request variable="servicecallout.request">
        <Set>
            <Headers>
                <Header name="Accept">application/json</Header>
            </Headers>
            <Verb>GET</Verb>
        </Set>
    </Request>
    <Response>servicecallout.response.orders</Response>
    <HTTPTargetConnection>
        <URL>https://orders-service.example.com/users/{user.id}/orders</URL>
        <SSLInfo>
            <Enabled>true</Enabled>
        </SSLInfo>
        <Properties>
            <Property name="success.codes">2xx</Property>
        </Properties>
    </HTTPTargetConnection>
</ServiceCallout>
```

### 5. **Set-Error-Response-Auth.xml** (Error Handling)
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<AssignMessage name="Set-Error-Response-Auth">
    <DisplayName>Set Authentication Error Response</DisplayName>
    <Set>
        <Payload contentType="application/json">
        {
            "error": {
                "code": 401,
                "message": "Authentication failed. Valid API key required.",
                "status": "UNAUTHENTICATED",
                "timestamp": "{system.timestamp}",
                "path": "{request.path}"
            }
        }
        </Payload>
        <StatusCode>401</StatusCode>
        <ReasonPhrase>Unauthorized</ReasonPhrase>
    </Set>
    <IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables>
</AssignMessage>
```

### 6. **JavaScript-Aggregate-Dashboard.xml** (Data Aggregation)
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Javascript name="JavaScript-Aggregate-Dashboard">
    <DisplayName>Aggregate Dashboard Data</DisplayName>
    <ResourceURL>jsc://aggregate-dashboard.js</ResourceURL>
</Javascript>
```

```javascript
// aggregate-dashboard.js
var profile = JSON.parse(context.getVariable("servicecallout.response.profile.content") || "{}");
var orders = JSON.parse(context.getVariable("servicecallout.response.orders.content") || "{}");
var preferences = JSON.parse(context.getVariable("servicecallout.response.preferences.content") || "{}");

var dashboard = {
    user: profile,
    recentOrders: orders.recent || [],
    preferences: preferences,
    summary: {
        totalOrders: orders.total || 0,
        memberSince: profile.createdAt,
        accountStatus: profile.status
    },
    lastUpdated: new Date().toISOString()
};

context.setVariable("response.content", JSON.stringify(dashboard));
context.setVariable("response.header.Content-Type", "application/json");
```

### 7. **Lookup-Cache-User.xml** (Caching)
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<LookupCache name="Lookup-Cache-User">
    <DisplayName>Lookup User Cache</DisplayName>
    <CacheKey>
        <KeyFragment ref="user.id" type="string"/>
        <KeyFragment>user-profile</KeyFragment>
    </CacheKey>
    <CacheResource>user-cache</CacheResource>
    <Scope>Exclusive</Scope>
    <AssignTo>lookup-cache-user</AssignTo>
</LookupCache>
```

### 8. **Validate-Request.xml** (Message Formatting)
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Validate name="Validate-Request">
    <DisplayName>Validate Request</DisplayName>
    <Schema>
        <ResourceURL>xsd://user-schema.xsd</ResourceURL>
    </Schema>
    <Element>request.content</Element>
</Validate>
```

## Key Features of This Template:

1. **Authentication**: API Key validation at the edge
2. **Rate Limiting**: Both spike arrest (burst) and quota (sustained) limits
3. **Message Formatting**: Validation and transformation
4. **Service Callouts**: Multiple parallel calls for data aggregation
5. **Caching**: Reduce backend load
6. **Comprehensive Error Handling**: Specific responses for different error types
7. **CORS Support**: Cross-origin resource sharing headers
8. **Security**: Header sanitization, SSL configuration
9. **Logging**: Transaction logging for analytics
10. **Timeout Configuration**: Proper backend connection timeouts

This template follows enterprise best practices and can be adapted based on your specific requirements.