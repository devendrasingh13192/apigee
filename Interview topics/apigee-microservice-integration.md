From an **infrastructure and networking perspective**, Apigee X does not talk to microservices over the public internet. Instead, it connects into your backend environment (Google Kubernetes Engine, Cloud Run, Compute Engine VMs, or on-premises datacenters) via **private, dedicated network bridges**.

---

### Infrastructure Topology Diagram

```
[ Internet Client ]
       │  (Public TLS)
       ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. INGRESS LAYER (Customer Project)                         │
│    • Cloud Armor (WAF / DDoS protection)                    │
│    • Global External Application Load Balancer (HTTPS GCLB)  │
│    • Managed SSL Certificates                               │
└──────────────────────────────┬──────────────────────────────┘
                               │  (Internal Private Routing)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. APIGEE X RUNTIME TENANT PROJECT (Managed by Google)      │
│    • Apigee Ingress Router                                  │
│    • Message Processors (Runs API Proxies & Policies)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ═══════════════════╪═══════════════════
             VPC Network Peering / PSC (Private)
            ═══════════════════╪═══════════════════
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CUSTOMER VPC NETWORK (Backend Infrastructure)            │
│                                                             │
│    • Internal Application Load Balancer (Internal TCP/HTTP) │
│      (Single private IP address, e.g., 10.128.0.50:8080)    │
│                               │                             │
│                               ▼                             │
│    • Kubernetes Cluster (GKE) / Microservices               │
│      ├── Pod 1: userService-7d9f-1 (10.0.1.12:8080)         │
│      ├── Pod 2: userService-7d9f-2 (10.0.1.13:8080)         │
│      └── Pod 3: userService-7d9f-3 (10.0.1.14:8080)         │
└─────────────────────────────────────────────────────────────┘

```

---

### Core Infrastructure Components

**1. Northbound Ingress (Public-to-Apigee)**

* **Google Cloud External Application Load Balancer (GCLB):** The single public entry point for incoming internet traffic.
* **Serverless Network Endpoint Group (NEG):** Points the GCLB directly to the private Apigee runtime.
* **Google Cloud Armor:** Placed in front of the GCLB to filter SQLi, XSS, and rate-limit malicious bot IPs before hitting Apigee.

**2. Network Peering Bridge (Apigee-to-Customer VPC)**

* Apigee X runs in a Google-managed VPC (Tenant Project).
* To reach your microservices securely, Apigee uses either:
* **VPC Network Peering:** A direct `/22` IP CIDR block allocated in your VPC that allows Apigee to route to private `10.x.x.x` or `172.x.x.x` subnets without internet gateways.
* **Private Service Connect (PSC):** A modern alternative that connects Apigee to a specific internal service attachment in your VPC using private endpoints.



**3. Southbound Egress (Apigee-to-Microservice via GKE / Cloud Run)**
Instead of pointing Apigee to individual, dynamic Kubernetes pod IPs, traffic is routed through an **Internal Load Balancer (ILB)** or a **Kubernetes Ingress Controller**:

* In GKE, you expose the `userService` using an internal service annotation:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service-ilb
  annotations:
    networking.gke.io/load-balancer-type: "Internal"
spec:
  type: LoadBalancer
  selector:
    app: user-service
  ports:
    - port: 8080
      targetPort: 8080

```


* GKE assigns this service a static internal IP (e.g., `10.128.0.50`).

---

### Connecting Apigee to the Microservice Infrastructure

**Step 1: Create an Apigee TargetServer Resource**
In your Apigee environment, define a **TargetServer** pointing directly to the internal IP or private DNS name of the microservice load balancer:

```json
{
  "name": "ts_userservice_backend",
  "host": "10.128.0.50",
  "port": 8080,
  "isEnabled": true
}

```

**Step 2: Reference the TargetServer in the Proxy TargetEndpoint**
Apigee routes seamlessly through the VPC peering tunnel directly to your microservice:

```xml
<TargetEndpoint name="default">
  <HTTPTargetConnection>
    <LoadBalancer>
      <Server name="ts_userservice_backend" />
    </LoadBalancer>
    <Path>/api/v1/users</Path>
  </HTTPTargetConnection>
</TargetEndpoint>

```

---

### Connecting to Other Backend Microservice Types

* **Cloud Run (Serverless Microservice):** If your `userService` is on Cloud Run, configure **Direct VPC Egress** or use an **Internal Application Load Balancer with a Serverless NEG** so Apigee communicates with Cloud Run strictly through the internal VPC without going over the public internet.
* **On-Premises Microservice:** Apigee connects across the VPC peering bridge $\rightarrow$ Google Cloud Router $\rightarrow$ **Cloud Interconnect / Cloud VPN** $\rightarrow$ On-prem data center private IP space.