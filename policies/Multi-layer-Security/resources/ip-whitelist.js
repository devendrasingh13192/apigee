var clientIP = context.getVariable("client.ip");
var whitelistedIPs = ["192.168.1.0/24", "10.0.0.0/8", "172.16.0.0/12"];

function isIPInRange(ip, range) {
    // Simple IP range validation logic
    return whitelistedIPs.some(function(whitelistIP) {
        return ip.startsWith(whitelistIP.substring(0, whitelistIP.lastIndexOf('.')));
    });
}

if (!isIPInRange(clientIP, whitelistedIPs)) {
    context.setVariable("ip.whitelist.status", "blocked");
    context.setVariable("error.message", "IP address not whitelisted");
    throw new Error("IP not whitelisted");
} else {
    context.setVariable("ip.whitelist.status", "allowed");
}