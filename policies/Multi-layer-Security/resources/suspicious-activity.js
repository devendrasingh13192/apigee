var requestPath = context.getVariable("request.path");
var clientIP = context.getVariable("client.ip");
var userAgent = context.getVariable("request.header.User-Agent");
var failedAttempts = parseInt(context.getVariable("ratelimit.failed_attempts." + clientIP) || "0");

// Check for suspicious patterns
function isSuspicious() {
    // Too many failed attempts
    if (failedAttempts > 5) {
        return true;
    }
    
    // Suspicious user agents
    var suspiciousAgents = ["sqlmap", "nikto", "metasploit"];
    if (suspiciousAgents.some(function(agent) {
        return userAgent.toLowerCase().includes(agent);
    })) {
        return true;
    }
    
    // Path traversal attempts
    if (requestPath.includes("..") || requestPath.includes("/etc/passwd")) {
        return true;
    }
    
    return false;
}

if (isSuspicious()) {
    context.setVariable("suspicious.activity", "true");
    // Increment failed attempts counter
    context.setVariable("ratelimit.failed_attempts." + clientIP, (failedAttempts + 1).toString());
}