#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Building Frontend...${NC}"

# Navigate to Frontend directory and build
cd Frontend
if ! pnpm build; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build successful!${NC}"

echo -e "${BLUE}📦 Copying build to Backend/public...${NC}"

# Remove existing files in Backend/public
rm -rf ../Backend/public/*

# Copy the exported static files to Backend/public
cp -r out/* ../Backend/public/

echo -e "${GREEN}✅ Frontend deployed to Backend/public!${NC}"

echo -e "${BLUE}🚀 You can now start the Backend server:${NC}"
echo -e "   ${GREEN}cd Backend && nodemon server.js${NC}"
echo -e "   ${GREEN}or: cd Backend && npm start${NC}"
echo ""
echo -e "${BLUE}📱 The app will be available at:${NC}"
echo -e "   ${GREEN}http://localhost:55500${NC}" 