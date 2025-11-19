# Apigee Caching Strategies

## Multi-Level Caching:
1. **Response Cache** (PopulateCache/LookupCache)
   - API responses
   - TTL: 5-30 minutes
   - Key: request URI + headers

2. **Token Cache** (OAuth/JWT)
   - Validated tokens
   - TTL: token expiry
   - Key: token signature

3. **KVM Cache** (Configuration)
   - Environment settings
   - TTL: 1 hour
   - Key: config name + environment

## Cache Invalidation Strategies:
- Time-based (TTL)
- Manual purge API
- Conditional based on data changes