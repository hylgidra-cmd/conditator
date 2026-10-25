#!/bin/sh
# Zaxira nusxani tekshirish: nusxa VAQTINCHALIK alohida bazaga tiklanadi, jadvallardagi qatorlar
# soni ishlab turgan baza bilan solishtiriladi, keyin vaqtinchalik baza o'chiriladi.
# Ishlab turgan bazaga tegilmaydi. Ishlatish:
#   ./deploy/dc run --rm restore /scripts/restore-check.sh            # eng yangi nusxa
#   ./deploy/dc run --rm restore /scripts/restore-check.sh db-....dump
set -eu
export PGOPTIONS='-c client_min_messages=warning'
FILE="${1:-$(ls -1t /backups/db-*.dump 2>/dev/null | head -n1 | xargs -r basename)}"
[ -n "$FILE" ] || { echo "XATO: /backups da zaxira yo'q" >&2; exit 1; }
CHECK_DB=jumis_restore_check

psql -q -d postgres -c "DROP DATABASE IF EXISTS $CHECK_DB" -c "CREATE DATABASE $CHECK_DB"
trap 'psql -q -d postgres -c "DROP DATABASE IF EXISTS $CHECK_DB"' EXIT

pg_restore --no-owner --exit-on-error --dbname="$CHECK_DB" "/backups/$FILE"

echo "Nusxa: $FILE"
printf '%-10s %10s %10s\n' jadval nusxada hozir
for table in User Cv Company Vacancy Match AiLog AdminLog; do
  restored=$(psql -At -d "$CHECK_DB" -c "SELECT count(*) FROM \"$table\"")
  live=$(psql -At -c "SELECT count(*) FROM \"$table\"")
  printf '%-10s %10s %10s\n' "$table" "$restored" "$live"
done
echo "OK: nusxa tiklanadi. (Nusxadan keyin qo'shilgan yozuvlar sababli 'hozir' kattaroq bo'lishi normal.)"
