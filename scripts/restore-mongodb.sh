#!/bin/bash

###############################################################################
# MongoDB Restore Script
# 
# This script restores MongoDB database from encrypted backup
# Usage: ./restore-mongodb.sh <backup-file>
###############################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Backup file not specified${NC}"
    echo "Usage: $0 <backup-file>"
    exit 1
fi

BACKUP_FILE="$1"
MONGO_URI="${MONGO_URI}"
GPG_PASSPHRASE="${BACKUP_GPG_PASSPHRASE}"

echo -e "${GREEN}🔄 Starting MongoDB restore...${NC}"

# Validate environment variables
if [ -z "$MONGO_URI" ]; then
    echo -e "${RED}❌ Error: MONGO_URI environment variable is not set${NC}"
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Create temporary directory for restore
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Decrypt backup if it's encrypted
if [[ "$BACKUP_FILE" == *.gpg ]]; then
    if [ -z "$GPG_PASSPHRASE" ]; then
        echo -e "${RED}❌ Error: BACKUP_GPG_PASSPHRASE not set for encrypted backup${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}🔓 Decrypting backup...${NC}"
    echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 --decrypt "$BACKUP_FILE" > "$TEMP_DIR/backup.tar.gz"
    ARCHIVE_FILE="$TEMP_DIR/backup.tar.gz"
else
    ARCHIVE_FILE="$BACKUP_FILE"
fi

# Extract archive
echo -e "${YELLOW}📦 Extracting archive...${NC}"
tar -xzf "$ARCHIVE_FILE" -C "$TEMP_DIR"

# Find the backup directory
BACKUP_DIR=$(find "$TEMP_DIR" -type d -name "bizzai_backup_*" | head -n 1)

if [ -z "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Error: Could not find backup directory in archive${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
echo -e "   MongoDB URI: ${MONGO_URI%%@*}@***"
echo -e "   Backup: $BACKUP_FILE"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    exit 0
fi

# Perform mongorestore
echo -e "${YELLOW}🔄 Restoring database...${NC}"
mongorestore --uri="$MONGO_URI" --gzip --drop "$BACKUP_DIR"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Restore failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database restored successfully${NC}"
echo -e "${YELLOW}⚠️  Remember to restart your application if it's running${NC}"
