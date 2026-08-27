There are two primary ways to integrate BigQuery with Apigee X, depending on your specific use case. One method is for sending custom analytics data, and the other is for exporting Apigee's built-in analytics.

### ⚙️ Method 1: Send Custom Data via Extension

This is the best method for logging custom business events or request/response payloads directly from your API proxy logic.

1.  **Prerequisites**: You must enable the BigQuery API in your Google Cloud project and create the target dataset and table beforehand .
2.  **Create Service Account**: In your GCP project, create a service account and download its JSON key file. You will need the contents of this file later .
3.  **Add Extension in Apigee**: In the Apigee UI, navigate to **Admin > Extensions**. Click **+ Add Extension** and select the **Google BigQuery** package. Give it a name.
4.  **Configure Extension**: When configuring, you must provide two key pieces of information :
    - **Project ID**: Your Google Cloud project ID.
    - **Credentials**: Paste the entire JSON content of the service account key file you downloaded.
5.  **Use in Proxy**: In your API proxy, add an **Extension Callout policy**. Configure it to use the extension you just created and define the `insert` action with the dataset, table, and data rows .

**Example Policy XML**:
```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ExtensionCallout name="Log-to-BigQuery">
    <DisplayName>Log to BigQuery</DisplayName>
    <Extension>your-bigquery-extension-name</Extension>
    <Action>insert</Action>
    <Input><![CDATA[{
        "dataset" : "your_dataset",
        "table" : "your_table",
        "rows" : [
            {"api_name": "my-proxy", "response_code": "200", "timestamp": "{system.timestamp}"}
        ]
    }]]></Input>
</ExtensionCallout>
```

### 📊 Method 2: Export Apigee Analytics Data

Use this method to push Apigee's built-in analytics data (traffic, latency, error rates) to BigQuery for deeper analysis.

1.  **Prepare Permissions**: Find your Apigee organization's service agent email via API and grant it the **BigQuery User** and **Storage Admin** roles in your GCP project's IAM .
2.  **Create a Datastore**: In the Apigee UI, go to **Admin > Analytics Datastores**. Click **+ Add Datastore** and select **Google BigQuery** .
3.  **Configure the Datastore**: Provide the details :
    - **Name**: A display name for this connection.
    - **Credentials**: Select the service account you set permissions for.
    - **Project ID**: Your GCP project ID.
    - **Dataset Name**: The BigQuery dataset where you want the data.
    - **Table Prefix**: A prefix for the tables that will be created automatically.
4.  **Export Data**: Once created, you can use the **Export Data** API or UI options to schedule or trigger one-time exports of your analytics data to BigQuery.

### 💡 Alternative: Direct REST Call

A third option, which provides maximum flexibility, is to have your Apigee proxy call the BigQuery REST API directly using a **Service Callout** policy. This requires your proxy to handle OAuth2 authentication to obtain an access token for your service account .