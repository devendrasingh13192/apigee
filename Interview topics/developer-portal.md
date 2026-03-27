The Apigee Developer Portal is a customizable website that serves as the public-facing front door for your API program. Its core role is to help you publish, manage, and promote your APIs to external and internal developers. While the API Gateway (Edge) is the secure runtime engine, the portal is the marketing and onboarding hub that drives API adoption .

### 🎯 The Core Role: Connecting Developers to Your APIs

The portal's primary functions are to help developers help themselves:

| Function | Key Activities & Purpose | Details & Citations |
| :--- | :--- | :--- |
| **📚 API Discovery & Documentation** | - Publish API catalogs, interactive documentation (using OpenAPI/SmartDocs), tutorials, and sample code. | To help developers find, understand, and test APIs before they start coding . |
| **🔑 Self-Service Onboarding** | - Allow developers to create accounts, register apps, and obtain/manage API keys. | To streamline the process of getting developers authenticated and ready to use the APIs . |
| **⚙️ Access & Product Management** | - Expose API Products (bundles of APIs with specific rate limits, etc.) for developers to request access for their apps. | To allow developers to subscribe to specific API Products, and for API providers to control and approve that access . |
| **📈 Community & Support** | - Provide forums, blogs, FAQs, and documentation to foster a community and reduce support burden. | To create a central knowledge base and a space for developers to interact and help each other . |

### 🔄 Key Integration: The Portal and Edge Management

The portal is not a standalone system. It acts as a client that constantly communicates with Apigee Edge to retrieve and send information .

- **A "System of Record" Split**: For **Apps and API Keys**, Edge is the master. When a developer creates an app on the portal, the portal sends the request to Edge, which then generates the API key. All information about the app is stored and managed in Edge .
- **System of Record for Developers**: For **Developer Accounts**, the portal is the primary source. When a developer registers, the account is created both in the portal and in Edge. However, the portal holds critical information like the password and account status. Therefore, administrators should manage developers on the portal, not directly in Edge .

### 🛠️ Your Options for Building a Portal

Apigee offers two main ways to build a developer portal, allowing you to balance ease-of-use with customization needs .

- **Integrated Portal (New UI)**: A simpler, turn-key solution hosted by Apigee. You can build it directly in the Apigee UI (**Publish > Portals**). It's the fastest way to get started with common use cases .
- **Drupal-Based Portal**: A powerful, open-source, and fully customizable solution based on Drupal 10. Apigee provides modules that integrate Drupal with Edge. This option gives you complete control over functionality, hosting (with partners like Pantheon), and the ability to add features like blogs, forums, and monetization .

In short, the Apigee Developer Portal is the essential "storefront" for your API program. It is where the business of attracting developers and managing their access to your APIs happens, complementing the security and traffic management functions of the Apigee Gateway.

Do you have a sense of which type of portal—the simpler Integrated Portal or the more powerful Drupal-based one—would be a better fit for your current needs?