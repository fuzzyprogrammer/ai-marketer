#!/bin/bash
# MinIO Backup Script for AI Marketer
# Backs up MinIO data directories to the backups directory

set -e

# Configuration
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}

# MinIO container name from docker-compose
MINIO_CONTAINER="ai-marketer-minio"
MINIO_DATA_VOLUME="ai-marketer-minio_data"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting MinIO backup..."

# Check if container is running
if ! docker ps --filter "name=${MINIO_CONTAINER}" --format '{{.Names}}' | grep -q "${MINIO_CONTAINER}"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: MinIO container not running, skipping backup"
    # Create minimal metadata file
    BACKUP_DIR_ABS="$(cd "${BACKUP_DIR}" && pwd)"
    mkdir -p "${BACKUP_DIR_ABS}"
    echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"status\":\"container_not_running\",\"skipped_reason\":\"minio_container_down\"}" > "${BACKUP_DIR_ABS}/minio_backup_${TIMESTAMP}.json"
    exit 0
fi

# Backup MinIO data directory from Docker volume
BACKUP_DIR_ABS="$(cd "${BACKUP_DIR}" && pwd)"
MINIO_BACKUP_DIR="${BACKUP_DIR_ABS}/minio_data_${TIMESTAMP}"
mkdir -p "${MINIO_BACKUP_DIR}"

# Copy MinIO data from Docker volume
VOLUME_PATH="/var/lib/docker/volumes/${MINIO_DATA_VOLUME}/_data"
if [ -d "${VOLUME_PATH}" ]; then
    cp -r "${VOLUME_PATH}/." "${MINIO_BACKUP_DIR}/" 2>/dev/null && {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] MinIO data copied from Docker volume: ${MINIO_BACKUP_DIR}"
    }
else
    # Alternative: try to copy from container directly
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Volume path not found, trying container copy"
    docker cp "${MINIO_CONTAINER}":/data/. "${MINIO_BACKUP_DIR}/" 2>/dev/null && {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] MinIO data copied from container: ${MINIO_BACKUP_DIR}"
    } || {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: Could not backup MinIO data"
        # Create metadata file indicating backup was skipped
        echo "{\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"status\":\"backup_failed\",\"skipped_reason\":\"could_not_copy_minio_data\"}" > "${BACKUP_DIR_ABS}/minio_backup_${TIMESTAMP}.json"
        rm -rf "${MINIO_BACKUP_DIR}"
        exit 1
    }
fi

# Create backup metadata
cat > "${BACKUP_DIR_ABS}/minio_backup_${TIMESTAMP}.json" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "backup_method": "docker-volume-copy",
  "backup_directory": "${MINIO_BACKUP_DIR}",
  "retention_days": ${RETENTION_DAYS},
  "source": "minio container data directory"
}
EOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] MinIO backup completed"

# Run cleanup of old backups
if [ -f "${BACKUP_DIR}/../cleanup-backups.sh" ]; then
    bash "${BACKUP_DIR}/../cleanup-backups.sh" "${RETENTION_DAYS}" --minio
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] MinIO backup finished successfully"