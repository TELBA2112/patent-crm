# Deploying to Netlify (Free)

Netlify offers a generous free tier that is perfect for hosting your Patent application.

## Preparing the Frontend

1. Create a `netlify.toml` file in your project root:

```bash
cat > "/home/abdunodir/Patent syat/netlify.toml" << ENDFILE
[build]
  base = "client/"
  publish = "build/"
  command = "npm install && npm run build"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-url.herokuapp.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
ENDFILE
```

2. Make sure the client/public/_redirects file exists:

```bash
mkdir -p "/home/abdunodir/Patent syat/client/public"
cat > "/home/abdunodir/Patent syat/client/public/_redirects" << ENDFILE
/api/* https://your-backend-url.herokuapp.com/api/:splat 200
/* /index.html 200
ENDFILE
```

## Deploying the Frontend to Netlify

1. Sign up for a free account at [Netlify](https://www.netlify.com/)

2. Install the Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Deploy your site:
```bash
cd "/home/abdunodir/Patent syat"
netlify deploy
```

4. Follow the CLI prompts to create a new site

5. When ready for production:
```bash
netlify deploy --prod
```

## Deploying the Backend to Railway or Render

Both Railway and Render offer free options for hosting your Node.js backend:

### Railway (Free option)

1. Create an account at [Railway](https://railway.app/)
2. Install the Railway CLI:
```bash
npm i -g @railway/cli
```
3. Login to Railway:
```bash
railway login
```
4. Navigate to your server folder and initialize:
```bash
cd "/home/abdunodir/Patent syat/server"
railway init
```
5. Deploy:
```bash
railway up
```
6. Add your MongoDB connection string as an environment variable in the Railway dashboard

### Render (Free option)

1. Create an account at [Render](https://render.com/)
2. Create a new Web Service and connect to your GitHub repository
3. Configure the service:
   - Name: patent-api
   - Build Command: npm install
   - Start Command: node index.js
4. Add your MongoDB connection string as an environment variable

## Connecting Frontend to Backend

Once your backend is deployed, get its URL and update the frontend configuration:

1. Update the `netlify.toml` file with your backend URL:
```bash
sed -i 's|https://your-backend-url.herokuapp.com|https://your-actual-backend-url.render.com|g' "/home/abdunodir/Patent syat/netlify.toml"
```

2. Update the `_redirects` file:
```bash
sed -i 's|https://your-backend-url.herokuapp.com|https://your-actual-backend-url.render.com|g' "/home/abdunodir/Patent syat/client/public/_redirects"
```

3. Redeploy your frontend:
```bash
cd "/home/abdunodir/Patent syat"
netlify deploy --prod
```

## Using Your Custom Domain

1. In the Netlify dashboard, go to "Domain Management"
2. Click "Add custom domain" and enter your domain (work-intellium.uz)
3. Follow Netlify's instructions to update your DNS records

## Cost: $0.00/month

This deployment setup allows you to run your application completely free:
- Netlify: Free tier for frontend hosting
- Railway/Render: Free tier for backend hosting
- MongoDB Atlas: Free tier for database
