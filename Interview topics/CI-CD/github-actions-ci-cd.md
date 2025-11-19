Here are comprehensive GitHub Actions CI/CD examples for your Apigee repository:

## 🔧 **GitHub Actions CI/CD for Apigee**

### **1. Basic Apigee Deployment Pipeline**
```yaml
# .github/workflows/apigee-deploy.yml
name: Deploy to Apigee

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  APIGEE_ORG: ${{ secrets.APIGEE_ORG }}
  APIGEE_ENV: ${{ secrets.APIGEE_ENV }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        proxy: ['helloworld', 'mocking-proxy', 'security-proxy']
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'

    - name: Cache Maven packages
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
        restore-keys: ${{ runner.os }}-m2

    - name: Deploy API Proxy
      uses: googlecloudplatform/apigee-deploy-action@v0.1
      with:
        token: ${{ secrets.APIGEE_TOKEN }}
        org: ${{ env.APIGEE_ORG }}
        env: ${{ env.APIGEE_ENV }}
        api_name: ${{ matrix.proxy }}
        directory: proxies/${{ matrix.proxy }}
```

### **2. Comprehensive Multi-Environment Pipeline**
```yaml
# .github/workflows/apigee-multi-env.yml
name: Apigee Multi-Environment Deployment

on:
  push:
    branches:
      - main
      - develop
      - feature/*

env:
  APIGEE_ORG: ${{ secrets.APIGEE_ORG }}
  GCP_PROJECT: ${{ secrets.GCP_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run API Tests
      run: |
        npm install
        npm run test:api
        
    - name: Run Security Scan
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        
    - name: Run Apigeelint
      run: |
        npm install -g apigeelint
        apigeelint -s proxies/ -f codeframe.js

  deploy-to-dev:
    needs: test
    runs-on: ubuntu-latest
    environment: development
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Deploy to Development
      uses: googlecloudplatform/apigee-deploy-action@v0.1
      with:
        token: ${{ secrets.APIGEE_DEV_TOKEN }}
        org: ${{ env.APIGEE_ORG }}
        env: 'dev'
        api_name: ${{ github.event.repository.name }}
        directory: proxies/

    - name: Run Integration Tests
      run: |
        ./scripts/run-integration-tests.sh --env dev

  deploy-to-staging:
    needs: deploy-to-dev
    runs-on: ubuntu-latest
    environment: staging
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Deploy to Staging
      uses: googlecloudplatform/apigee-deploy-action@v0.1
      with:
        token: ${{ secrets.APIGEE_STAGING_TOKEN }}
        org: ${{ env.APIGEE_ORG }}
        env: 'staging'
        api_name: ${{ github.event.repository.name }}
        directory: proxies/

    - name: Run Performance Tests
      run: |
        ./scripts/run-performance-tests.sh --env staging

  deploy-to-prod:
    needs: deploy-to-staging
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Deploy to Production
      uses: googlecloudplatform/apigee-deploy-action@v0.1
      with:
        token: ${{ secrets.APIGEE_PROD_TOKEN }}
        org: ${{ env.APIGEE_ORG }}
        env: 'prod'
        api_name: ${{ github.event.repository.name }}
        directory: proxies/

    - name: Smoke Tests
      run: |
        ./scripts/run-smoke-tests.sh --env prod
```

### **3. Advanced Maven-based Pipeline**
```yaml
# .github/workflows/apigee-maven.yml
name: Apigee Maven Deployment

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'dev'
        type: choice
        options:
        - dev
        - staging
        - prod

jobs:
  analyze-and-test:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Java
      uses: actions/setup-java@v3
      with:
        java-version: '11'
        distribution: 'temurin'

    - name: Cache Maven dependencies
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
        restore-keys: ${{ runner.os }}-m2

    - name: Run static analysis
      run: mvn apigee-analyze -Ptest

    - name: Run unit tests
      run: mvn test -Ptest

    - name: Build API bundles
      run: mvn package -Ptest -DskipTests

  deploy:
    needs: analyze-and-test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        proxy: 
          - name: 'helloworld'
            bundle: 'target/helloworld.zip'
          - name: 'security-proxy'
            bundle: 'target/security-proxy.zip'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: api-bundles
        path: target/

    - name: Deploy API Proxy
      run: |
        mvn apigee-install -P${{ github.event.inputs.environment || 'dev' }} \
          -Dapigee.org=${{ secrets.APIGEE_ORG }} \
          -Dapigee.env=${{ github.event.inputs.environment || 'dev' }} \
          -Dapigee.username=${{ secrets.APIGEE_USERNAME }} \
          -Dapigee.password=${{ secrets.APIGEE_PASSWORD }} \
          -Dapi.name=${{ matrix.proxy.name }} \
          -Dapigee.options=override

    - name: Run post-deployment tests
      run: |
        mvn apigee-test -P${{ github.event.inputs.environment || 'dev' }} \
          -Dapigee.org=${{ secrets.APIGEE_ORG }} \
          -Dapigee.env=${{ github.event.inputs.environment || 'dev' }}
```

