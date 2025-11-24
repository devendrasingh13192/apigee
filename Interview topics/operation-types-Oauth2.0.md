## OAuth 2.0 Operations in `<Operation>` Element

### **Generate Operations:**
- **GenerateAccessToken** - Creates access token
- **GenerateRefreshToken** - Creates refresh token  
- **GenerateAccessTokenImplicitGrant** - For implicit flow

### **Verify Operations:**
- **VerifyAccessToken** - Validates access token
- **VerifyRefreshToken** - Validates refresh token

### **Other Operations:**
- **RevokeToken** - Revokes/blacklists tokens
- **RefreshAccessToken** - Gets new access token using refresh token
- **GenerateAuthorizationCode** - Creates auth code (code grant)

### **Example:**
```xml
<OAuthV2 name="GenerateAccessToken">
  <Operation>GenerateAccessToken</Operation>
  <ExpiresIn>3600</ExpiresIn>
</OAuthV2>
```

These operations define what specific OAuth action the policy will perform in Apigee.