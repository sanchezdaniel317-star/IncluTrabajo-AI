# Despliegue de IncluTrabajo IA en la instancia de Oracle

IncluTrabajo IA comparte la instancia ARM (Oracle Linux 10, aarch64) con Frutii y EpicCord, aislado:

- usuario propio y Node propio: no se toca el Node de Frutii;
- base y rol propios dentro del PostgreSQL que ya corre para Frutii;
- solo escucha en `127.0.0.1:3000`; lo único expuesto es Caddy, que ya está instalado y termina el TLS;
- el servicio no puede leer `/opt/frutii` ni `/opt/epiccord`, y solo puede hablar con la propia máquina.

Costo: $0 (Oracle Always Free + DuckDNS + Let's Encrypt).

Cada bloque termina con algo que comprobar. Si no ves lo que dice, para ahí.

## 0. Antes de empezar

- La rama que vas a desplegar está en GitHub y **no** incluye `.env`, `node_modules`, `build` ni `.data`.
- Los puertos 80 y 443 ya están abiertos para Frutii (Security List de OCI y firewalld). No hay que abrir nada más.
- Crea el subdominio en [duckdns.org](https://www.duckdns.org) (por ejemplo `inclutrabajo`) y apúntalo a la misma IP pública de la instancia.

**Comprueba** desde tu PC:

```powershell
nslookup inclutrabajo.duckdns.org
```

Debe responder la IP de la instancia.

## 1. Conectarte

Con la misma llave y la misma IP que usas para Frutii:

```bash
ssh -i RUTA_A_TU_LLAVE opc@IP_DE_LA_INSTANCIA
```

**Comprueba:** el prompt cambia a `[opc@...]`.

## 2. Usuario aislado

```bash
sudo useradd --system --create-home --home-dir /opt/inclutrabajo --shell /sbin/nologin inclutrabajo
sudo chmod 750 /opt/inclutrabajo
sudo -u inclutrabajo test -w /opt/frutii && echo "PUEDE ESCRIBIR" || echo "no puede escribir"
```

**Comprueba:** responde `no puede escribir`.

## 3. Node 22 solo para este servicio

```bash
NODE_VERSION=$(curl -fsSL https://nodejs.org/dist/index.json | python3 -c "import json,sys;print(next(r['version'] for r in json.load(sys.stdin) if r['version'].startswith('v22.')))")
cd /tmp && curl -fsSLO "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-arm64.tar.xz"
curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt" | grep "linux-arm64.tar.xz" | sha256sum -c -
sudo mkdir -p /opt/inclutrabajo/node
sudo tar -xJf "node-${NODE_VERSION}-linux-arm64.tar.xz" -C /opt/inclutrabajo/node --strip-components=1
sudo chown -R root:root /opt/inclutrabajo/node
/opt/inclutrabajo/node/bin/node --version
```

**Comprueba:** `sha256sum` dice `OK` y la versión empieza por `v22.`.

## 4. Llave de despliegue (solo lectura, solo este repo)

```bash
sudo -H -u inclutrabajo mkdir -p /opt/inclutrabajo/.ssh
sudo -H -u inclutrabajo ssh-keygen -t ed25519 -f /opt/inclutrabajo/.ssh/deploy -N '' -C inclutrabajo-deploy
sudo -H -u inclutrabajo tee /opt/inclutrabajo/.ssh/config > /dev/null <<'EOF'
Host github-inclutrabajo
  HostName github.com
  User git
  IdentityFile /opt/inclutrabajo/.ssh/deploy
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
sudo -H -u inclutrabajo chmod 600 /opt/inclutrabajo/.ssh/config
sudo cat /opt/inclutrabajo/.ssh/deploy.pub
```

Copia la línea. En **GitHub → sanchezdaniel317-star/IncluTrabajo-AI → Settings → Deploy keys → Add deploy key**, título `oracle-inclutrabajo`, **sin** marcar *Allow write access*. Las deploy keys solo las puede agregar quien administra el repo: si no tienes ese permiso, pídeselo a Daniel o usa un fork en tu cuenta (y cambia la URL del paso 5).

```bash
sudo -H -u inclutrabajo ssh -T git@github-inclutrabajo
```

**Comprueba:** responde `Hi sanchezdaniel317-star/IncluTrabajo-AI! You've successfully authenticated`. Ese mensaje es el éxito.

## 5. Código, dependencias y compilación

```bash
sudo -H -u inclutrabajo git clone --branch rediseno-v2 git@github-inclutrabajo:sanchezdaniel317-star/IncluTrabajo-AI.git /opt/inclutrabajo/app
cd /opt/inclutrabajo/app
sudo -H -u inclutrabajo env PATH=/opt/inclutrabajo/node/bin:/usr/bin:/bin npm ci --no-audit --no-fund
sudo -H -u inclutrabajo env PATH=/opt/inclutrabajo/node/bin:/usr/bin:/bin npx react-router build
ls -la build/server/index.js
sudo -H -u inclutrabajo env PATH=/opt/inclutrabajo/node/bin:/usr/bin:/bin node -e "require('argon2').hash('x').then(()=>console.log('argon2 ok'))"
```

**Comprueba:** existe `build/server/index.js` y aparece `argon2 ok` (argon2 trae binario para ARM; Frutii ya lo usa en esta máquina). Si npm avisa de scripts de instalación sin aprobar, ejecuta `npm approve-scripts argon2 esbuild` y repite `npm ci`.

## 6. Base de datos propia en el PostgreSQL existente

La contraseña es **solo alfanumérica**: `DATABASE_URL` es una URL y los símbolos la parten (el mismo problema que documentaste en Frutii).

```bash
CLAVE=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 40)
sudo -u postgres psql <<SQL
CREATE ROLE inclutrabajo LOGIN PASSWORD '$CLAVE';
CREATE DATABASE inclutrabajo OWNER inclutrabajo ENCODING 'UTF8' TEMPLATE template0;
REVOKE ALL ON DATABASE inclutrabajo FROM PUBLIC;
SQL
echo "$CLAVE" | sudo tee /root/.inclutrabajo-db > /dev/null && sudo chmod 600 /root/.inclutrabajo-db
unset CLAVE
```

**Comprueba:** `psql` responde `CREATE ROLE` y `CREATE DATABASE`. Las líneas de `pg_hba.conf` para `127.0.0.1` ya están en `scram-sha-256` desde el montaje de Frutii; no hay que tocarlas.

## 7. Secretos

```bash
sudo mkdir -p /etc/inclutrabajo
SECRETO=$(/opt/inclutrabajo/node/bin/node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))")
sudo tee /etc/inclutrabajo/inclutrabajo.env > /dev/null <<EOF
DATABASE_URL=postgres://inclutrabajo:$(sudo cat /root/.inclutrabajo-db)@127.0.0.1:5432/inclutrabajo
SESSION_SECRET=$SECRETO
COOKIE_SECURE=1
EOF
unset SECRETO
sudo chown root:inclutrabajo /etc/inclutrabajo/inclutrabajo.env
sudo chmod 640 /etc/inclutrabajo/inclutrabajo.env
sudo ls -l /etc/inclutrabajo/inclutrabajo.env
```

**Comprueba:** `-rw-r----- 1 root inclutrabajo`.

## 8. Esquema y datos de demostración

```bash
cd /opt/inclutrabajo/app
sudo -H -u inclutrabajo bash -c 'set -a; source /etc/inclutrabajo/inclutrabajo.env; set +a; /opt/inclutrabajo/node/bin/node scripts/migrate.mjs && /opt/inclutrabajo/node/bin/node scripts/seed.mjs'
```

**Comprueba:** `Aplicadas: 001_esquema.sql` y `Demo cargada`. Para dejar la demo como nueva antes de una sustentación: el mismo comando con `scripts/seed.mjs --reset` (borra todo lo de la base de IncluTrabajo, nada de Frutii).

## 9. El servicio

```bash
sudo cp /opt/inclutrabajo/app/deploy/inclutrabajo.service /etc/systemd/system/inclutrabajo.service
sudo systemctl daemon-reload
sudo systemctl enable --now inclutrabajo
sleep 4
sudo systemctl status inclutrabajo --no-pager | head -5
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
```

**Comprueba:** `Active: active (running)` y `200`. Y que el aislamiento funciona:

```bash
sudo systemd-run --pipe --wait -p User=inclutrabajo -p InaccessiblePaths=/opt/frutii ls /opt/frutii 2>&1 | tail -1
```

Debe fallar con `Permission denied` o `No such file`.

## 10. Caddy

Agrega el bloque al final del Caddyfile **sin borrar el de Frutii**, valida y recarga:

```bash
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-$(date +%F)
cat /opt/inclutrabajo/app/deploy/Caddyfile.inclutrabajo | sudo tee -a /etc/caddy/Caddyfile > /dev/null
sudo /usr/local/bin/caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

**Comprueba** desde tu PC:

```powershell
curl.exe -I https://inclutrabajo.duckdns.org
curl.exe -I https://frutii.duckdns.org
```

Los dos deben responder por HTTPS: IncluTrabajo con `200` y Frutii igual que antes. Si `validate` falla, restaura el respaldo (`sudo cp /etc/caddy/Caddyfile.bak-FECHA /etc/caddy/Caddyfile`) antes de recargar.

## 11. Actualizar después

```bash
sudo bash /opt/inclutrabajo/app/deploy/actualizar.sh
```

Trae el código, instala, compila, aplica migraciones nuevas y reinicia. Termina mostrando `Respuesta local: 200`.

## 12. Respaldo diario de la base

```bash
sudo tee /etc/cron.daily/inclutrabajo-backup > /dev/null <<'EOF'
#!/bin/sh
mkdir -p /var/backups/inclutrabajo
sudo -u postgres pg_dump -Fc inclutrabajo > /var/backups/inclutrabajo/inclutrabajo-$(date +%F).dump
find /var/backups/inclutrabajo -name '*.dump' -mtime +14 -delete
EOF
sudo chmod 755 /etc/cron.daily/inclutrabajo-backup
sudo /etc/cron.daily/inclutrabajo-backup && sudo ls -lh /var/backups/inclutrabajo
```

**Comprueba:** aparece un archivo `.dump` de hoy. Si ya usas el `offsite-backup.sh` de Frutii, agrega ahí esta carpeta.

## Recursos que usa

Medido en local con PostgreSQL y la demo cargada: unos 100 MB de RAM después de 105 peticiones, y la portada servida en ~0,2 s (Windows x64; en ARM será parecido). El techo del servicio es 768 MB. Tu instancia tiene 24 GB, así que convive sin problema con Frutii y EpicCord.
