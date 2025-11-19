# Circuit Breaker Pattern

## 🎯 **What is Circuit Breaker?**

The **Circuit Breaker** is a resilience pattern that prevents an application from performing operations that are likely to fail. It's inspired by electrical circuit breakers - when too much current flows, the breaker trips to prevent damage.

## 🔧 **How It Works**

### **Three States of Circuit Breaker:**

-- refer diagram

### **1. CLOSED State** ✅
- **Normal operation**
- Requests flow through to backend
- Failures are counted
- When failure count exceeds threshold → transitions to OPEN

### **2. OPEN State** 🔴
- **Circuit is broken**
- Requests fail immediately without calling backend
- Returns fallback response or error
- After timeout period → transitions to HALF_OPEN

### **3. HALF_OPEN State** 🟡
- **Testing recovery**
- Limited number of requests allowed through
- If successful → transitions to CLOSED
- If any failure → transitions back to OPEN

## 💡 **Why We Use Circuit Breaker**

### **1. Prevent Cascading Failures** 🚫
**Without Circuit Breaker:**
```
Client → Failing Service → Timeout/Wait → Resource Exhaustion → System Crash
```

**With Circuit Breaker:**
```
Client → Circuit Open → Immediate Fallback → System Stable
```

### **2. Graceful Degradation** 📉
- **Provide fallback responses** instead of errors
- **Maintain core functionality** when non-critical services fail
- **Better user experience** with helpful messages

### **3. System Recovery Time** ⏰
- Gives **failing services time to recover**
- Prevents **continuous hammering** of unhealthy services
- Allows **automatic retry** after recovery

### **4. Performance Optimization** ⚡
- **Fail fast** instead of waiting for timeouts
- **Reduce resource consumption** on client and server
- **Better resource utilization**

## 🛠 **Real-World Scenarios**

### **Scenario 1: Payment Service Failure**
```javascript
// Without Circuit Breaker
user.checkout() 
  → Payment API (30s timeout) 
  → User waits 30s 
  → "Payment failed"
  → Poor experience

// With Circuit Breaker  
user.checkout()
  → Circuit OPEN (immediate)
  → "Payments temporarily unavailable, try later"
  → Good experience, fast response
```

### **Scenario 2: Inventory Service Slow Response**
```javascript
// Circuit Breaker in Action
if (circuitState === 'OPEN') {
  return { 
    status: 'service_unavailable',
    message: 'Inventory checking delayed',
    fallback: true
  };
}
```

## 📊 **When to Use Circuit Breaker**

### **Use Cases:**
✅ **External API calls** (payment gateways, weather services)  
✅ **Microservices communication**  
✅ **Database connections** under heavy load  
✅ **Any network-dependent operation**  
✅ **Services with known instability**

### **Don't Use For:**
❌ **Local operations** (in-memory calculations)  
❌ **Critical core functionality** (user authentication might need different pattern)  
❌ **Operations that must always complete**

## 🔧 **Apigee Implementation Example**

```xml
<!-- Circuit Breaker Check -->
<Javascript name="Circuit-Breaker-Check">
  <ResourceURL>jsc://circuit-breaker.js</ResourceURL>
</Javascript>

<!-- Backend Call (only if circuit closed) -->
<ServiceCallout name="Backend-Service">
  <Condition>circuit.breaker.allowed == true</Condition>
</ServiceCallout>

<!-- Fallback Response -->
<RaiseFault name="Circuit-Open-Fallback">
  <Condition>circuit.breaker.allowed == false</Condition>
  <FaultResponse>
    <Set>
      <Payload contentType="application/json">
        {
          "error": "service_unavailable",
          "message": "Service is temporarily unavailable",
          "circuit_state": "OPEN",
          "retry_after": "300"
        }
      </Payload>
      <StatusCode>503</StatusCode>
    </Set>
  </FaultResponse>
</RaiseFault>
```

## ⚙️ **Configuration Parameters**

```javascript
const circuitConfig = {
    failureThreshold: 5,     // 5 failures → open circuit
    successThreshold: 3,     // 3 successes → close circuit  
    timeout: 30000,          // 30s in OPEN state
    resetTimeout: 60000      // 1 minute to reset failures
};
```

## 🎯 **Benefits in API Gateway Context**

### **For API Consumers:**
- **Faster response times** (fail fast vs waiting for timeout)
- **Better error messages** (clear service status)
- **Predictable behavior**

### **For Backend Services:**
- **Breathing room to recover** from failures
- **Protected from traffic spikes** during instability
- **Reduced load** during outages

### **For Business:**
- **Improved system reliability**
- **Better customer experience**
- **Reduced operational overhead**

## 📈 **Monitoring and Metrics**

```javascript
// Circuit metrics to monitor
const metrics = {
    stateChanges: 5,           // How often circuit trips
    failureRate: '15%',        // Overall failure rate
    avgTimeOpen: '45s',        // Average downtime
    requestsBlocked: 1250,     // How many requests saved
    successfulRecoveries: 3    // How many auto-recoveries
};
```

## 💡 **Interview Talking Points**

**When asked about Circuit Breaker:**
- "It's a resilience pattern that prevents cascading failures"
- "I've implemented it in Apigee using JavaScript policies and caching"
- "It helps maintain system stability when dependencies fail"
- "We configure it based on service criticality and failure characteristics"
- "It's part of our comprehensive fault tolerance strategy"

## 🚀 **Key Takeaway**

**Circuit Breaker is not just about failing fast - it's about failing smart and giving your system the resilience to handle real-world distributed system challenges.**

It's an essential pattern in microservices architecture and API management that separates robust systems from fragile ones!