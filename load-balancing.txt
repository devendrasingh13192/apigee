# Load Balancing in Apigee - Code Snippets

## **1. Target Server Load Balancing**
```xml
<TargetEndpoint name="default">
  <HTTPTargetConnection>
    <LoadBalancer>
      <Algorithm>RoundRobin</Algorithm>
      <MaxFailures>3</MaxFailures>
      <RetryEnabled>true</RetryEnabled>
      <Server name="backend-server-1"/>
      <Server name="backend-server-2"/>
      <Server name="backend-server-3"/>
    </LoadBalancer>
    <Path>/api/v1</Path>
  </HTTPTargetConnection>
</TargetEndpoint>
```

## **2. Load Balancing Algorithms**
**Round Robin:**
```xml
<LoadBalancer>
  <Algorithm>RoundRobin</Algorithm>
  <Server name="server1"/>
  <Server name="server2"/>
</LoadBalancer>
```

**Weighted:**
```xml
<LoadBalancer>
  <Algorithm>Weighted</Algorithm>
  <Server name="server1" weight="3"/>
  <Server name="server2" weight="1"/>
</LoadBalancer>
```

**Least Connections:**
```xml
<LoadBalancer>
  <Algorithm>LeastConnections</Algorithm>
  <Server name="server1"/>
  <Server name="server2"/>
</LoadBalancer>
```

## **3. Health Monitoring**
**Target Server with Health Check:**
```xml
<TargetServer name="backend-server-1">
  <Host>backend1.example.com</Host>
  <Port>443</Port>
  <IsEnabled>true</IsEnabled>
  <HealthCheck>
    <IntervalInSec>30</IntervalInSec>
    <TimeoutInSec>10</TimeoutInSec>
    <HTTPMonitor>
      <Request>GET /health</Request>
      <SuccessResponse>2xx,3xx</SuccessResponse>
    </HTTPMonitor>
  </HealthCheck>
</TargetServer>
```

## **4. Failover & Retry**
**With Retry Configuration:**
```xml
<LoadBalancer>
  <Algorithm>RoundRobin</Algorithm>
  <RetryEnabled>true</RetryEnabled>
  <MaxRetries>2</MaxRetries>
  <RetryDelay>1000</RetryDelay>
  <MaxFailures>2</MaxFailures>
  <Server name="primary-server"/>
  <Server name="backup-server"/>
</LoadBalancer>
```

## **5. Multiple Target Servers Definition**
```xml
<TargetServer name="backend-server-1">
  <Host>10.0.1.10</Host>
  <Port>8080</Port>
  <IsEnabled>true</IsEnabled>
</TargetServer>

<TargetServer name="backend-server-2">
  <Host>10.0.1.11</Host>
  <Port>8080</Port>
  <IsEnabled>true</IsEnabled>
</TargetServer>

<TargetServer name="backend-server-3">
  <Host>10.0.1.12</Host>
  <Port>8080</Port>
  <IsEnabled>true</IsEnabled>
</TargetServer>
```

## **6. Complete Load Balancer Setup**
```xml
<TargetEndpoint name="load-balanced-backend">
  <PreFlow name="PreFlow">
    <Request/>
    <Response/>
  </PreFlow>
  <HTTPTargetConnection>
    <LoadBalancer>
      <Algorithm>Weighted</Algorithm>
      <RetryEnabled>true</RetryEnabled>
      <MaxRetries>3</MaxRetries>
      <MaxFailures>2</MaxFailures>
      <Server name="backend-server-1" weight="5"/>
      <Server name="backend-server-2" weight="3"/>
      <Server name="backend-server-3" weight="2"/>
    </LoadBalancer>
    <SSLInfo>
      <Enabled>true</Enabled>
    </SSLInfo>
    <Path>/service</Path>
  </HTTPTargetConnection>
</TargetEndpoint>
```

## **7. JavaScript Policy for Custom Load Balancing**
```javascript
var servers = [
    { host: "server1.example.com", weight: 3 },
    { host: "server2.example.com", weight: 2 },
    { host: "server3.example.com", weight: 1 }
];

// Custom weighted random selection
var selectedServer = context.getVariable('selected.server');
if (!selectedServer) {
    var totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
    var random = Math.floor(Math.random() * totalWeight);
    var weightSum = 0;
    
    for (var i = 0; i < servers.length; i++) {
        weightSum += servers[i].weight;
        if (random < weightSum) {
            context.setVariable('target.url', 'https://' + servers[i].host + '/api');
            break;
        }
    }
}
```