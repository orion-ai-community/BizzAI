#!/bin/bash

###############################################################################
# Production Deployment Verification
# Run this AFTER deployment to verify all security features are active
###############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND_URL="${1:-http://localhost:5000}"
FAILURES=0

echo -e "${GREEN}🔒 Production Deployment Verification${NC}"
echo -e "Testing: $BACKEND_URL\n"

# Test 1: Health Check
echo -e "${YELLOW}[1/8] Health Check Endpoint${NC}"
HEALTH=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health" | tail -1)
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Health check responding${NC}\n"
else
    echo -e "${RED}❌ Health check failed (HTTP $HEALTH)${NC}\n"
    ((FAILURES++))
fi

# Test 2: Security Headers
echo -e "${YELLOW}[2/8] Security Headers${NC}"
HEADERS=$(curl -sI "$BACKEND_URL/api/health")
if echo "$HEADERS" | grep -qi "x-frame-options"; then
    echo -e "${GREEN}✅ X-Frame-Options present${NC}"
else
    echo -e "${RED}❌ X-Frame-Options missing${NC}"
    ((FAILURES++))
fi
if echo "$HEADERS" | grep -qi "x-content-type-options"; then
    echo -e "${GREEN}✅ X-Content-Type-Options present${NC}"
else
    echo -e "${RED}❌ X-Content-Type-Options missing${NC}"
    ((FAILURES++))
fi
echo ""

# Test 3: Request ID
echo -e "${YELLOW}[3/8] Request ID Tracing${NC}"
if echo "$HEADERS" | grep -qi "x-request-id"; then
    echo -e "${GREEN}✅ X-Request-ID header present${NC}\n"
else
    echo -e "${RED}❌ X-Request-ID header missing${NC}\n"
    ((FAILURES++))
fi

# Test 4: Rate Limiting
echo -e "${YELLOW}[4/8] Rate Limiting (6 rapid requests)${NC}"
RATE_LIMITED=false
for i in {1..6}; do
    STATUS=$(curl -s -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"test"}' \
        -o /dev/null)
    if [ "$STATUS" = "429" ]; then
        RATE_LIMITED=true
        break
    fi
done
if [ "$RATE_LIMITED" = true ]; then
    echo -e "${GREEN}✅ Rate limiting active (429 returned)${NC}\n"
else
    echo -e "${YELLOW}⚠️  Rate limiting not triggered (may need more requests)${NC}\n"
fi

# Test 5: CORS
echo -e "${YELLOW}[5/8] CORS Configuration${NC}"
CORS=$(curl -sI -H "Origin: http://evil.com" "$BACKEND_URL/api/health" | grep -i "access-control")
if [ -n "$CORS" ]; then
    echo -e "${GREEN}✅ CORS headers present${NC}\n"
else
    echo -e "${RED}❌ CORS headers missing${NC}\n"
    ((FAILURES++))
fi

# Test 6: Error Handling (No Stack Trace)
echo -e "${YELLOW}[6/8] Error Handling (Stack Trace Check)${NC}"
ERROR_RESPONSE=$(curl -s "$BACKEND_URL/api/invalid-endpoint")
if echo "$ERROR_RESPONSE" | grep -qi "stack"; then
    echo -e "${RED}❌ Stack trace exposed in error response${NC}\n"
    ((FAILURES++))
else
    echo -e "${GREEN}✅ No stack trace in error response${NC}\n"
fi

# Test 7: Readiness Check
echo -e "${YELLOW}[7/8] Readiness Check (Database)${NC}"
READY=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health/ready" | tail -1)
if [ "$READY" = "200" ]; then
    echo -e "${GREEN}✅ Application ready (database connected)${NC}\n"
else
    echo -e "${RED}❌ Application not ready (HTTP $READY)${NC}\n"
    ((FAILURES++))
fi

# Test 8: Environment Check
echo -e "${YELLOW}[8/8] Environment Configuration${NC}"
if [ "$NODE_ENV" = "production" ]; then
    echo -e "${GREEN}✅ NODE_ENV=production${NC}\n"
else
    echo -e "${YELLOW}⚠️  NODE_ENV not set to production (current: ${NODE_ENV:-not set})${NC}\n"
fi

# Summary
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    echo -e "${GREEN}🚀 Application is production-ready${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILURES check(s) failed${NC}"
    echo -e "${RED}⚠️  Review failures before serving production traffic${NC}"
    exit 1
fi