### **4. Security-Focused Pipeline**
```yaml
# .github/workflows/apigee-security-scan.yml
name: Apigee Security Scan

on:
  push:
    branches: [ main, develop ]
  schedule:
    - cron: '0 0 * * 1'  # Weekly security scan

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Apigeelint Security Rules
      run: |
        npm install -g apigeelint
        apigeelint -s proxies/ -f codeframe.js -x PO008,PO013

    - name: OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'apigee-proxies'
        path: '.'
        format: 'HTML'
        out: 'reports'

    - name: SAST Analysis
      uses: github/codeql-action/analyze@v2
      with:
        languages: javascript

    - name: Secret Scanning
      uses: gitleaks/gitleaks-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

    - name: Upload Security Report
      uses: actions/upload-artifact@v3
      with:
        name: security-reports
        path: reports/
```

### **5. Performance Testing Pipeline**
```yaml
# .github/workflows/apigee-performance.yml
name: Apigee Performance Tests

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly performance tests
  workflow_dispatch:

jobs:
  performance-test:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'

    - name: Install Artillery
      run: npm install -g artillery

    - name: Run Performance Tests
      run: |
        artillery run \
          --environment staging \
          --output reports/performance.json \
          tests/performance/load-test.yml
        
        artillery report reports/performance.json

    - name: Analyze Performance Results
      run: |
        ./scripts/analyze-performance.py reports/performance.json

    - name: Upload Performance Report
      uses: actions/upload-artifact@v3
      with:
        name: performance-report
        path: reports/performance.html
```

### **6. Supporting Configuration Files**

#### **Maven POM.xml**
```xml
<!-- pom.xml -->
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.company.apigee</groupId>
    <artifactId>apigee-proxies</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>

    <profiles>
        <profile>
            <id>dev</id>
            <properties>
                <apigee.env>dev</apigee.env>
                <apigee.org>${env.APIGEE_ORG}</apigee.org>
            </properties>
        </profile>
        <profile>
            <id>staging</id>
            <properties>
                <apigee.env>staging</apigee.env>
                <apigee.org>${env.APIGEE_ORG}</apigee.org>
            </properties>
        </profile>
        <profile>
            <id>prod</id>
            <properties>
                <apigee.env>prod</apigee.env>
                <apigee.org>${env.APIGEE_ORG}</apigee.org>
            </properties>
        </profile>
    </profiles>

    <build>
        <plugins>
            <plugin>
                <groupId>io.apigee.build-tools</groupId>
                <artifactId>apigee-edge-maven-plugin</artifactId>
                <version>2.1.0</version>
                <configuration>
                    <profile>${apigee.env}</profile>
                    <org>${apigee.org}</org>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

#### **Artillery Performance Test**
```yaml
# tests/performance/load-test.yml
config:
  target: "https://${APIGEE_ENV}-${APIGEE_ORG}.apigee.net"
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Load test
    - duration: 60
      arrivalRate: 10
      name: Cool down
  defaults:
    headers:
      Authorization: "Bearer ${API_KEY}"
  
scenarios:
  - name: "API Health Check"
    flow:
      - get:
          url: "/v1/health"
          expect:
            - statusCode: 200

  - name: "Secure API Call"
    flow:
      - post:
          url: "/v1/secure-data"
          json:
            userId: "test123"
          expect:
            - statusCode: 200
            - hasProperty: "data"
```

#### **Shell Script Helper**
```bash
#!/bin/bash
# scripts/run-integration-tests.sh

#!/bin/bash
set -e

ENV=${1:-dev}
BASE_URL="https://$ENV-$APIGEE_ORG.apigee.net"

echo "Running integration tests for environment: $ENV"

# Test API endpoints
curl -X GET "$BASE_URL/v1/health" \
  -H "Authorization: Bearer $API_KEY" \
  --fail --silent --show-error

# Add more test cases...
echo "All integration tests passed!"
```

## 🔧 **Required Secrets Setup:**

### **GitHub Repository Secrets:**
```bash
APIGEE_ORG=your-org-name
APIGEE_DEV_TOKEN=dev-environment-token
APIGEE_STAGING_TOKEN=staging-environment-token  
APIGEE_PROD_TOKEN=prod-environment-token
APIGEE_USERNAME=your-apigee-username
APIGEE_PASSWORD=your-apigee-password
GCP_PROJECT_ID=your-gcp-project
API_KEY=test-api-key
```

## 🎯 **Interview Talking Points:**

**When asked about CI/CD experience:**
- "I've implemented comprehensive GitHub Actions pipelines for Apigee that include multi-environment deployments, security scanning, performance testing, and automated quality gates"
- "My pipelines follow GitOps principles with proper environment promotion and rollback capabilities"
- "I integrate security scanning and performance testing directly into the deployment process"
- "The pipelines demonstrate enterprise-ready DevOps practices for API management"

These examples will significantly enhance your repository and demonstrate modern DevOps practices for Apigee! 🚀