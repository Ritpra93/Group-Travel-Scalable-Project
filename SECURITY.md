# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in this project, please report it by emailing the maintainers directly. Please do not create public GitHub issues for security vulnerabilities.

We take security seriously and will respond promptly to valid reports.

---

## Environment Variables

### Development Setup

1. Copy `.env.example` to `.env` in the backend directory:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Generate strong cryptographically secure JWT secrets:
   ```bash
   openssl rand -hex 32  # Copy output for JWT_SECRET
   openssl rand -hex 32  # Copy output for JWT_REFRESH_SECRET
   ```

3. Edit `backend/.env` and replace the JWT secret placeholders with the generated values

4. Never commit `.env` files to version control (already gitignored)

### Optional API Tokens

#### Figma Integration
Personal access token for design system integration (optional for development):
- Obtain from: https://www.figma.com/developers/api#access-tokens
- Add to `backend/.env` as `FIGMA_ACCESS_TOKEN=your_token_here`
- This token is NOT required for the application to run
- Keep it secure and never commit it

---

## Production Deployment Checklist

Before deploying to production, ensure:

### Secrets Management
- [ ] **NEVER commit .env files to version control**
- [ ] **NEVER copy development .env to production servers**
- [ ] Generate fresh, unique JWT secrets for production environment
- [ ] Use hosting platform environment variables (Vercel, Railway, Render, etc.)
- [ ] All secrets are at least 64 characters of random data
- [ ] Different secrets are used for each environment (dev, staging, prod)

### Database Security
- [ ] Production database has strong passwords
- [ ] Database is not publicly accessible
- [ ] SSL/TLS is enabled for database connections
- [ ] Regular backups are configured

### Application Security
- [ ] `NODE_ENV=production` is set
- [ ] CORS origins are restricted to your frontend domain only
- [ ] Rate limiting is enabled (already configured)
- [ ] Helmet security headers are active (already configured)
- [ ] HTTPS is enforced on all endpoints

### Monitoring
- [ ] Error tracking is configured (Sentry recommended)
- [ ] Logs are being collected and monitored
- [ ] Audit logs for sensitive operations are enabled

---

## Security Best Practices

### Authentication
- JWT access tokens expire after 15 minutes (configured)
- Refresh tokens expire after 7 days (configured)
- Tokens are automatically rotated on refresh
- Passwords are hashed with bcrypt (12 salt rounds)

### Data Protection
- SQL injection protection via Prisma ORM parameterized queries
- XSS protection via React's automatic escaping + Helmet CSP
- CSRF protection for state-changing operations
- Input validation using Zod schemas

### Known Acceptable Risks (MVP)
1. **Access tokens in localStorage** (XSS risk)
   - Mitigated by: 15-minute expiry, token rotation, Helmet middleware
   - Future improvement: Move to httpOnly cookies

2. **Development dependencies with vulnerabilities**
   - Only affect build/development tools, not production runtime
   - Should be addressed in regular dependency updates

---

## Rotating Compromised Secrets

If you suspect a secret has been compromised:

### JWT Secrets
1. Generate new secrets: `openssl rand -hex 32`
2. Update production environment variables
3. Restart the application
4. All users will need to log in again (expected behavior)

### Figma Token
1. Log into Figma account → Settings → Personal Access Tokens
2. Delete the compromised token
3. Generate a new token if needed
4. Update your local `backend/.env` file
5. The token is optional and doesn't affect application functionality

### Database Credentials
1. Create new database user with strong password
2. Update `DATABASE_URL` in production environment
3. Restart application
4. Delete old database user

---

## Dependency Management

### Regular Updates
- Review and update dependencies monthly
- Run `npm audit` regularly to check for vulnerabilities
- Test updates in development before deploying to production

### Audit Commands
```bash
# Check for vulnerabilities
cd backend && npm audit
cd frontend && npm audit

# Fix non-breaking vulnerabilities
cd backend && npm audit fix
cd frontend && npm audit fix
```

### Dev Dependency Vulnerabilities
Some vulnerabilities may appear in development dependencies (like Prisma tooling, testing libraries):
- These do NOT affect production runtime security
- Evaluate if updates are available
- Consider if the risk justifies breaking changes

---

## Compliance Notes

### Data Storage
- User passwords: Hashed with bcrypt (never stored in plaintext)
- Access tokens: Stored in browser localStorage (encrypted in transit)
- Refresh tokens: Stored in httpOnly cookies (more secure)
- Personal data: Stored in PostgreSQL with connection encryption

### GDPR Considerations
If operating in EU/EEA:
- Implement user data export functionality
- Implement user account deletion (cascade already configured in Prisma)
- Add cookie consent banners if using analytics
- Document data retention policies

---

## Contact

For security concerns, please contact the project maintainers directly rather than opening public issues.
