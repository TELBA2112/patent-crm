#!/usr/bin/env bash
set -euo pipefail

# One-command runner: starts MongoDB (Docker), backend server, and React client
# Usage: ./run-all.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
CLIENT_DIR="$ROOT_DIR/client"

echo "==> Starting MongoDB (Docker)"
cd "$SERVER_DIR"
docker-compose up -d mongodb

echo "==> Waiting for MongoDB to accept connections..."
for i in {1..20}; do
  if nc -z localhost 27017 2>/dev/null; then echo "MongoDB is up"; break; fi
  sleep 0.5
done

echo "==> Starting backend server"
nohup node "$SERVER_DIR/index.js" > "$SERVER_DIR/server.out.log" 2>&1 & echo $! > "$SERVER_DIR/server.pid"
sleep 1
echo "Backend PID: $(cat "$SERVER_DIR/server.pid")"

echo "==> Starting React client"
cd "$CLIENT_DIR"
PORT=3001 nohup npm start > "$CLIENT_DIR/client.out.log" 2>&1 & echo $! > "$CLIENT_DIR/client.pid"
sleep 1
echo "Client PID: $(cat "$CLIENT_DIR/client.pid")"

echo "\nAll services started."
echo "API:    http://localhost:5000"
echo "Client: http://localhost:3001"
