#!/bin/sh
# Zaxira nusxa: baza (pg_dump custom format) va logolar. Eskilari BACKUP_KEEP_DAYS kundan keyin o'chadi.
# backup konteynerida ishlaydi (PGHOST/PGUSER/PGPASSWORD/PGDATABASE muhitdan).
set -eu
# Nusxada barcha shaxsiy ma'lumotlar bor: fayllar faqat egasiga o'qiladi (600).
umask 077
STAMP=$(date -u +%Y%m%d-%H%M%S)
DIR=/backups
mkdir -p "$DIR"

pg_dump --format=custom --no-owner --file="$DIR/db-$STAMP.dump.part"
mv "$DIR/db-$STAMP.dump.part" "$DIR/db-$STAMP.dump"

tar -czf "$DIR/uploads-$STAMP.tar.gz.part" -C /uploads .
mv "$DIR/uploads-$STAMP.tar.gz.part" "$DIR/uploads-$STAMP.tar.gz"

# Nusxa butunligini tekshirish: pg_restore uni o'qiy olishi kerak.
pg_restore --list "$DIR/db-$STAMP.dump" > /dev/null

find "$DIR" -name 'db-*.dump' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
find "$DIR" -name 'uploads-*.tar.gz' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete

echo "zaxira tayyor: db-$STAMP.dump ($(du -h "$DIR/db-$STAMP.dump" | cut -f1)), uploads-$STAMP.tar.gz"
