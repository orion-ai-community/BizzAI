# Changelog

All notable changes to BizzAI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-18

### Added

#### Authentication & Security
- Automatic token expiration handling with professional notification
- Session timeout set to 24 hours (similar to Vyapar app)
- Automatic redirect to login page when session expires
- Clear localStorage on token expiration to prevent state leakage
- Centralized axios interceptor for 401 error handling

#### UI/UX Improvements
- Dark mode print fix for all invoices and printable documents
- Comprehensive `@media print` styles to ensure white backgrounds
- Print-specific color adjustments using `-webkit-print-color-adjust`
- Professional invoice printing in both light and dark modes
- Preserved status badge colors in print output

#### Documentation
- Added `CODE_OF_CONDUCT.md` - Contributor Covenant v2.0
- Added `CONTRIBUTING.md` - Comprehensive contribution guidelines
- Added `SECURITY.md` - Security policy and vulnerability reporting
- Added `.env.example` files for backend and frontend
- Added `CHANGELOG.md` - Version history tracking

#### Infrastructure
- Health check endpoints (`/api/health`, `/api/health/ready`, `/api/health/live`)
- Sentry integration for error tracking (frontend + backend)
- Winston logging with file rotation
- MongoDB backup and restore scripts
- Deployment verification scripts
- Security runtime verification

### Changed

- Updated all Redux slices to use centralized api instance (12 files)
- Updated all components to use api instance with interceptors (3 files)
- Updated all pages to use api instance (18 files)
- Improved error handling across the application
- Enhanced print styles for better cross-browser compatibility

### Fixed

- Dark border/background issue in printed invoices when in dark mode
- Network error messages on token expiration
- Database loading failures due to expired tokens
- Import path errors in `dueService.js`
- Duplicate `@page` rule in print styles

### Security

- JWT token expiration properly handled
- Session data cleared on logout
- Return page draft cleared to prevent state leakage
- All API calls now use interceptor with automatic auth error handling

## [1.0.0] - 2025-12-XX

### Added

- Initial release of BizzAI
- Point of Sale (POS) system
- Inventory management
- Customer management
- Sales invoicing
- Payment tracking
- Reports and analytics
- Dark mode support
- Docker containerization
- CI/CD with GitHub Actions

---

## Version History

- **2.0.0** - Production-ready release with enhanced security and UX
- **1.0.0** - Initial release

## Upgrade Guide

### From 1.0.0 to 2.0.0

1. **Update Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Update Environment Variables**
   - Copy `.env.example` to `.env`
   - Update `JWT_SECRET` and `JWT_REFRESH_SECRET` (minimum 32 characters)
   - Configure Sentry DSN if using error tracking

3. **Database Migration**
   ```bash
   cd backend
   npm run indexes:create
   ```

4. **Verify Deployment**
   ```bash
   ./scripts/verify-deployment.sh
   ```

5. **Test Print Functionality**
   - Test invoice printing in both light and dark modes
   - Verify white backgrounds in print preview

## Support

For questions or issues, please:
- Open an issue on [GitHub](https://github.com/orion-ai-community/BizzAI/issues)
- Email: shingadekartik1@gmail.com

---

**Note:** This changelog follows semantic versioning. Breaking changes will always be in major versions.
