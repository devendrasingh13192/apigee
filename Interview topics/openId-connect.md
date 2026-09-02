**OpenID Connect (OIDC)** in Apigee is an identity authentication layer built directly on top of the **OAuth 2.0** framework. While OAuth 2.0 grants *authorization* (what resources an app can access via access tokens), OIDC provides *authentication* (verifying who the end-user is and obtaining profile metadata via an **ID Token**).

In Apigee, OIDC is typically implemented to secure APIs, verify federated user identities from external Identity Providers (IdPs), or act as an identity mediation bridge.

---

### Core Components of OIDC in Apigee

| Component | Role | Apigee Usage |
| --- | --- | --- |
| **ID Token (`id_token`)** | A signed JSON Web Token (JWT) representing user identity. | Apigee decodes, verifies cryptographic signatures, and checks claims (e.g., `iss`, `aud`, `exp`, `sub`). |
| **UserInfo Endpoint** | A protected OAuth resource returning claims about the authenticated user. | Queried via Apigee using `<ServiceCallout>` when additional user profile attributes are needed. |
| **Discovery / JWKS** | OpenID configuration metadata (`/.well-known/openid-configuration`) and public keys (`/jwks.json`). | Cached and referenced by Apigee policies to validate token signatures dynamically without hardcoded certificates. |

---

### Key Architectural Roles Apigee Plays with OIDC

Apigee operates in two primary roles regarding OpenID Connect:

#### 1. Relying Party / Verification Gateway (Most Common)

In this pattern, an external Identity Provider (such as **Google Cloud Identity, Okta, PingFederate, Azure AD, or Keycloak**) authenticates the user and issues an OIDC ID token.

* The client sends the ID token/Access token to Apigee in the `Authorization: Bearer <token>` header.
* Apigee intercepts the request and uses the **`VerifyJWT`** policy to:
* Validate the cryptographic signature using the IdP’s public **JWKS URI**.
* Validate the issuer (`iss`), audience (`aud`), and expiration time (`exp`).
* Extract custom identity claims (e.g., `email`, `roles`, `tenant_id`) into flow variables.


* Downstream microservices receive clean identity headers (e.g., `X-User-Subject: {jwt.Verify-JWT.claim.sub}`) without having to integrate with the IdP directly.

#### 2. Identity Broker / Token Exchange

Apigee can act as an intermediary between modern clients and legacy internal systems:

* The client passes an external OIDC token to Apigee.
* Apigee validates the OIDC identity, exchanges or maps it to an internal backend token (e.g., SAML 2.0, mutual TLS identity, or an internal OAuth token), and proxies the request securely.

---

### How OIDC is Implemented in Apigee Proxies

Apigee provides native policies to handle OIDC workflows without writing custom cryptographic code.

**1. Verifying an OIDC ID Token (`VerifyJWT` policy)**

```xml
<VerifyJWT name="JWT-Verify-OIDC-Token">
    <Algorithm>RS256</Algorithm>
    <Source>request.header.authorization</Source>
    <!-- IdP public key set dynamically fetched and cached by Apigee -->
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

**2. Generating an OIDC ID Token (`GenerateJWT` policy)**
When Apigee issues tokens directly (e.g., in advanced enterprise OAuth/OIDC setups):

```xml
<GenerateJWT name="JWT-Generate-IdToken">
    <Algorithm>RS256</Algorithm>
    <PrivateKey>
        <Value ref="private.rsa_key"/>
        <Id ref="private.key_id"/>
    </PrivateKey>
    <Issuer>https://api.yourdomain.com/oauth2/token</Issuer>
    <Audience ref="client_id"/>
    <Subject ref="enduser.username"/>
    <ExpiresIn>3600000</ExpiresIn> <!-- 1 hour -->
    <AdditionalClaims>
        <Claim name="email" ref="enduser.email"/>
        <Claim name="role" ref="enduser.role"/>
    </AdditionalClaims>
    <OutputVariable>id_token</OutputVariable>
</GenerateJWT>

```

---

### Why Use OIDC in Apigee?

* **Offload Crypto Overhead from Microservices:** Backends do not need to download JWKS keys, verify RSA/ECDSA signatures, or validate token expiry—Apigee enforces this at the network edge.
* **Single Sign-On (SSO) Support:** Enables seamless API access for single-page applications (SPAs) and mobile apps authenticated via corporate SSO.
* **Fine-Grained Access Control:** Claims extracted from the ID token (like department or clearance level) can be evaluated in conditional flows (`<Condition>jwt.JWT-Verify-OIDC-Token.claim.role = "admin"</Condition>`) to gate specific API methods.