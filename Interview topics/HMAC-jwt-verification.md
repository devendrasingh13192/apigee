To verify an HMAC-SHA256 (`HS256`) signed JWT using a shared secret from an Apigee Encrypted Key-Value Map (KVM), you need a two-step policy pattern:

1. Retrieve the shared secret from the encrypted KVM into a variable marked with the **`private.`** prefix (which prevents the secret from appearing in Apigee Trace/Debug sessions).
2. Pass that `private.` variable into the `<SecretKey>` element of the `VerifyJWT` policy.

---

### Step 1: Read the Secret from Encrypted KVM (`KVM-GetSharedSecret.xml`)

This policy fetches the secret from an environment-scoped encrypted KVM named `SecuritySecrets` using the key `jwt_hs256_key`.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<KeyValueMapOperations name="KVM-GetSharedSecret" mapIdentifier="SecuritySecrets">
    <ExclusiveCache>false</ExclusiveCache>
    <ExpiryTimeInSecs>300</ExpiryTimeInSecs>
    <Get assignTo="private.jwt_secret">
        <Key>
            <Parameter>jwt_hs256_key</Parameter>
        </Key>
    </Get>
    <Scope>environment</Scope>
</KeyValueMapOperations>

```

> **Security Note:** The `assignTo` attribute **must** use the prefix `private.`. Apigee masks variables starting with `private.` so the shared secret is never exposed in plain text in the runtime trace viewer.

---

### Step 2: Verify the JWT with HS256 (`JWT-Verify-HS256.xml`)

This policy verifies the signature using the retrieved secret, strips the `Bearer ` prefix from the incoming `Authorization` header, and checks registered claims like `Issuer` and `Audience`.

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<VerifyJWT name="JWT-Verify-HS256">
    <Algorithm>HS256</Algorithm>
    <Source>request.header.authorization</Source>
    <StripPrefix>Bearer </StripPrefix>
    
    <!-- Reference the private variable containing the shared secret -->
    <SecretKey>
        <Value ref="private.jwt_secret"/>
    </SecretKey>
    
    <!-- Standard claim assertions -->
    <Issuer>https://auth.example.com</Issuer>
    <Audience ref="apiproduct.client_id"/>
    
    <AdditionalClaims>
        <Claim name="role">payment-admin</Claim>
    </AdditionalClaims>
</VerifyJWT>

```

*Note on Key Encodings:* If your shared secret is base64-encoded or hex-encoded inside the KVM, add the `encoding` attribute to `<Value>` (e.g., `<Value encoding="base64" ref="private.jwt_secret"/>` or `encoding="hex"`). If it is a plain UTF-8 string, omit the `encoding` attribute.

---

### Step 3: Wire Policies into the Proxy Flow (`proxies/default.xml`)

Attach both policies in sequence inside the `<PreFlow>` or target conditional flow:

```xml
<ProxyEndpoint name="default">
    <PreFlow name="PreFlow">
        <Request>
            <!-- Step 1: Read the secret into private.jwt_secret -->
            <Step>
                <Name>KVM-GetSharedSecret</Name>
            </Step>
            <!-- Step 2: Verify signature using private.jwt_secret -->
            <Step>
                <Name>JWT-Verify-HS256</Name>
            </Step>
        </Request>
        <Response/>
    </PreFlow>

    <!-- Handle verification failures cleanly -->
    <FaultRules>
        <FaultRule name="InvalidJWTSignature">
            <Condition>fault.name = "InvalidToken" or fault.name = "ExecutionFailed"</Condition>
            <Step>
                <Name>AM-Set-401-Response</Name>
            </Step>
        </FaultRule>
    </FaultRules>

    <RouteRule name="default">
        <TargetEndpoint>default</TargetEndpoint>
    </RouteRule>
</ProxyEndpoint>

```

---

### Key Production Nuances for HS256

* **Minimum Key Length:** In compliance with RFC 7518, an `HS256` secret must be **at least 32 bytes (256 bits)** long. A short or trivial secret will fail verification or leave the token open to brute-force attacks.
* **Secret Distribution Risk:** Unlike RS256 where Apigee only needs the public key, HS256 requires Apigee to store the exact same symmetric signing key that the token issuer uses. For federated multi-party auth (e.g., Okta or external client apps), **RS256 with JWKS** is strongly preferred over HS256. Use HS256 primarily for internal microservice-to-gateway service accounts or internal HMAC session tokens.