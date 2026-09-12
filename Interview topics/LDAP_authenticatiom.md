The **LDAP policy** (`<Ldap>`) in Apigee is primarily used to **authenticate users directly against an enterprise directory service** (such as Microsoft Active Directory or OpenLDAP) and retrieve user profile attributes during API execution.

---

### Primary Use Cases

* **Direct Credential Validation:** Authenticates username and password pairs (often extracted from an incoming HTTP `Basic Authentication` header) against an enterprise LDAP tree.
* **Role & Attribute Retrieval:** Fetches user metadata upon successful authentication—such as email addresses, department codes, group memberships, or organizational units (DNs)—and exposes them as Apigee flow variables.
* **Fine-Grained Authorization:** Allows policies downstream (such as `RaiseFault` or conditional routing) to enforce access control based on LDAP group membership (e.g., restricting access to users within `cn=engineering,ou=groups,dc=example,dc=com`).

---

### How It Works in a Proxy Flow

```
Client Request (Basic Auth Header)
       │
       ▼
[ExtractVariables / BasicAuthentication Policy]  --> Decodes username:password
       │
       ▼
[LDAP Policy]                                   --> Binds to LDAP & verifies credentials
       │
       ├── Failure ──► [RaiseFault Policy (401 Unauthorized)]
       ▼ Success
Extracts LDAP attributes into Flow Variables (e.g., ldap.user.mail)
       │
       ▼
Target Backend

```

---

### Key Action Supported

The policy executes an **authenticate** action using an external or internal LDAP server configuration:

```xml
<Ldap name="Authenticate-User">
    <Action>authenticate</Action>
    <LdapResource>my-ldap-resource</LdapResource>
    <Authentication>
        <Username ref="request.header.username"/>
        <Password ref="request.header.password"/>
    </Authentication>
</Ldap>

```

---

### Context & Platform Availability

* **Apigee Edge / Private Cloud (OPDK):** Widely used in on-premises architectures where internal legacy APIs rely on existing Active Directory or OpenLDAP stores instead of OAuth/OIDC tokens.
* **Apigee X / Hybrid:** Modern cloud architectures generally deprecate direct LDAP calls from runtime proxies in favor of identity federation (OAuth 2.0 / OpenID Connect, SAML, or cloud identity providers like Okta, Ping, or Google Cloud Identity). Where on-prem LDAP integration is still required, it is typically bridged via external auth services or custom target callouts.