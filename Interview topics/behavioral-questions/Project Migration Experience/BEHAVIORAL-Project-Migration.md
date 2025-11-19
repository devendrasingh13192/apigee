```markdown
# Behavioral Story: High-Stakes Legacy Migration

## 🎯 **Situation: Critical System Modernization**
**Context:** Manufacturing company running core operations on 15-year-old ESB system with expiring vendor support and increasing failure rates.

**Migration Challenges:**
- Business-critical order management system
- 200+ integration points with other systems
- No existing documentation or test coverage
- Zero-downtime requirement
- $500K/day business impact if system failed

## 📋 **Task:**
Lead migration from legacy ESB to Apigee-based microservices architecture with:
- No business disruption
- Improved performance and reliability
- Future-proof architecture
- Team skill transformation

## 🛠 **Action: Structured Migration Approach**

### **Phase 1: Discovery & Assessment**
**API Inventory:**
- Reverse-engineered 150+ undocumented endpoints
- Mapped data flows and dependencies
- Identified business criticality of each API

**Risk Assessment:**
```yaml
high_risk:
  - order_processing: $200K/hour impact
  - inventory_management: $100K/hour impact
medium_risk:
  - customer_data: brand impact
low_risk:
  - reporting_apis: delayed impact
```

### **Phase 2: Strangler Pattern Implementation**
**Incremental Migration Strategy:**
```xml
<!-- Traffic routing based on migration phase -->
<RouteRule name="Legacy-Route">
    <Condition>migration.phase != "complete"</Condition>
    <TargetEndpoint>legacy-system</TargetEndpoint>
</RouteRule>

<RouteRule name="New-Route">
    <Condition>migration.phase == "complete"</Condition>
    <TargetEndpoint>new-microservice</TargetEndpoint>
</RouteRule>
```

**Canary Deployment:**
```javascript
// Gradual traffic shifting
function calculateRouting() {
    var migrationProgress = getMigrationProgress();
    var random = Math.random() * 100;
    
    if (random < migrationProgress) {
        return 'new-system';
    } else {
        return 'legacy-system';
    }
}
```

### **Phase 3: Parallel Run & Validation**
**Data Consistency Checks:**
```javascript
// Real-time comparison between old and new
function validateMigration() {
    var legacyResponse = callLegacySystem();
    var newResponse = callNewSystem();
    
    return {
        dataMatch: compareResponses(legacyResponse, newResponse),
        performanceDiff: comparePerformance(legacyResponse, newResponse),
        functionalEquivalence: validateBusinessLogic(legacyResponse, newResponse)
    };
}
```

## 🔧 **Technical Implementation**

### **Modernization Patterns:**
```xml
<!-- Legacy SOAP to REST transformation -->
<XSL name="SOAP-to-REST-Transform">
    <Source>request</Source>
    <ResourceURL>xsl/soap-to-rest.xsl</ResourceURL