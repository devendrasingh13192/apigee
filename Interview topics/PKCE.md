**PKCE** (Proof Key for Code Exchange, pronounced *"pixy"*) is a security extension for OAuth 2.0 (RFC 7636) designed to prevent **Authorization Code interception attacks**.

It protects public clients (mobile apps, Single Page Applications) that cannot securely store a `client_secret`.

---

**How It Works (3 Steps)**

1. **Create Proof:** The client generates a random secret (`code_verifier`) and hashes it via SHA-256 (`code_challenge`).
2. **Authorize:** The client sends the `code_challenge` in the initial authorization request. Apigee/IdP saves it and returns the `authorization_code`.
3. **Redeem:** When exchanging the code for an access token, the client sends the raw `code_verifier`. The server hashes it; if it matches the original `code_challenge`, the token is issued.

---

**Why It Matters**

Even if a malicious app on the device intercepts the `authorization_code` from the redirect URI, it cannot exchange it for an access token without the original `code_verifier`, which never leaves the legitimate app.