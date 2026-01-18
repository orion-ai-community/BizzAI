# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to our security team:

**Primary Contact:** shingadekartik1@gmail.com  
**CC:** nalekunal343@gmail.com, tusharminche@gmail.com

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-90 days

## Security Best Practices

### For Developers

1. **Never commit sensitive data** (.env files, API keys, passwords)
2. **Use environment variables** for all configuration
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Follow secure coding practices** - Input validation, output encoding
5. **Use HTTPS** in production environments
6. **Implement proper authentication** - JWT tokens, secure sessions
7. **Enable security headers** - Helmet.js is already configured
8. **Rate limiting** - Already implemented for API endpoints

### For Deployers

1. **Change all default secrets** in production
2. **Use strong passwords** (minimum 32 characters for secrets)
3. **Enable firewall rules** - Only expose necessary ports
4. **Regular backups** - Use provided backup scripts
5. **Monitor logs** - Check for suspicious activity
6. **Keep system updated** - OS, Node.js, MongoDB
7. **Use SSL/TLS certificates** - Let's Encrypt or commercial
8. **Implement intrusion detection** - Consider fail2ban or similar

## Security Features

BizzAI includes the following security features:

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt with salt
- ✅ **Rate Limiting** - Prevent brute force attacks
- ✅ **CORS Protection** - Configured origins
- ✅ **Helmet.js** - Security headers
- ✅ **MongoDB Sanitization** - Prevent NoSQL injection
- ✅ **Input Validation** - Express-validator
- ✅ **XSS Protection** - Output encoding
- ✅ **Session Management** - 24-hour token expiration
- ✅ **Error Tracking** - Sentry integration

## Vulnerability Disclosure Policy

We follow a **responsible disclosure** policy:

1. **Report** the vulnerability privately to our security team
2. **Allow time** for us to investigate and fix the issue
3. **Coordinate** public disclosure timing with our team
4. **Credit** will be given to security researchers who follow this policy

## Security Updates

Security updates will be released as:

- **Patch releases** (2.0.x) for minor security fixes
- **Minor releases** (2.x.0) for moderate security improvements
- **Major releases** (x.0.0) for significant security overhauls

All security updates will be documented in [CHANGELOG.md](CHANGELOG.md).

## Contact

For security-related questions or concerns:

- **Email:** shingadekartik1@gmail.com
- **GitHub:** [@orion-ai-community](https://github.com/orion-ai-community)

---

**Last Updated:** January 18, 2026
