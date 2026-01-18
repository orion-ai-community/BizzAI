#!/bin/bash

###############################################################################
# Runtime Security Verification Script
# Tests actual security enforcement at runtime
###############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔒 Runtime Security Verification${NC}\n"

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:5000}"
RESULTS_FILE="security-verification-results.txt"

# Clear previous results
> "$RESULTS_FILE"

echo "Testing against: $BACKEND_URL" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check Endpoint${NC}" | tee -a "$RESULTS_FILE"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BACKEND_URL/api/health")
echo "$HEALTH_RESPONSE" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

# Test 2: Security Headers
echo -e "${YELLOW}Test 2: Security Headers${NC}" | tee -a "$RESULTS_FILE"
curl -I -s "$BACKEND_URL/" | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

# Test 3: Rate Limiting
echo -e "${YELLOW}Test 3: Rate Limiting (6 rapid requests to auth)${NC}" | tee -a "$RESULTS_FILE"
for i in {1..6}; do
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}')
  echo "Request $i: $(echo "$RESPONSE" | grep HTTP_CODE)" | tee -a "$RESULTS_FILE"
done
echo "" | tee -a "$RESULTS_FILE"

# Test 4: Request ID Header
echo -e "${YELLOW}Test 4: Request ID in Response${NC}" | tee -a "$RESULTS_FILE"
curl -I -s "$BACKEND_URL/api/health" | grep -i "x-request-id" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

# Test 5: CORS Headers
echo -e "${YELLOW}Test 5: CORS Headers${NC}" | tee -a "$RESULTS_FILE"
curl -I -s -H "Origin: http://evil.com" "$BACKEND_URL/api/health" | grep -i "access-control" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

echo -e "${GREEN}✅ Verification complete. Results saved to: $RESULTS_FILE${NC}"
echo ""
echo "Review the results file for detailed output."
