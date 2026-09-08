# Truststore & Keystore in Apigee Edge

## **1. Keystore**
- Stores **private keys and certificates** for Apigee
- Used when Apigee acts as **client** to backend

```xml
<SSLInfo>
  <Enabled>true</Enabled>
  <KeyStore>ref://my-keystore</KeyStore>
  <KeyAlias>client-cert</KeyAlias>
</SSLInfo>
```

## **2. Truststore**
- Stores **CA certificates** to verify backend servers
- Used to **validate backend certificates**

```xml
<SSLInfo>
  <Enabled>true</Enabled>
  <TrustStore>ref://my-truststore</TrustStore>
  <IgnoreValidationErrors>false</IgnoreValidationErrors>
</SSLInfo>
```

## **3. Complete mTLS Setup**
```xml
<SSLInfo>
  <Enabled>true</Enabled>
  <ClientAuthEnabled>true</ClientAuthEnabled>
  <KeyStore>ref://client-keystore</KeyStore>
  <KeyAlias>client-key</KeyAlias>
  <TrustStore>ref://server-truststore</TrustStore>
</SSLInfo>
```

## **4. Configuration**
- **Upload certificates** via Admin UI/API
- **Reference in TargetEndpoint**
- Supports **JKS and PKCS12** formats

**Keystore = Your identity**  
**Truststore = Who you trust**