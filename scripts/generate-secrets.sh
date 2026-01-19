#!/bin/bash

###############################################################################
# Secret Generation Script
# Generates all required secrets for production deployment
###############################################################################

echo "🔐 Generating production secrets for BizzAI..."
echo ""

# Generate JWT Secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Generate JWT Refresh Secret
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""

# Generate Backup Passphrase
BACKUP_GPG_PASSPHRASE=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "BACKUP_GPG_PASSPHRASE=$BACKUP_GPG_PASSPHRASE"
echo ""

# Generate MongoDB Root Password
MONGO_ROOT_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "MONGO_ROOT_PASSWORD=$MONGO_ROOT_PASSWORD"
echo ""

echo "✅ All secrets generated successfully!"
echo ""
echo "⚠️  IMPORTANT: Store these secrets securely!"
echo "   - Add them to your .env files"
echo "   - Never commit them to version control"
echo "   - Use a password manager or secrets vault"
echo ""
echo "📝 Next steps:"
echo "   1. Copy these values to backend/.env"
echo "   2. Set MONGO_ROOT_PASSWORD in docker-compose.prod.yml"
echo "   3. Configure your email settings"
echo "   4. Deploy with: docker-compose -f docker-compose.prod.yml up -d"
