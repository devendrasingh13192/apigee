## SECURITY TROUBLESHOOTING

Q: Describe a security incident you handled in Apigee
A: "In one project, we detected token replay attacks. I implemented:
1. JWT jti (JWT ID) claim validation
2. Shortened token expiration from 1hr to 15min
3. Added suspicious IP detection using JavaScript callouts
4. Implemented automated token revocation"

Q: How do you manage secrets and certificates in Apigee?
A: 
- Key Value Maps for non-sensitive configs
- Encrypted KVMs for sensitive data
- Certificate management through Apigee UI/API
- Regular rotation policies
- Environment-specific configurations