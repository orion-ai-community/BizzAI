#!/bin/bash

###############################################################################
# MongoDB Backup Script
# 
# This script creates encrypted backups of MongoDB database
# Usage: ./backup-mongodb.sh
###############################################################################

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="bizzai_backup_${TIMESTAMP}"
MONGO_URI="${MONGO_URI}"
GPG_PASSPHRASE="${BACKUP_GPG_PASSPHRASE}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting MongoDB backup...${NC}"

# Validate environment variables
if [ -z "$MONGO_URI" ]; then
    echo -e "${RED}❌ Error: MONGO_URI environment variable is not set${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create temporary directory for backup
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${YELLOW}📦 Creating database dump...${NC}"

# Perform mongodump
mongodump --uri="$MONGO_URI" --out="$TEMP_DIR/$BACKUP_NAME" --gzip

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

# Create tar archive
echo -e "${YELLOW}📦 Creating archive...${NC}"
cd "$TEMP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

# Encrypt backup if GPG passphrase is provided
if [ -n "$GPG_PASSPHRASE" ]; then
    echo -e "${YELLOW}🔐 Encrypting backup...${NC}"
    echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 "${BACKUP_NAME}.tar.gz"
    BACKUP_FILE="${BACKUP_NAME}.tar.gz.gpg"
    rm "${BACKUP_NAME}.tar.gz"
else
    echo -e "${YELLOW}⚠️  Warning: Backup is not encrypted (BACKUP_GPG_PASSPHRASE not set)${NC}"
    BACKUP_FILE="${BACKUP_NAME}.tar.gz"
fi

# Move backup to backup directory
mv "$BACKUP_FILE" "$BACKUP_DIR/"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)

echo -e "${GREEN}✅ Backup completed successfully${NC}"
echo -e "   File: $BACKUP_DIR/$BACKUP_FILE"
echo -e "   Size: $BACKUP_SIZE"

# Clean up old backups
echo -e "${YELLOW}🧹 Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "bizzai_backup_*.tar.gz*" -type f -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "bizzai_backup_*.tar.gz*" -type f | wc -l)
echo -e "${GREEN}✅ Cleanup completed. Total backups: $BACKUP_COUNT${NC}"

# Optional: Upload to cloud storage (uncomment and configure)
# if [ -n "$AWS_S3_BUCKET" ]; then
#     echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
#     aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/"
#     echo -e "${GREEN}✅ Upload completed${NC}"
# fi

echo -e "${GREEN}🎉 Backup process completed successfully${NC}"
