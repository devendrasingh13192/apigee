Here are the end-to-end XML flow configurations and policies for **SAML-to-OAuth Exchange (RFC 7522)**, **OIDC Token Verification**, and **VerifyJWT Flow** in Apigee.

---

### 1. SAML-to-OAuth 2.0 Flow (RFC 7522 Exchange)

This flow accepts an incoming base64-encoded XML SAML Assertion, validates it, and issues a standard OAuth 2.0 access token (or JWT).

#### Step A: ProxyEndpoint Flow (`proxies/default.xml`)

```xml
<Flow name="Exchange-SAML-For-OAuth">
    <Description>RFC 7522: SAML 2.0 Bearer Assertion Profile for OAuth 2.0</Description>
    <Condition>(proxy.pathsuffix MatchesPath "/oauth/token") and (request.verb = "POST") and (request.formparam.grant_type = "urn:ietf:params:oauth:grant-type:saml2-bearer")</Condition>
    <Request>
        <!-- 1. Extract base64 SAML assertion from form-urlencoded body -->
        <Step>
            <Name>EV-ExtractSAMLAssertion</Name>
        </Step>
        <!-- 2. Validate SAML Assertion signature, expiration, and issuer -->
        <Step>
            <Name>SAML-ValidateAssertion</Name>
        </Step>
        <!-- 3. Issue OAuth Access Token -->
        <Step>
            <Name>OAuthV2-GenerateAccessToken</Name>
        </Step>
    </Request>
    <Response/>
</Flow>

```

#### Step B: Accompanying Policies

**`EV-ExtractSAMLAssertion.xml`**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ExtractVariables name="EV-ExtractSAMLAssertion">
    <FormParam name="assertion">
        <Pattern>{saml_raw_assertion}</Pattern>
    </FormParam>
    <IgnoreUnresolvedVariables>false</IgnoreUnresolvedVariables>
</ExtractVariables>

```

**`SAML-ValidateAssertion.xml`**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<SAML name="SAML-ValidateAssertion">
    <Validate>
        <Source>saml_raw_assertion</Source>
        <TrustStore>ref://CorpIdP-TrustStore</TrustStore>
        <!-- Variables extracted from SAML assertion for subsequent policies -->
        <OutputVariable>
            <Subject ref="saml.subject"/>
            <Issuer ref="saml.issuer"/>
        </OutputVariable>
    </Validate>
</SAML>

```

**`OAuthV2-GenerateAccessToken.xml`**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<OAuthV2 name="OAuthV2-GenerateAccessToken">
    <Operation>GenerateAccessToken</Operation>
    <ExpiresIn>3600000</ExpiresIn> <!-- 1 Hour -->
    <SupportedGrantTypes>
        <GrantType>urn:ietf:params:oauth:grant-type:saml2-bearer</GrantType>
    </SupportedGrantTypes>
    <GrantType>request.formparam.grant_type</GrantType>
    <Attributes>
        <Attribute name="identity_provider" ref="saml.issuer"/>
        <Attribute name="enduser_subject" ref="saml.subject"/>
    </Attributes>
    <GenerateResponse enabled="true"/>
</OAuthV2>

```

---

### 2. OIDC Token Flow (Relying Party / Verification)

In an OpenID Connect flow, a client presents an ID token (or OIDC access token). Apigee fetches the Identity Provider's public keys dynamically via **JWKS** to verify the signature, asserts claims, and injects clean user metadata headers southbound.

#### Step A: ProxyEndpoint Flow (`proxies/default.xml`)

```xml
<Flow name="Secured-OIDC-Resource">
    <Description>Validates inbound OIDC Bearer Token</Description>
    <Condition>(request.header.Authorization ~~ "Bearer .+")</Condition>
    <Request>
        <!-- 1. Verify OIDC JWT Signature, Expiry, Issuer, and Audience -->
        <Step>
            <Name>JWT-Verify-OIDC</Name>
        </Step>
        <!-- 2. Strip sensitive Bearer token and pass safe user identity headers to backend -->
        <Step>
            <Name>AM-SetSouthboundIdentityHeaders</Name>
        </Step>
    </Request>
    <Response/>
</Flow>

