difference between tls and mutual ts in apigee. explain in very brief**TLS (One-Way TLS):**
- Only the client verifies the server's certificate
- Server identity is authenticated, client is not
- Standard HTTPS for secure communication

**Mutual TLS (mTLS):**
- Both client AND server verify each other's certificates
- Mutual authentication - both parties prove their identity
- Stronger security, commonly used for B2B/API integrations

**In Apigee:**
- TLS: Used for Apigee endpoints (standard API security)
- mTLS: Configured for additional client authentication using client certificates