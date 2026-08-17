#!/bin/bash
# Redis Backup Script for AI Marketer
# Backs up Redis data to the backups directory

set -e

# Configuration
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}

# Redis container name from docker-compose
REDIS_CONTAINER="ai-marketer-redis"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Redis backup..."

# Check if container is running
if ! docker ps --filter "name=${REDIS_CONTAINER}" --format '{{.Names}}' | grep -q "${REDIS_CONTAINER}"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: Redis container not running, skipping backup"
    # Create minimal metadata file
    BACKUP_DIR_ABS="$(cd "${BACKUP_DIR}" && pwd)"
    mkdir -p "${BACKUP_DIR_ABS}"
    echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"status\":\"container_not_running\",\"skipped_reason\":\"redis_container_down\"}" > "${BACKUP_DIR_ABS}/redis_backup_${TIMESTAMP}.json"
    exit 0
fi

# Backup Redis data using redis-cli SAVE command to create RDB snapshot
BACKUP_DIR_ABS="$(cd "${BACKUP_DIR}" && pwd)"
REDIS_BACKUP_FILE="${BACKUP_DIR_ABS}/redis_data_${TIMESTAMP}.rdb"

# Create RDB snapshot inside the container
if docker exec "${REDIS_CONTAINER}" redis-cli SAVE 2>/dev/null; then
    # Copy the RDB file from container to host
    if docker cp "${REDIS_CONTAINER}:/dump.rdb" "${REDIS_BACKUP_FILE}" 2>/dev/null; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis RDB snapshot backed up: ${REDIS_BACKUP_FILE}"
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: Could not copy RDB file from container"
        # Create metadata file indicating partial backup
        echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"status\":\"partial\",\"skipped_reason\":\"could_not_copy_rdb\"}" > "${BACKUP_DIR_ABS}/redis_backup_${TIMESTAMP}.json"
        exit 1
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: Could not create Redis SAVE command"
    # Fall back to copying from volume
    VOLUME_PATH="/var/lib/docker/volumes/ai-marketer-redis_data/_data"
    if [ -d "${VOLUME_PATH}" ]; then
        cp -r "${VOLUME_PATH}/." "${BACKUP_DIR_ABS}/redis_data_${TIMESTAMP}" 2>/dev/null && {
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis data copied from Docker volume"
        }
    fi
fi

# Create backup metadata
cat > "${BACKUP_DIR_ABS}/redis_backup_${TIMESTAMP}.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "redis_container": "${REDIS_CONTAINER}",
  "backup_method": "redis-cli-SAVE-or-volume-copy",
  "backup_file": "${REDIS_BACKUP_FILE}",
  "retention_days": ${RETENTION_DAYS}
}
EOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis backup completed"

# Run cleanup of old backups
if [ -f "${BACKUP_DIR}/../cleanup-backups.sh" ]; then
    bash "${BACKUP_DIR}/../cleanup-backups.sh" "${RETENTION_DAYS}" --redis
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Redis backup finished successfully"