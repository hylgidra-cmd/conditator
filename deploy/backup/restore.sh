#!/bin/sh
# Tiklash: bazani (va ixtiyoriy logolarni) zaxira nusxadan qaytaradi. MAVJUD MA'LUMOT O'CHADI.
# Ishlatish (serverda, app to'xtatilgan holda — README "Tiklash"):
#   ./deploy/dc run --rm restore /scripts/restore.sh db-YYYYMMDD-HHMMSS.dump [uploads-YYYYMMDD-HHMMSS.tar.gz]
set -eu
DB_FILE="/backups/${1:?zaxira fayl nomi kerak, masalan db-20261025-220000.dump}"
UPLOADS_FILE="${2:-}"

[ -f "$DB_FILE" ] || { echo "XATO: $DB_FILE topilmadi" >&2; exit 1; }
pg_restore --list "$DB_FILE" > /dev/null

echo "Baza tiklanmoqda: $DB_FILE"
pg_restore --clean --if-exists --no-owner --single-transaction --dbname="$PGDATABASE" "$DB_FILE"

if [ -n "$UPLOADS_FILE" ]; then
  [ -f "/backups/$UPLOADS_FILE" ] || { echo "XATO: /backups/$UPLOADS_FILE topilmadi" >&2; exit 1; }
  echo "Logolar tiklanmoqda: $UPLOADS_FILE"
  find /uploads -mindepth 1 -delete
  tar -xzf "/backups/$UPLOADS_FILE" -C /uploads
  # Ilova konteyneri "app" foydalanuvchisi (uid 1001, Dockerfile) sifatida yozadi.
  chown -R 1001:1001 /uploads
fi

psql -Atc 'SELECT count(*) FROM "User"' | sed 's/^/foydalanuvchilar: /'
echo "Tiklandi."
