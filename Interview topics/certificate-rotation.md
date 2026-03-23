I've searched for information on rotating certificates in an Apigee test environment, but the available documentation focuses on specific areas like Cassandra credential rotation in Apigee Hybrid  and generating self-signed TLS certificates . However, I can provide you with a practical approach based on common Apigee patterns and best practices.

## 🔄 Certificate Rotation Process for Apigee Test Environment

### Prerequisites
- Access to Apigee UI/Management API
- New certificate files (key and PEM)
- Appropriate permissions (Org Admin typically)

### Step-by-Step Rotation Process

#### 1. **Prepare New Certificates**
```bash
# Generate test certificate (if needed)
openssl req -x509 -newkey rsa:2048 -keyout new-key.pem -out new-cert.pem -days 365 -nodes
```

#### 2. **Upload New Certificate to Apigee**
```bash
# Using Apigee Management API
curl -X POST "https://api.enterprise.apigee.com/v1/organizations/{org-name}/environments/test/keystores" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "name": "test-keystore-2026"
  }'

# Upload certificate
curl -X POST "https://api.enterprise.apigee.com/v1/organizations/{org-name}/environments/test/keystores/{keystore-name}/certs" \
  -H "Authorization: Bearer {token}" \
  -F "certFile=@new-cert.pem" \
  -F "keyFile=@new-key.pem"
```

#### 3. **Update Target Endpoint Configuration**
```xml
<!-- In your TargetEndpoint XML -->
<TargetEndpoint name="default">
    <HTTPTargetConnection>
        <SSLInfo>
            <Enabled>true</Enabled>
            <KeyStore>test-keystore-2026</KeyStore>
            <KeyAlias>new-cert-alias</KeyAlias>
            <TrustStore>test-truststore</TrustStore>
        </SSLInfo>
        <URL>https://backend.example.com</URL>
    </HTTPTargetConnection>
</TargetEndpoint>
```

#### 4. **Rollout Strategy for Test Environment**
```yaml
Phase 1: Deploy to test environment (non-critical APIs)
Phase 2: Verify connectivity and functionality
Phase 3: Monitor for errors (4xx/5xx, SSL handshake failures)
Phase 4: Keep old certificate for 24-48 hours for rollback
```

#### 5. **Validation Steps**
```bash
# Test API call with new certificate
curl -v https://api-test.example.com/v1/health-check

# Check Apigee logs for SSL errors
# Monitor for: "SSLHandshakeError", "certificate verify failed"
```

#### 6. **Rollback Plan**
```xml
<!-- Keep old configuration ready for quick revert -->
<TargetEndpoint name="default">
    <HTTPTargetConnection>
        <SSLInfo>
            <Enabled>true</Enabled>
            <KeyStore>test-keystore-previous</KeyStore>  <!-- Switch back here -->
            <KeyAlias>old-cert-alias</KeyAlias>
            <TrustStore>test-truststore</TrustStore>
        </SSLInfo>
    </HTTPTargetConnection>
</TargetEndpoint>
```

## 🔍 Best Practices for Test Environment

1. **Automate with Scripts** - Create shell scripts for consistent rotation
2. **Document Expiry Dates** - Track certificate expiration
3. **Test Both MTLS Scenarios** - Test Apigee → Backend and Client → Apigee
4. **Monitor After Rotation** - Check for 24 hours post-rotation

## 📝 Quick Reference Commands

```bash
# List existing keystores
curl "https://api.enterprise.apigee.com/v1/organizations/{org}/environments/test/keystores"

# Get certificate details
curl "https://api.enterprise.apigee.com/v1/organizations/{org}/environments/test/keystores/{keystore}/certs/{cert}"

# Delete old certificate (after validation)
curl -X DELETE "https://api.enterprise.apigee.com/v1/organizations/{org}/environments/test/keystores/{keystore}/certs/{old-cert}"
```

**Note**: The exact API endpoints and procedures may vary based on your Apigee version (SaaS vs. Hybrid) and specific configuration. Always test in a non-production environment first.

Would you like me to elaborate on any specific aspect of the rotation process?

------------------------------------------------------------------------------------------

Of course! Here is a step-by-step, click-by-click guide to rotating a TLS certificate in an Apigee Edge test environment using the UI. This follows the best practice of creating a new keystore and using a reference to minimize downtime .

### 🔄 Step-by-Step UI Guide for Certificate Rotation

