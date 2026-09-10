In Apigee Edge, rate plans are configured as part of **Apigee Monetization** (Mint) to charge developers for consuming API packages or to set up revenue-sharing models.

---

### Prerequisites

Before creating a rate plan, you must set up the foundation in this order:

1. **API Products:** Define the proxies, resource paths, and quota limits.
2. **Supported Currencies:** Configure accepted billing currencies under the Monetization settings.
3. **API Package:** Bundle one or more API Products into a package (rate plans attach directly to packages, not standalone products).

---

### Step-by-Step Configuration in the Apigee Edge UI

1. **Navigate to Monetization Packages:**
* Log in to the Apigee Edge UI (`[apigee.com/edge](https://apigee.com/edge)`).
* In the left navigation bar, go to **Publish** $\rightarrow$ **Packages**.


2. **Select or Create a Package:**
* Click the API Package you want to monetize.


3. **Add a Rate Plan:**
* Inside the package details page, switch to the **Rate Plans** tab.
* Click **+ Rate Plan**.


4. **Define Basic Details:**
* **Name & Description:** Label the plan (e.g., `Standard Tier`, `Pay-As-You-Go`, `Enterprise`).
* **Start & End Dates:** Define the plan's validity window.
* **Currency:** Choose the transaction currency (e.g., USD, EUR).
* **Monetization Type:**
* **Developer Pays:** The developer is billed for API consumption.
* **Developer Gets Paid:** Revenue-sharing model (Apigee pays the developer for driving transactions).




5. **Choose the Charging Model:**
Select how usage is calculated under the **Fees** or **Rates** section:
* **Fixed Recurring Fee:** A subscription base fee (e.g., $50/month) independent of call count.
* **Flat Rate:** A fixed price per transaction (e.g., $0.02 per call).
* **Volume Banded / Tiered (Tiered Pricing):** Different pricing per unit based on usage brackets (e.g., 0–10,000 calls = $0.05/call; 10,001+ = $0.02/call).
* **Freemium:** Free allocation for the first $N$ calls per period, followed by standard rates.


6. **Set Scope & Visibility:**
* **Standard (Public):** Visible and purchasable by all registered developers in the Developer Portal.
* **Custom (Private):** Tailored specifically for a single developer or developer company.


7. **Save and Publish:**
* Click **Save**. The plan will now be available for developers to subscribe to either via the Developer Portal or programmatically.



---

### Alternative: Configuring via the Management API

You can also automate rate plan creation by making a `POST` request to the Edge Monetization API:

```bash
curl -X POST -H "Content-Type: application/json" -u {org_admin_email} \
  "https://api.enterprise.apigee.com/v1/mint/organizations/{org_name}/monetization-packages/{package_id}/rate-plans" \
  -d '{
    "name": "Standard Pay-As-You-Go",
    "displayName": "Standard Pay-As-You-Go",
    "currency": { "id": "usd" },
    "startDate": "2026-01-01 00:00:00",
    "type": "STANDARD",
    "ratePlanDetails": [
      {
        "type": "RATECARD",
        "ratingModel": "FLATRATE",
        "ratePlanRates": [
          {
            "rate": 0.05,
            "startUnit": 0
          }
        ]
      }
    ]
  }'

```