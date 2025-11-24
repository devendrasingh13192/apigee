Here are several approaches to establish secure connections with a firewalled backend, depending on your specific requirements:

## 1. VPN (Virtual Private Network)

### Site-to-Site VPN
```bash
# Example using OpenVPN
# Server config (backend)
dev tun
ifconfig 10.8.0.1 10.8.0.2
secret static.key

# Client config
dev tun
remote your-backend.com 1194
ifconfig 10.8.0.2 10.8.0.1
secret static.key
```

### Cloud VPN Options
- **AWS Client VPN** / Site-to-Site VPN
- **GCP Cloud VPN**
- **Azure VPN Gateway**

## 2. SSH Tunneling

### Local Port Forwarding
```bash
# Forward local port 8080 to backend port 80
ssh -L 8080:localhost:80 user@bastion-host -N

# Then connect to localhost:8080 to reach backend
```

### Reverse SSH Tunnel
```bash
# From backend (initiates connection to accessible server)
ssh -R 2222:localhost:22 user@public-server.com -N

# Then SSH to public-server:2222 to reach backend
```

## 3. Secure API Gateway Pattern

### Using API Gateway as Secure Entry Point
```yaml
# Example API Gateway configuration
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: secure-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: backend-cert
    hosts:
    - "api.yourdomain.com"
```

## 4. Zero Trust / BeyondCorp Approach

### Using Cloudflare Zero Trust
```javascript
// Cloudflare Tunnel configuration
// cloudflared tunnel create backend-tunnel
// cloudflared tunnel route dns backend-tunnel api.internal.company.com
```

### Using Tailscale
```go
// Example Tailscale setup
package main

import (
    "tailscale.com/tsnet"
    "tailscale.com/client/tailscale"
)

func main() {
    s := &tsnet.Server{
        Hostname: "backend-service",
        AuthKey:  "tskey-auth-xxxxx",
    }
    defer s.Close()
    
    ln, _ := s.Listen("tcp", ":80")
    // Your backend service
}
```

## 5. Mutual TLS (mTLS)

### Backend Service with mTLS
```python
from flask import Flask
import ssl

app = Flask(__name__)

context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
context.verify_mode = ssl.CERT_REQUIRED
context.load_cert_chain('server.crt', 'server.key')
context.load_verify_locations('ca.crt')

@app.route('/api/data')
def get_data():
    return {"status": "secure"}

if __name__ == '__main__':
    app.run(ssl_context=context, host='0.0.0.0', port=8443)
```

### Client with mTLS
```python
import requests

session = requests.Session()
session.cert = ('client.crt', 'client.key')
session.verify = 'ca.crt'

response = session.get('https://backend.internal:8443/api/data')
```

## 6. Service Mesh (Istio/Linkerd)

### Istio Service Mesh Configuration
```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: backend-strict
spec:
  selector:
    matchLabels:
      app: backend
  mtls:
    mode: STRICT
---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: backend-dr
spec:
  host: backend.default.svc.cluster.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
```

## 7. Web Application Firewall (WAF) + Reverse Proxy

### Nginx Reverse Proxy Configuration
```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    location / {
        proxy_pass https://backend.internal:8443;
        proxy_ssl_certificate /path/to/client.crt;
        proxy_ssl_certificate_key /path/to/client.key;
        proxy_ssl_verify on;
        proxy_ssl_trusted_certificate /path/to/ca.crt;
        
        # Additional security
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 8. Cloud-Specific Solutions

### AWS
```yaml
# CloudFormation for VPC Endpoints
VPCEndpoint:
  Type: AWS::EC2::VPCEndpoint
  Properties:
    ServiceName: com.amazonaws.region.execute-api
    VpcId: !Ref VPC
    PolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal: "*"
          Action: "execute-api:Invoke"
          Resource: "*"
```

### GCP
```yaml
# Private Service Connect
kind: compute#forwardingRule
name: backend-service
network: projects/project/global/networks/backend-network
IPAddress: 10.0.0.10
target: projects/project/regions/us-central1/serviceAttachments/backend-attachment
```

## 9. WireGuard for High-Performance VPN

```ini
# Server configuration (/etc/wireguard/wg0.conf)
[Interface]
PrivateKey = server_private_key
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT

[Peer]
PublicKey = client_public_key
AllowedIPs = 10.0.0.2/32
```

## Best Practices Summary

1. **Defense in Depth**: Combine multiple layers (VPN + mTLS + WAF)
2. **Least Privilege**: Only open necessary ports
3. **Certificate Management**: Use automated certificate rotation
4. **Monitoring**: Implement comprehensive logging and alerting
5. **Regular Audits**: Conduct security assessments
6. **Zero Trust**: Verify every request, regardless of source

Choose the approach based on your:
- **Security requirements** (compliance, sensitivity of data)
- **Infrastructure** (cloud, on-prem, hybrid)
- **Team expertise** (VPN management, service mesh operations)
- **Performance needs** (latency, throughput)

The most common enterprise pattern is **VPN + API Gateway + mTLS** for comprehensive security.