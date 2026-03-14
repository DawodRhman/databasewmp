res#!/bin/bash
# ─── PostgreSQL Restore Script ────────────────────────────────────────────
# Usage: ./scripts/restore.sh <backup_file>
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../.env" 2>/dev/null || true

DB_NAME="${DB_NAME:-warehouse}"
DB_USER="${DB_USER:-root}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  BACKUP_DIR="${BACKUP_DIR:-/var/backups/wmp}"
  ls -lht "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "  No backups found in ${BACKUP_DIR}"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "╔══════════════════════════════════════════════╗"
echo "║  WMP Database Restore                        ║"
echo "╚══════════════════════════════════════════════╝"
echo "  Database: ${DB_NAME}"
echo "  Host:     ${DB_HOST}:${DB_PORT}"
echo "  Source:   ${BACKUP_FILE}"
echo ""
echo "  ⚠️  WARNING: This will OVERWRITE the current database!"
echo ""

read -p "  Are you sure? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "  ❌ Restore cancelled"
  exit 0
fi

echo "  Restoring..."
gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --set ON_ERROR_STOP=off \
  -q

echo "  ✅ Restore complete"
