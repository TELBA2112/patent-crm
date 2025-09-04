#!/bin/bash

# Prepare Patent Application for deployment
echo "Preparing Patent Application for deployment..."

# Set base directory explicitly
BASE_DIR="/home/abdunodir/Patent syat"
cd "$BASE_DIR"

# Create client redirects file for static hosting
echo "Creating client redirects configuration..."
mkdir -p "$BASE_DIR/client/public"
cat > "$BASE_DIR/client/public/_redirects" << ENDFILE
/api/* https://api-url-will-be-replaced/api/:splat 200
/* /index.html 200
ENDFILE

# Create a Procfile for Heroku and similar platforms
echo "Creating Procfile for PaaS platforms..."
cat > "$BASE_DIR/Procfile" << ENDFILE
web: cd server && node index.js
ENDFILE

# Create .env.example files
echo "Creating environment variable templates..."
cat > "$BASE_DIR/server/.env.example" << ENDFILE
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
PORT=5000
ENDFILE

echo "Creating README file with deployment instructions..."
cat > "$BASE_DIR/README.md" << ENDFILE
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
node index.js
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
