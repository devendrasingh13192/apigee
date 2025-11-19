// /policies/scripts/circuit-breaker.js
var targetService = context.getVariable('target.service.name');
var circuitBreakerState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
var failureCount = 0;
var successCount = 0;
var lastFailureTime = 0;

// Circuit Breaker Configuration
var config = {
    failureThreshold: 5,        // Number of failures before opening circuit
    successThreshold: 3,        // Number of successes before closing circuit
    timeout: 30000,             // 30 seconds in OPEN state before HALF_OPEN
    resetTimeout: 60000         // 60 seconds to reset failure count
};

// Initialize or retrieve circuit state from cache
function initializeCircuitState() {
    var cachedState = context.getVariable('circuitbreaker.' + targetService + '.state');
    var cachedFailures = context.getVariable('circuitbreaker.' + targetService + '.failureCount');
    var cachedLastFailure = context.getVariable('circuitbreaker.' + targetService + '.lastFailureTime');
    
    circuitBreakerState = cachedState || 'CLOSED';
    failureCount = parseInt(cachedFailures || '0');
    lastFailureTime = parseInt(cachedLastFailure || '0');
}

// Save circuit state to cache
function saveCircuitState() {
    context.setVariable('circuitbreaker.' + targetService + '.state', circuitBreakerState);
    context.setVariable('circuitbreaker.' + targetService + '.failureCount', failureCount.toString());
    context.setVariable('circuitbreaker.' + targetService + '.lastFailureTime', lastFailureTime.toString());
}

// Check if circuit should transition from OPEN to HALF_OPEN
function shouldTryHalfOpen() {
    if (circuitBreakerState === 'OPEN') {
        var currentTime = new Date().getTime();
        var timeSinceLastFailure = currentTime - lastFailureTime;
        return timeSinceLastFailure >= config.timeout;
    }
    return false;
}

// Record a successful request
function recordSuccess() {
    if (circuitBreakerState === 'HALF_OPEN') {
        successCount++;
        if (successCount >= config.successThreshold) {
            circuitBreakerState = 'CLOSED';
            failureCount = 0;
            successCount = 0;
            context.setVariable('circuit.breaker.message', 'Circuit closed - service recovered');
        }
    } else {
        // Reset failure count after successful requests in CLOSED state
        var currentTime = new Date().getTime();
        if (currentTime - lastFailureTime > config.resetTimeout) {
            failureCount = 0;
        }
    }
    saveCircuitState();
}

// Record a failed request
function recordFailure() {
    failureCount++;
    lastFailureTime = new Date().getTime();
    
    if (circuitBreakerState === 'CLOSED' && failureCount >= config.failureThreshold) {
        circuitBreakerState = 'OPEN';
        context.setVariable('circuit.breaker.message', 'Circuit opened - too many failures');
    } else if (circuitBreakerState === 'HALF_OPEN') {
        circuitBreakerState = 'OPEN';
        successCount = 0;
        context.setVariable('circuit.breaker.message', 'Circuit reopened - half-open test failed');
    }
    
    saveCircuitState();
}

// Check if request should be allowed
function allowRequest() {
    initializeCircuitState();
    
    if (circuitBreakerState === 'CLOSED') {
        return true;
    }
    
    if (circuitBreakerState === 'OPEN' && shouldTryHalfOpen()) {
        circuitBreakerState = 'HALF_OPEN';
        successCount = 0;
        context.setVariable('circuit.breaker.message', 'Circuit half-open - testing service recovery');
        saveCircuitState();
        return true;
    }
    
    if (circuitBreakerState === 'HALF_OPEN') {
        return true; // Allow limited traffic in half-open state
    }
    
    context.setVariable('circuit.breaker.message', 'Request blocked - circuit is open');
    return false;
}

// Get circuit status for monitoring
function getCircuitStatus() {
    initializeCircuitState();
    
    var status = {
        state: circuitBreakerState,
        failureCount: failureCount,
        successCount: successCount,
        lastFailureTime: lastFailureTime,
        targetService: targetService,
        message: context.getVariable('circuit.breaker.message') || 'Operational'
    };
    
    context.setVariable('circuit.breaker.status', JSON.stringify(status));
    return status;
}

// Main execution
try {
    var operation = context.getVariable('circuit.breaker.operation') || 'check';
    
    switch(operation) {
        case 'check':
            var allowed = allowRequest();
            context.setVariable('circuit.breaker.allowed', allowed);
            break;
            
        case 'success':
            recordSuccess();
            context.setVariable('circuit.breaker.allowed', true);
            break;
            
        case 'failure':
            recordFailure();
            context.setVariable('circuit.breaker.allowed', false);
            break;
            
        case 'status':
            var status = getCircuitStatus();
            context.setVariable('circuit.breaker.allowed', true);
            break;
            
        default:
            context.setVariable('circuit.breaker.allowed', true);
            break;
    }
    
} catch (error) {
    context.setVariable('circuit.breaker.error', error.toString());
    context.setVariable('circuit.breaker.allowed', true); // Fail open for safety
}