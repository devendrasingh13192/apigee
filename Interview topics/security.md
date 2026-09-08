## ADVANCED SECURITY Q&A

Q: What's the difference between OAuth 2.0 grant types and when would you use each?
A: 
- Client Credentials: Server-to-server, no user context (microservices)
- Authorization Code: Web apps with user authentication  
- Resource Owner Password: Legacy migration (not recommended)
- Implicit: Mobile/SPA (deprecated in favor of PKCE)

Q: How do you secure APIs in Apigee beyond basic API keys?
A: Multi-layered approach:
1. OAuth 2.0 with short-lived tokens
2. JWT for stateless authentication
3. IP whitelisting + rate limiting
4. Threat protection policies
5. Custom attributes in access tokens