#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"

echo "==> Starting MongoDB (Docker)"
cd "$SERVER_DIR"
mkdir -p uploads
if command -v docker &>/dev/null; then
  if [ -f docker-compose.yml ]; then
    # Try compose v2 then v1; ignore container-name conflicts
    docker compose up -d mongodb 2>/tmp/compose.err || docker-compose up -d mongodb 2>/tmp/compose.err || true
    if grep -q 'is already in use by container' /tmp/compose.err 2>/dev/null; then
      echo "⚠️ mongodb konteyner allaqachon ishlayapti; davom etamiz"
    fi
  else
    echo "docker-compose.yml topilmadi, lokal MongoDB ishlatiladi (mongodb://localhost:27017)"
  fi
else
  echo "Docker topilmadi, lokal MongoDB ishlatiladi (mongodb://localhost:27017)"
fi

echo "==> Waiting for MongoDB to accept connections..."
for i in {1..40}; do
  if nc -z localhost 27017 2>/dev/null; then echo "MongoDB is up"; break; fi
  sleep 0.5
done

echo "==> Installing backend dependencies"
cd "$SERVER_DIR"
npm ci || npm install

echo "==> Starting backend server"
if [ -f server.pid ] && kill -0 "$(cat server.pid)" 2>/dev/null; then
  echo "Backend already running with PID $(cat server.pid)";
else
  nohup npm start > "$SERVER_DIR/server.out.log" 2>&1 & echo $! > "$SERVER_DIR/server.pid"
  sleep 1
  echo "Backend PID: $(cat "$SERVER_DIR/server.pid")"
fi

if [ -d "$CLIENT_DIR" ]; then
  echo "==> Installing client dependencies"
  cd "$CLIENT_DIR"
  npm ci || npm install

  echo "==> Starting React client on PORT=3001"
  if [ -f client.pid ] && kill -0 "$(cat client.pid)" 2>/dev/null; then
    echo "Client already running with PID $(cat client.pid)";
  else
    PORT=3001 nohup npm start > "$CLIENT_DIR/client.out.log" 2>&1 & echo $! > "$CLIENT_DIR/client.pid"
    sleep 1
    echo "Client PID: $(cat "$CLIENT_DIR/client.pid")"
  fi
else
  echo "⚠️ client/ papkasi yo'q, frontend bosqichi tashlab ketildi"
fi

echo
echo "All services started."
echo "API:    http://localhost:5000 (actual port may auto-increment if 5000 busy)"
echo "Client: http://localhost:3001"
