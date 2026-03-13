#!/bin/bash
# ─── PostgreSQL Backup Script ──────────────────────────────────────────────
# Run via cron: 0 2 * * * /opt/wmp-database/scripts/backup.sh
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../.env" 2>/dev/null || true

BACKUP_DIR="${BACKUP_DIR:-/var/backups/wmp}"
DB_NAME="${DB_NAME:-warehouse}"
DB_USER="${DB_USER:-root}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "╔══════════════════════════════════════════════╗"
echo "║  WMP Database Backup                         ║"
echo "╚══════════════════════════════════════════════╝"
echo "  Database: ${DB_NAME}"
echo "  Host:     ${DB_HOST}:${DB_PORT}"
echo "  Output:   ${BACKUP_FILE}"
echo ""

# Run backup
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "${BACKUP_FILE}"

BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "  ✅ Backup complete: ${BACKUP_SIZE}"

# Clean up old backups
echo "  🗑️  Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "  ✅ Cleanup complete"

REMAINING=$(ls -1 "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | wc -l)
echo "  📁 ${REMAINING} backup(s) retained"
