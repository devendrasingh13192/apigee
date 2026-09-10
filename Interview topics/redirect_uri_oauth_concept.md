In Apigee, the **`redirect_uri`** (also called **Callback URL**) is the whitelisted endpoint registered to a developer application where Apigee sends the user—along with an authorization code or token—after successful authentication in an **OAuth 2.0 / OIDC** flow (primarily Authorization Code and Implicit grant types).

---

### How It Works in Apigee

1. **Registration (App Creation):**
When a developer registers a new client app in the Developer Portal or Apigee UI, they specify a `Callback URL` (e.g., `[https://myapp.example.com/oauth/callback](https://myapp.example.com/oauth/callback)`). Apigee stores this URL inside the developer app entity.
2. **Authorization Request:**
When initiating the OAuth flow, the client app sends the user to Apigee's `/authorize` endpoint with query parameters:
```
GET /oauth/v1/authorize?
  response_type=code
  &client_id=YOUR_APIGEE_CLIENT_KEY
  &redirect_uri=https://myapp.example.com/oauth/callback
  &scope=read

```


3. **Validation by Apigee:**
Inside the proxy, Apigee's OAuth policy checks whether the incoming `redirect_uri` in the query parameter **strictly matches** the registered callback URL associated with that `client_id`.
* **Match:** Flow proceeds to authenticate the user and generate the authorization code.
* **Mismatch:** Apigee aborts the request with an error (e.g., `invalid_request` or `redirect_uri_mismatch`).


4. **Redirection:**
After the user consents, Apigee issues an HTTP 302 redirecting the user's browser back to that URI with the authorization code attached:
```
Location: https://myapp.example.com/oauth/callback?code=AUTH_CODE_HERE&state=xyz

```



---

### Why It Is Critical (Security Function)

* **Prevents Token / Code Hijacking:** Without strict validation, an attacker could tamper with the parameter (e.g., `redirect_uri=[https://attacker.com/steal](https://attacker.com/steal)`) and trick the user into sending the authorization code or access token directly to malicious servers.
* **Exact Matching Enforcement:** Apigee enforces URL matching to prevent subdomain takeovers or open redirect vulnerability exploits.

---

### Apigee Policy Usage

Inside the `OAuthV2` policy (operation `GenerateAuthorizationCode` or `GenerateAccessToken`), the redirect URI validation is handled automatically using the registered app attributes, but it can also be explicitly mapped:

```xml
<OAuthV2 name="OAuth-Generate-Auth-Code">
    <Operation>GenerateAuthorizationCode</Operation>
    <ExpiresIn>300000</ExpiresIn> <!-- 5 minutes -->
    <ResponseType>request.queryparam.response_type</ResponseType>
    <ClientId>request.queryparam.client_id</ClientId>
    <RedirectUri>request.queryparam.redirect_uri</RedirectUri>
    <Scope>request.queryparam.scope</Scope>
</OAuthV2>

```