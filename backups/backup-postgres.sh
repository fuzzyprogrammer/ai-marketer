#!/bin/bash
# PostgreSQL Backup Script for AI Marketer
# Backs up the ai_marketer database to the backups directory

set -e

# Configuration
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ai_marketer_db_${TIMESTAMP}.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting PostgreSQL backup..."

# Get the container name
CONTAINER_NAME="ai-marketer-postgres"

# Check if container is running
if ! docker ps --filter "name=${CONTAINER_NAME}" --format '{{.Names}}' | grep -q "${CONTAINER_NAME}"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: PostgreSQL container not running"
    exit 1
fi

# Create pg_dump output file
BACKUP_DIR_ABS="$(cd "${BACKUP_DIR}" && pwd)"

# Dump PostgreSQL database using docker exec and pipe directly to file
if docker exec "${CONTAINER_NAME}" pg_dump -U ai_marketer -d ai_marketer > "${BACKUP_DIR_ABS}/ai_marketer_db_${TIMESTAMP}.sql" 2>/dev/null; then
    # Verify the backup file was created and has content
    if [ -f "${BACKUP_DIR_ABS}/ai_marketer_db_${TIMESTAMP}.sql" ] && [ -s "${BACKUP_DIR_ABS}/ai_marketer_db_${TIMESTAMP}.sql" ]; then
        BACKUP_SIZE=$(du -h "${BACKUP_DIR_ABS}/ai_marketer_db_${TIMESTAMP}.sql" | cut -f1)
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] PostgreSQL backup completed: ${BACKUP_SIZE}"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Backup file is empty"
        rm -f "${BACKUP_DIR_ABS}/ai_marketer_db_${TIMESTAMP}.sql"
        exit 1
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: pg_dump failed"
    rm -f "${BACKUP_DIR_ABS}/ai_marketer_db_${TIMESTAMP}.sql"
    exit 1
fi

# Run cleanup of old backups
if [ -f "${BACKUP_DIR}/../cleanup-backups.sh" ]; then
    bash "${BACKUP_DIR}/../cleanup-backups.sh" "${RETENTION_DAYS}"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] PostgreSQL backup finished successfully"