// custom-auth.js
var token = context.getVariable("request.header.authorization");
var apiKey = context.getVariable("request.header.x-api-key");

if (!token && !apiKey) {
    context.setVariable("auth.error", "Missing authentication");
    context.setVariable("auth.status", "failed");
    return;
}

// Custom authentication logic
if (token && token.startsWith("Bearer ")) {
    var jwtToken = token.substring(7);
    // Validate custom token format
    if (isValidCustomToken(jwtToken)) {
        context.setVariable("auth.status", "success");
        context.setVariable("client.id", extractClientId(jwtToken));
    } else {
        context.setVariable("auth.error", "Invalid token");
        context.setVariable("auth.status", "failed");
    }
}

function isValidCustomToken(token) {
    // Custom validation logic
    return token && token.length > 10;
}

function extractClientId(token) {
    // Extract client ID from custom token format
    return token.split('.')[0];
}