// circuitBreaker.js
var circuitId = 'service-alpha';
var failureThreshold = 5;
var cooldownPeriod = 30000;

var cache = context.getVariable('cache.circuit-breaker-cache');
var currentStateKey = 'circuit_' + circuitId + '_state';
var failureCountKey = 'circuit_' + circuitId + '_failures';

function checkCircuitState() {
    var state = cache.get(currentStateKey);
    context.setVariable('circuit.state', state === 'OPEN' ? 'OPEN' : 'CLOSED');
}

function trackFailureAndTrip() {
    var currentFailures = parseInt(cache.get(failureCountKey) || '0');
    currentFailures++;
    cache.put(failureCountKey, currentFailures.toString());
    
    if (currentFailures >= failureThreshold) {
        cache.put(currentStateKey, 'OPEN', cooldownPeriod / 1000);
        context.setVariable('circuit.state', 'OPEN');
    }
}

var executionFlow = context.getVariable('proxy.flow.name');
if (executionFlow === 'PreFlow') {
    checkCircuitState();
} else if (executionFlow === 'PostFlow') {
    var isTargetSuccess = context.getVariable('message.reason.phrase') === 'OK';
    if (!isTargetSuccess) {
        trackFailureAndTrip();
    }
}