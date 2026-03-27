Thank you for clarifying! When you're asking **on behalf of nodes** (Message Processors/Routers), managing client-side traffic takes on an additional dimension. In Apigee, traffic management isn't just about policies—it's also about **how the underlying infrastructure nodes handle that traffic**.

Here's how traffic management works from a node perspective:

---

## 🏗️ The Node Architecture: How Traffic Flows

In Apigee Edge (Private Cloud or SaaS), the gateway layer consists of two key node types that process client traffic:

| Node Type | Role in Traffic Management |
|-----------|---------------------------|
| **Router** | Handles incoming client connections, SSL termination, and load balancing across Message Processors |
| **Message Processor (MP)** | Executes policies (Quota, Spike Arrest, etc.), transforms messages, and communicates with backend services |

All client requests flow through this chain: **Client → Router → Message Processor → Backend**


## ⚙️ How Nodes Handle Distributed Rate Limiting

When you configure a Quota policy with `<Distributed>true</Distributed>`, here's what happens across your Message Processor nodes:

```
┌─────────────────────────────────────────────────────────────┐
│                    Cassandra Cluster                        │
│         (Central distributed counter storage)              │
└─────────────────────────────────────────────────────────────┘
                           ▲
          Periodically sync │ Periodically sync
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌─────────────────┐                   ┌─────────────────┐
│ Message Proc 1  │                   │ Message Proc 2  │
│ Local counter:  │                   │ Local counter:  │
│ 25 requests     │                   │ 30 requests     │
└─────────────────┘                   └─────────────────┘
          ▲                                   ▲
          │                                   │
    Client A ────────────────────────── Client B
    (API key: abc)                      (API key: xyz)
```

**Key points about distributed quota**:
- Each Message Processor maintains a **local counter** for each client
- Periodically, each MP adds its local count to a **distributed counter in Cassandra**
- The MP updates its local copy with the current "cluster value"
- This ensures **quota survives node restarts**—if an MP crashes, the quota data remains in Cassandra and is available when it comes back up

**What this means for client traffic**: A client's rate limit is enforced consistently across all Message Processor nodes, even if their requests are load-balanced to different MPs.


## 📊 Node Performance Capacity

When managing traffic, you need to understand how much each node can handle. For Apigee (SaaS/Cloud), a single gateway node can process approximately **[300 transactions per second (TPS)** under optimal conditions:

> **Test conditions**: 5 KB payload, <100 ms backend latency, same region

**Important considerations**:
- Actual performance depends on proxy complexity, network configuration, and response payload size
- Each environment requires **at least 2 gateway nodes**
- Apigee **automatically scales** nodes up when traffic increases
- Maximum: 1,000 nodes per instance per region

For Private Cloud deployments, you have direct control over adding more Message Processor nodes to scale horizontally.


## 🔧 Traffic Management from Node Operations Perspective

Here are key operational tasks for managing client traffic across nodes:

### 1. Check Node Status
```bash
# Check all components on a node
/opt/apigee/apigee-service/bin/apigee-all status

# Check specific Message Processor status
/opt/apigee/apigee-service/bin/apigee-service edge-message-processor status
```


### 2. Scale by Adding Message Processors
When client traffic increases, you can provision additional nodes and install the Message Processor component. The Management Server automatically distributes traffic across all available MPs.

### 3. Monitor Node Health
Watch these metrics for Message Processors:
- JVM memory usage
- Latency
- If an MP keeps restarting, check `/opt/apigee/var/log` for OOM errors or ZooKeeper connectivity issues

### 4. Understand Stop/Start Order
If you need to perform maintenance on nodes, follow this order to ensure client traffic isn't disrupted:

**Stop order**: Management Server → Message Processors → Postgres → Qpid → Router → Cassandra → ZooKeeper

**Start order**: Cassandra → ZooKeeper → Management Server → Message Processors → Router


## 🎯 Summary: Client Traffic Management Across Nodes

| Aspect | How It Works |
|--------|--------------|
| **Policies** | Quota and Spike Arrest policies attached to proxy endpoints |
| **Distributed state** | Cassandra stores distributed counters; all MPs share quota data |
| **Node scaling** | Add more Message Processors to handle increased client traffic |
| **Capacity** | ~300 TPS per gateway node under optimal conditions |
| **High availability** | Minimum 2 nodes per environment; load balancer distributes traffic |
| **Node failure** | Quota data persists in Cassandra; other MPs continue processing |

---

So when you manage client-side traffic in Apigee "on behalf of nodes," you're really:
1. **Configuring policies** that run on Message Processors
2. **Ensuring distributed quota is enabled** so limits apply consistently across all MPs
3. **Monitoring node health** and scaling MPs up/down based on client traffic volume
4. **Understanding capacity** so you know when to scale

Does this clarify how nodes factor into client-side traffic management? Are you working with Apigee Edge Private Cloud or the SaaS version?