#### Step 1: Create a New Keystore and Upload the New Certificate
First, you'll create a brand new keystore to hold your new certificate, keeping the old one intact for a quick rollback if needed.

1.  **Navigate to the TLS Keystores page.** Log in to the Apigee Edge UI. In the top menu, click **Admin** > **Environments** > **TLS Keystores** .
2.  **Select your environment.** Ensure the **test** environment is selected from the dropdown.
3.  **Create a new Keystore.** Click the **+ Keystore** button.
    *   In the "Add Keystore" dialog, enter a **Name** for your new keystore. A good naming convention includes the certificate's expiry date or a version, for example, `test-backend-keystore-2028`.
    *   Click **Add** .
4.  **Add an Alias and Upload Certificates.** After creation, you'll be prompted to add an alias.
    *   In the "Add alias" dialog, enter an **Alias name**. You can keep this the same as your old alias (e.g., `server-cert`) or give it a new name.
    *   For **Certificate**, either paste the full content of your new PEM certificate (including the entire chain) or click **Upload file** to select the `.pem` or `.crt` file .
    *   For **Private Key**, either paste the content of your new private key or upload the `.key` file.
    *   If your private key has a passphrase, enter it in the **Key passphrase** field.
    *   Click **Add** to save the alias and complete the keystore creation .

#### Step 2: Update the Target Endpoint to Use the New Keystore
Now, you need to tell your API proxy to use the new keystore. This is where **references** come in. Apigee strongly recommends using a reference to the keystore name, not the literal name .

1.  **Navigate to your API Proxy.** Go to **Develop** > **API Proxies** and select the proxy you want to update.
2.  **Open the Target Endpoint configuration.** Click the **Develop** tab. Under **Target Endpoints**, select **default** (or the name of your target endpoint). This opens the XML configuration for the target .
3.  **Locate or add the `<SSLInfo>` section.** Find the `<HTTPTargetConnection>` element. You will need to ensure an `<SSLInfo>` section exists and that it uses a reference. The configuration should look similar to this :
    ```xml
    <TargetEndpoint name="default">
      <HTTPTargetConnection>
        <SSLInfo>
          <Enabled>true</Enabled>
          <KeyStore>ref://my-keystore-ref</KeyStore>
          <KeyAlias>server-cert</KeyAlias>
          <TrustStore>ref://my-truststore-ref</TrustStore> <!-- If needed -->
        </SSLInfo>
        <URL>https://your-backend-url.com</URL>
      </HTTPTargetConnection>
    </TargetEndpoint>
    ```
    *   **If you are already using a reference**, you just need to update that reference to point to your new keystore (see Step 3).
    *   **If you are using a literal keystore name**, you must first convert it to a reference. You can manually edit the XML to change, for example, `<KeyStore>old-keystore-name</KeyStore>` to `<KeyStore>ref://my-keystore-ref</KeyStore>`.

4.  **Save the proxy.** Click the **Save** button. Saving will automatically re-deploy the proxy to the test environment with this new configuration .

#### Step 3: Update the Reference (or Create One)
A reference is a simple pointer that can be changed without re-deploying your API proxy .

1.  **Navigate to References.** In the Apigee UI, go to **Admin** > **Environments** > **References**.
2.  **Select your environment.** Make sure the **test** environment is selected.
3.  **Find and edit your reference.** Locate the reference name you used in your TargetEndpoint configuration (e.g., `my-keystore-ref`). Click on it to edit.
4.  **Change the target.** In the "Refers to" field, change the value from the name of your old keystore to the name of the **new keystore** you created in Step 1 (e.g., `test-backend-keystore-2028`).
5.  **Update the reference.** Click the **Update** button.

At this moment, all API proxies using that reference will instantly start using the new keystore and its certificate without needing a restart or re-deployment .

#### Step 4: Validation and Cleanup
1.  **Test your API.** Call your API in the test environment to ensure it's working correctly with the new certificate. Check for any SSL handshake errors in the Apigee logs.
2.  **Monitor for a while.** It's good practice to leave the old keystore in place for a day or two in case you need to roll back (by simply pointing the reference back to the old keystore name).
3.  **Delete the old keystore.** Once you are confident the new certificate is working and the old one has expired, you can safely delete the old keystore from the **Admin** > **Environments** > **TLS Keystores** page to keep your environment clean.

By following these steps, you ensure a smooth, zero-downtime rotation of your TLS certificate in the Apigee test environment.