```

#### Step B: Accompanying Policies

**`JWT-Verify-OIDC.xml`**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<VerifyJWT name="JWT-Verify-OIDC">
    <Algorithm>RS256</Algorithm>
    <Source>request.header.authorization</Source>
    <StripPrefix>Bearer </StripPrefix>
    
    <!-- Dynamically fetches and auto-caches IdP public keys -->
    <PublicKey>
        <JWKS uri="https://idp.example.com/.well-known/jwks.json"/>
    </PublicKey>
    
    <Issuer>https://idp.example.com</Issuer>
    <Audience ref="apiproduct.client_id"/>
    
    <AdditionalClaims>
        <Claim name="email_verified" type="boolean">true</Claim>
    </AdditionalClaims>
</VerifyJWT>

```

**`AM-SetSouthboundIdentityHeaders.xml`**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<AssignMessage name="AM-SetSouthboundIdentityHeaders">
    <Set>
        <Headers>
            <Header name="X-User-ID">{jwt.JWT-Verify-OIDC.claim.sub}</Header>
            <Header name="X-User-Email">{jwt.JWT-Verify-OIDC.claim.email}</Header>
            <Header name="X-User-Roles">{jwt.JWT-Verify-OIDC.claim.roles}</Header>
        </Headers>
    </Set>
    <Remove>
        <Headers>
            <!-- Do not expose IdP bearer token downstream if not required -->
            <Header name="Authorization"/>
        </Headers>
    </Remove>
    <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
</AssignMessage>

```

---

### 3. Dedicated `VerifyJWT` Flow (With Role-Based Access & Target Routing)

This shows a production-grade `VerifyJWT` flow that verifies an inbound signed token, evaluates custom scopes/roles, and triggers a fault rule if unauthorized.

#### Step A: ProxyEndpoint Flow (`proxies/default.xml`)

```xml
<ProxyEndpoint name="default">
    <PreFlow name="PreFlow">
        <Request>
            <!-- 1. Verify incoming JWT early in PreFlow -->
            <Step>
                <Name>JWT-Verify-ServiceToken</Name>
            </Step>
            <!-- 2. Enforce Role-Based Access Control (RBAC) -->
            <Step>
                <Name>RF-AccessDenied</Name>
                <Condition>not (jwt.JWT-Verify-ServiceToken.claim.roles ~~ ".*(admin|write).*")</Condition>
            </Step>
        </Request>
        <Response/>
    </PreFlow>

    <!-- Specific Fault Rule for JWT Failures -->
    <FaultRules>
        <FaultRule name="InvalidJWT">
            <Condition>fault.name = "FailedToResolveToken" or fault.name = "InvalidToken" or fault.name = "TokenExpired"</Condition>
            <Step>
                <Name>AM-InvalidJWTResponse</Name>
            </Step>
        </FaultRule>
    </FaultRules>

    <RouteRule name="default">
        <TargetEndpoint>default</TargetEndpoint>
    </RouteRule>
</ProxyEndpoint>

```

#### Step B: Accompanying Policies

**`JWT-Verify-ServiceToken.xml`**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<VerifyJWT name="JWT-Verify-ServiceToken">
    <Algorithm>RS256</Algorithm>
    <Source>request.header.authorization</Source>
    <StripPrefix>Bearer </StripPrefix>
    <PublicKey>
        <JWKS uri="https://auth.company.internal/certs/jwks.json"/>
    </PublicKey>
    <Issuer>https://auth.company.internal</Issuer>
    <Audience>urn:api:payments</Audience>
</VerifyJWT>

```

**`RF-AccessDenied.xml`**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<RaiseFault name="RF-AccessDenied">
    <FaultResponse>
        <Set>
            <Payload contentType="application/json">
                {
                    "error": "Forbidden",
                    "message": "User does not have required administrative scopes."
                }
            </Payload>
            <StatusCode>403</StatusCode>
            <ReasonPhrase>Forbidden</ReasonPhrase>
        </Set>
    </FaultResponse>
    <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
</RaiseFault>

```

**`AM-InvalidJWTResponse.xml`**

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<AssignMessage name="AM-InvalidJWTResponse">
    <Set>
        <Payload contentType="application/json">
            {
                "error": "Unauthorized",
                "message": "Invalid, expired, or malformed JWT token."
            }
        </Payload>
        <StatusCode>401</StatusCode>
        <ReasonPhrase>Unauthorized</ReasonPhrase>
        <Headers>
            <Header name="WWW-Authenticate">Bearer error="invalid_token"</Header>
        </Headers>
    </Set>
    <IgnoreUnresolvedVariables>true</IgnoreUnresolvedVariables>
</AssignMessage>

```