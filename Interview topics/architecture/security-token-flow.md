# Security Token Flow Architecture

## OAuth 2.0 Authorization Code Flow:
1. User → Apigee → Authorization Server
2. Authorization Server → User (Auth Code)
3. User → Apigee (Auth Code + Client Credentials)
4. Apigee → Authorization Server (Exchange Code for Token)
5. Apigee → User (Access Token + Refresh Token)

## JWT Validation Flow:
1. Client → Apigee (JWT in Header)
2. Apigee validates:
   - Signature (RS256)
   - Expiration
   - Issuer
   - Audience
   - Custom claims
3. Conditional routing based on JWT claims