## In Apigee, API Key and Client ID are **NOT the same**:

### **API Key (Consumer Key)**
- **Generated automatically** when creating an App
- Used for **API Key validation** in policies
- **Secret credential** for API access
- Passed in `apikey` header or query parameter

### **Client ID**
- **Optional OAuth credential** 
- Used for **OAuth flows** alongside Client Secret
- Created when **OAuth credentials** are enabled for the App
- Different from the API Key

### **In Apigee Management UI:**
```
Admin → Publish → Apps → Create App
```
- **Auto-generates**: API Key (Consumer Key) + Secret
- **Optional**: Can also generate OAuth Client ID + Secret if OAuth is configured

### **Key Difference:**
- **Every App** gets an API Key
- **Only OAuth-enabled Apps** get Client ID
- **API Key ≠ Client ID** - they serve different authentication purposes

So while both are created in the same place, they are distinct credentials for different security mechanisms.