#!/bin/bash

###############################################################################
# Pre-deployment Verification Script
# Runs all checks before production deployment
###############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔍 Running pre-deployment verification...${NC}\n"

# Track failures
FAILURES=0

# Function to check and report
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ((FAILURES++))
    fi
}

# 1. Check environment files exist
echo -e "${YELLOW}Checking environment configuration...${NC}"
test -f backend/.env
check "Backend .env file exists"

test -f frontend/.env
check "Frontend .env file exists"

# 2. Check required environment variables (backend)
if [ -f backend/.env ]; then
    source backend/.env
    
    [ ! -z "$MONGO_URI" ]
    check "MONGO_URI is set"
    
    [ ! -z "$JWT_SECRET" ]
    check "JWT_SECRET is set"
    
    [ ${#JWT_SECRET} -ge 32 ]
    check "JWT_SECRET is strong (32+ characters)"
    
    [ ! -z "$JWT_REFRESH_SECRET" ]
    check "JWT_REFRESH_SECRET is set"
    
    [ ! -z "$NODE_ENV" ]
    check "NODE_ENV is set"
    
    [ "$NODE_ENV" = "production" ]
    check "NODE_ENV is set to production"
fi

# 3. Check Node.js version
echo -e "\n${YELLOW}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ $NODE_VERSION -ge 18 ]
check "Node.js version >= 18"

# 4. Check dependencies installed
echo -e "\n${YELLOW}Checking dependencies...${NC}"
test -d backend/node_modules
check "Backend dependencies installed"

test -d frontend/node_modules
check "Frontend dependencies installed"

# 5. Run backend tests
echo -e "\n${YELLOW}Running backend tests...${NC}"
cd backend
npm test > /dev/null 2>&1
check "Backend tests pass"
cd ..

# 6. Run frontend tests
echo -e "\n${YELLOW}Running frontend tests...${NC}"
cd frontend
npm test > /dev/null 2>&1
check "Frontend tests pass"
cd ..

# 7. Check for security vulnerabilities
echo -e "\n${YELLOW}Checking for security vulnerabilities...${NC}"
cd backend
npm audit --audit-level=high > /dev/null 2>&1
check "Backend has no high/critical vulnerabilities"
cd ..

cd frontend
npm audit --audit-level=high > /dev/null 2>&1
check "Frontend has no high/critical vulnerabilities"
cd ..

# 8. Check Docker
echo -e "\n${YELLOW}Checking Docker...${NC}"
docker --version > /dev/null 2>&1
check "Docker is installed"

docker-compose --version > /dev/null 2>&1
check "Docker Compose is installed"

# 9. Check SSL certificate (if path provided)
if [ ! -z "$SSL_CERT_PATH" ]; then
    echo -e "\n${YELLOW}Checking SSL certificate...${NC}"
    test -f "$SSL_CERT_PATH"
    check "SSL certificate exists"
    
    openssl x509 -in "$SSL_CERT_PATH" -noout -checkend 2592000 > /dev/null 2>&1
    check "SSL certificate valid for 30+ days"
fi

# 10. Check backup script
echo -e "\n${YELLOW}Checking backup configuration...${NC}"
test -x scripts/backup-mongodb.sh
check "Backup script is executable"

test -x scripts/restore-mongodb.sh
check "Restore script is executable"

# Summary
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    echo -e "${GREEN}🚀 Run: docker-compose -f docker-compose.prod.yml up -d${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILURES check(s) failed. Please fix before deploying.${NC}"
    exit 1
fi
