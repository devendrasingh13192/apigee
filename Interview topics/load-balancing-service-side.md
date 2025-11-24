## 1. Application-Level
```java
// Spring Cloud LoadBalancer
@Bean
@LoadBalanced
public RestTemplate restTemplate() {
    return new RestTemplate();
}
// Use: http://service-name/api
```

## 2. Service Mesh (Istio)
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
spec:
  host: backend-service
  trafficPolicy:
    loadBalancer:
      simple: ROUND_ROBIN
```

## 3. Reverse Proxy (Nginx)
```nginx
upstream backend {
    least_conn;
    server 10.0.1.1:8080;
    server 10.0.1.2:8080;
    server 10.0.1.3:8080;
}
```

## 4. Database
```java
// Read/write splitting
@ReadOnlyRepository
public interface UserRepository {
    // Automatically routes to read replicas
}
```

## 5. Message Queues
```java
@KafkaListener(topics = "tasks", groupId = "backend-workers")
public void processTask(String task) {
    // Multiple instances automatically load balance
}
```

**Choose based on your architecture:** Service Mesh for microservices, Nginx for monoliths, client-side for fine-grained control.