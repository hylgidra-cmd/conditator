#!/bin/sh
# Serverga chiqarish va yangilash: .env.production ni tekshiradi, obrazlarni quradi,
# migratsiyalarni qo'llaydi (migrate xizmati), ilovani ishga tushiradi va sog'lig'ini tekshiradi.
set -eu
cd "$(dirname "$0")/.."

if [ ! -f .env.production ]; then
  echo "XATO: .env.production yo'q. Nusxa oling: cp .env.production.example .env.production" >&2
  exit 1
fi

# Majburiy o'zgaruvchilar bo'sh yoki namunadagidek qolmasin.
missing=""
for key in DOMAIN ACME_EMAIL APP_URL AUTH_SECRET POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB \
  SMTP_HOST SMTP_PORT SMTP_FROM ADMIN_EMAIL; do
  value=$(grep -E "^$key=" .env.production | tail -n1 | cut -d= -f2-)
  case "$value" in
    "" | *CHANGE_ME* | *dev-only*) missing="$missing $key" ;;
  esac
done
if [ -n "$missing" ]; then
  echo "XATO: .env.production da to'ldirilmagan:$missing" >&2
  exit 1
fi

./deploy/dc up -d --build --remove-orphans

echo "Ilova sog'lig'i tekshirilmoqda..."
i=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$(./deploy/dc ps -q app)" 2>/dev/null)" = "healthy" ]; do
  i=$((i + 1))
  if [ "$i" -gt 30 ]; then
    echo "XATO: ilova 5 daqiqada sog'lom bo'lmadi. Loglar: ./deploy/dc logs --tail=100 migrate app" >&2
    exit 1
  fi
  sleep 10
done
./deploy/dc ps
DOMAIN=$(grep -E '^DOMAIN=' .env.production | tail -n1 | cut -d= -f2-)
echo "Tayyor. Tekshiring: curl -fsS https://$DOMAIN/api/health"
