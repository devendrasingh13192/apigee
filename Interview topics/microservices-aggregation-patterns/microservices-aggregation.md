# Microservices Aggregation Architecture

## Flow Description:
1. Client → API Gateway (Apigee)
2. Apigee validates auth (JWT/OAuth)
3. Parallel service calls to:
   - User Service
   - Order Service  
   - Inventory Service
4. Response aggregation
5. Unified response to client

## Apigee Policies Used:
- VerifyJWT (Security)
- ServiceCallout (x3 for microservices)
- JavaScript for data aggregation
- AssignMessage for response formatting