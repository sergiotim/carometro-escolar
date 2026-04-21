#!/bin/bash
# 🧪 Security Implementation Quick Test Script
# Run from project root: bash tests/security-check.sh

set -e

PROJECT_DIR=$(pwd)
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔒 Carometro Escolar - Security Implementation Tests${NC}\n"

# ==========================================
# 1. Check TypeScript Compilation
# ==========================================
echo -e "${YELLOW}[1/4] Checking TypeScript compilation...${NC}"
if npx tsc --noEmit > /dev/null 2>&1; then
  echo -e "${GREEN}✓ TypeScript compiles without errors${NC}\n"
else
  echo -e "${RED}✗ TypeScript compilation failed${NC}\n"
  exit 1
fi

# ==========================================
# 2. Check ESLint
# ==========================================
echo -e "${YELLOW}[2/4] Running ESLint...${NC}"
if npm run lint > /dev/null 2>&1; then
  echo -e "${GREEN}✓ ESLint passed${NC}\n"
else
  echo -e "${RED}✗ ESLint failed${NC}\n"
  exit 1
fi

# ==========================================
# 3. Verify File Changes
# ==========================================
echo -e "${YELLOW}[3/4] Verifying security implementations...${NC}"

files_to_check=(
  "src/lib/auth/session.ts:SECURE_COOKIES"
  "src/app/api/auth/login/route.ts:max(256)"
  "src/app/api/export-students-pdf/route.ts:SEC-002"
  "src/lib/validation/registration.ts:regex"
  "src/lib/middleware/rate-limit.ts:RateLimitResult"
  "next.config.ts:X-Content-Type-Options"
)

all_good=true
for file_check in "${files_to_check[@]}"; do
  file="${file_check%:*}"
  search="${file_check#*:}"
  
  if grep -q "$search" "$file" 2>/dev/null; then
    echo -e "${GREEN}✓ $file (contains: $search)${NC}"
  else
    echo -e "${RED}✗ $file (missing: $search)${NC}"
    all_good=false
  fi
done

if [ "$all_good" = false ]; then
  exit 1
fi
echo ""

# ==========================================
# 4. File Count Check
# ==========================================
echo -e "${YELLOW}[4/4] Checking new security files...${NC}"

required_files=(
  "src/lib/validation/registration.ts"
  "src/lib/middleware/rate-limit.ts"
  "SECURITY_TESTING.md"
  "IMPLEMENTATION_SUMMARY.md"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓ $file exists${NC}"
  else
    echo -e "${RED}✗ $file missing${NC}"
    exit 1
  fi
done

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All security implementations verified!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Review IMPLEMENTATION_SUMMARY.md for details"
echo "2. Follow SECURITY_TESTING.md for manual tests"
echo "3. Run: npm run dev (with SECURE_COOKIES=true for testing)"
echo "4. Test endpoints according to guide"
echo ""
