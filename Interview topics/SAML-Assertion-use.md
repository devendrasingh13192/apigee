**Security Assertion Markup Language (SAML)** in Apigee is used to securely exchange XML-based authentication and authorization data between identity providers (IdPs) and service providers (SPs).

---

### 1. Why SAML is Used in Apigee

* **Enterprise Single Sign-On (SSO):** Validates enterprise users authenticated by external IdPs (e.g., Okta, Ping Identity, Microsoft Entra ID) before granting API access.
* **Legacy & SOAP Integration:** Secures communication with legacy enterprise systems and WS-Security/SOAP backends that require signed XML assertions.
* **Token Exchange (SAML-to-OAuth / RFC 7522):** Allows clients to present a heavy SAML token once to obtain a lightweight OAuth bearer token for subsequent API calls.
* **Last-Mile Backend Security:** Apigee can generate SAML assertions on the outbound flow to authenticate itself with upstream backends without passing client credentials.

---

### 2. How SAML Works in Apigee

Apigee operates in two distinct roles:

| Role | Apigee Policy | Mechanism |
| --- | --- | --- |
| **Service Provider (SP)** | `ValidateSAMLAssertion` | Apigee receives an inbound XML payload or header containing a signed assertion, validates the digital signature against a **TrustStore** certificate, verifies timestamps/conditions, and extracts claims into flow variables (e.g., `saml.subject`, `saml.issuer`). |
| **Identity Provider (IdP)** | `GenerateSAMLAssertion` | Apigee creates and digitally signs a new SAML 2.0 assertion using a **KeyStore** private key and injects it into outbound request payloads to the backend. |

---

### 3. Key Policies Required to Implement a SAML Flow

To build an end-to-end SAML workflow (such as a SAML token exchange or legacy payload validation), you typically chain these policies together:

1. **`ValidateSAMLAssertion` (Core):**
* Verifies the XML signature, expiry timestamp, and assertion conditions.
* Populates variables like `saml.valid`, `saml.subject`, and custom attributes.


2. **`XMLThreatProtection`:**
* Placed **before** SAML validation to protect Message Processors against XML parser exploits (such as XML Entity Expansion / Billion Laughs attacks).


3. **`ExtractVariables`:**
* Extracts custom SAML attributes, roles, or assertions embedded in SOAP headers/bodies if fine-grained XPath parsing beyond standard SAML flow variables is needed.


4. **`OAuthV2` (`<Operation>GenerateAccessToken</Operation>`):**
* Used when exchanging SAML assertions for OAuth 2.0 access tokens. It binds the extracted `saml.subject` to the newly generated OAuth token as a custom attribute or user ID.


5. **`AssignMessage` / `RaiseFault`:**
* **`RaiseFault`:** Rejects requests if `saml.valid` is not `true` or if required roles are missing.
* **`AssignMessage`:** Strips heavy XML payloads/headers before routing to modern REST backends or injects generated assertion tokens into outbound headers.



---

### 4. Infrastructure Prerequisites

* **TrustStore:** Contains public X.509 certificates from the Identity Provider used by `ValidateSAMLAssertion` to verify signatures.
* **KeyStore:** Contains the private key and certificate used by `GenerateSAMLAssertion` to sign outbound assertions.