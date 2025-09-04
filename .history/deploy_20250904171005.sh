#!/usr/bin/env bash
set -euo pipefail

echo "==> Setting up production environment..."

# Create environment file if it doesn't exist
if [ ! -f "./server/.env" ]; then
    echo "Creating .env file in server directory"
    cat > ./server/.env << EOF
MONGO_URI=mongodb://mongodb:27017/patent-db
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=production
PORT=5000
EOF
fi

# Make sure upload directory exists
mkdir -p ./server/uploads

# Deploy using docker-compose
echo "==> Starting deployment with Docker Compose"
docker-compose -f docker-compose.prod.yml down || true
docker-compose -f docker-compose.prod.yml up --build -d

echo "==> Deployment complete!"
echo "Your application should now be available at http://your-server-ip"
echo ""
echo "To view logs:"
echo "docker-compose -f docker-compose.prod.yml logs -f"
