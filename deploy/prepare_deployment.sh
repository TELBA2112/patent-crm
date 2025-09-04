#!/bin/bash

# Prepare Patent Application for deployment
echo "Preparing Patent Application for deployment..."

# Navigate to the base directory
BASE_DIR=$(dirname $(dirname $(realpath $0)))
cd $BASE_DIR

# Create client redirects file for static hosting
echo "Creating client redirects configuration..."
mkdir -p $BASE_DIR/client/public
cat > $BASE_DIR/client/public/_redirects << ENDFILE
/api/* https://api-url-will-be-replaced/api/:splat 200
/* /index.html 200
ENDFILE

# Create a Procfile for Heroku and similar platforms
echo "Creating Procfile for PaaS platforms..."
cat > $BASE_DIR/Procfile << ENDFILE
web: cd server && npm start
ENDFILE

# Make sure the server has a start script
SERVER_PACKAGE_JSON="$BASE_DIR/server/package.json"
if grep -q '"start":' "$SERVER_PACKAGE_JSON"; then
  echo "Start script already exists in server's package.json"
else
  echo "Adding start script to server's package.json"
  sed -i 's/"scripts": {/"scripts": {\n    "start": "node index.js",/g' "$SERVER_PACKAGE_JSON"
fi

# Create .env.example files
echo "Creating environment variable templates..."
cat > $BASE_DIR/server/.env.example << ENDFILE
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
PORT=5000
ENDFILE

echo "Creating README file with deployment instructions..."
cat > $BASE_DIR/README.md << ENDFILE
# Patent Application

This is the Patent Application project.

## Project Structure

- \`/client\`: Frontend React application
- \`/server\`: Backend Node.js API
- \`/deploy\`: Deployment configurations and guides

## Deployment

Several deployment options are available:

1. See \`/deploy/free_deployment_guide.md\` for instructions on deploying to free hosting services.
2. For AWS EC2 deployment, consult with a system administrator to set up the server properly.

## Environment Variables

The server requires the following environment variables:

- \`MONGO_URI\`: MongoDB connection string

## Getting Started Locally

### Server

\`\`\`bash
cd server
npm install
# Create a .env file with the required environment variables
npm start
\`\`\`

### Client

\`\`\`bash
cd client
npm install
npm start
\`\`\`
ENDFILE

echo "Application is now prepared for deployment!"
echo "See /deploy/free_deployment_guide.md for free deployment options"
