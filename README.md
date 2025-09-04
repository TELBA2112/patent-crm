# Patent Application

This is the Patent Application project.

## Project Structure

- `/client`: Frontend React application
- `/server`: Backend Node.js API
- `/deploy`: Deployment configurations and guides

## Deployment

Several deployment options are available:

1. See `/deploy/free_deployment_guide.md` for instructions on deploying to free hosting services.
2. For AWS EC2 deployment, consult with a system administrator to set up the server properly.

## Environment Variables

The server requires the following environment variables:

- `MONGO_URI`: MongoDB connection string

## Getting Started Locally

### Server

```bash
cd server
npm install
# Create a .env file with the required environment variables
node index.js
```

### Client

```bash
cd client
npm install
npm start
```
