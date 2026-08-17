#!/bin/bash
# Backup Cleanup Script for AI Marketer
# Removes old backups beyond retention period

set -e

# Configuration
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)"
RETENTION_DAYS=${1:-14}
MINIO_CLEANUP=${2:-}
REDIS_CLEANUP=${3:-}

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup cleanup (retention: ${RETENTION_DAYS} days)..."

# Cleanup PostgreSQL backups (sql dump files)
if [ -d "${BACKUP_DIR}" ]; then
    find "${BACKUP_DIR}" -name "ai_marketer_db_*.sql" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null && {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up PostgreSQL backups older than ${RETENTION_DAYS} days"
    }
    
    find "${BACKUP_DIR}" -name "minio_backup_*.json" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null && {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up MinIO metadata files older than ${RETENTION_DAYS} days"
    }
    
    find "${BACKUP_DIR}" -name "redis_backup_*.json" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null && {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up Redis metadata files older than ${RETENTION_DAYS} days"
    }
fi

# MinIO-specific cleanup
if [ "${MINIO_CLEANUP}" = "--minio" ]; then
    find "${BACKUP_DIR}" -name "minio_*" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null && {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up MinIO backup directories older than ${RETENTION_DAYS} days"
    }
fi

# Redis-specific cleanup
if [ "${REDIS_CLEANUP}" = "--redis" ]; then
    find "${BACKUP_DIR}" -name "redis_data_*" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null && {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up Redis backup directories older than ${RETENTION_DAYS} days"
    }
fi

# Report total backup count
SQL_COUNT=$(find "${BACKUP_DIR}" -name "ai_marketer_db_*.sql" -type f 2>/dev/null | wc -l)
MINIO_COUNT=$(find "${BACKUP_DIR}" -name "minio_backup_*.json" -type f 2>/dev/null | wc -l)
REDIS_COUNT=$(find "${BACKUP_DIR}" -name "redis_backup_*.json" -type f 2>/dev/null | wc -l)

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup cleanup completed"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Summary: ${SQL_COUNT} PostgreSQL backups, ${MINIO_COUNT} MinIO metadata backups, ${REDIS_COUNT} Redis metadata backups retained"