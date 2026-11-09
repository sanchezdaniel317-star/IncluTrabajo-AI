#!/usr/bin/env bash
# Actualiza IncluTrabajo IA en la instancia: trae el código, instala, compila, migra y reinicia.
# Uso (como opc):  sudo /opt/inclutrabajo/app/deploy/actualizar.sh
set -euo pipefail

APP=/opt/inclutrabajo/app
NODE=/opt/inclutrabajo/node/bin
COMO="sudo -H -u inclutrabajo env PATH=$NODE:/usr/bin:/bin"

echo "1/5 Código"
$COMO git -C "$APP" pull --ff-only

echo "2/5 Dependencias"
$COMO bash -c "cd $APP && npm ci --no-audit --no-fund"

echo "3/5 Compilación"
$COMO bash -c "cd $APP && npx react-router build"

echo "4/5 Migraciones"
sudo -H -u inclutrabajo bash -c "set -a; source /etc/inclutrabajo/inclutrabajo.env; set +a; cd $APP && $NODE/node scripts/migrate.mjs"

echo "5/5 Reinicio"
systemctl restart inclutrabajo
sleep 3
systemctl --no-pager --lines=0 status inclutrabajo | head -3
curl -fsS -o /dev/null -w "Respuesta local: %{http_code}\n" http://127.0.0.1:3000/
