# Railway Deployment Guide for DukaFiti

This guide provides step-by-step instructions for deploying the DukaFiti business management platform to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **Supabase Project**: Set up Supabase database with your credentials

## Environment Variables

Set these environment variables in Railway:

```bash
# Supabase Configuration
SUPABASE_URL=https://kwdzbssuovwemthmiuht.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ
DATABASE_URL=postgresql://postgres:alvinkibet@db.kwdzbssuovwemthmiuht.supabase.co:5432/postgres

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secure-session-secret-here
```

## Deployment Steps

### 1. Connect GitHub Repository

1. Log into Railway
2. Click "New Project" 
3. Select "Deploy from GitHub repo"
4. Choose your DukaFiti repository
5. Select the main branch

### 2. Configure Build Settings

Railway will automatically detect the Node.js project and use the `nixpacks.toml` configuration:

```toml
[phases.build]
cmds = [
  "npm install",
  "npx update-browserslist-db@latest", 
  "npx vite build",
  "npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
]

[phases.start]
cmd = "node dist/index.js"

[variables]
NODE_ENV = "production"
```

### 3. Set Environment Variables

1. Go to your Railway project dashboard
2. Click on "Variables" tab
3. Add all the environment variables listed above
4. Click "Deploy" to redeploy with new variables

### 4. Health Check Configuration

The application includes a health check endpoint at `/health` that Railway uses to verify the service:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
});
```

Railway configuration in `railway.json`:
- Health check path: `/health`
- Health check timeout: 30 seconds
- Start command: `node dist/index.js`

### 5. Domain Configuration

1. Railway will provide a default domain: `your-app.railway.app`
2. To use a custom domain:
   - Go to "Settings" > "Domains"
   - Add your custom domain
   - Update DNS records as instructed

## Build Process

The build process creates:

1. **Frontend**: Vite builds the React app to `dist/public/`
2. **Backend**: esbuild bundles the Express server to `dist/index.js`

## Production Features

- **Static Asset Serving**: Express serves the built React app
- **WebSocket Support**: Real-time notifications and updates
- **Health Monitoring**: `/health` endpoint for platform health checks
- **Session Management**: Persistent user sessions with secure cookies
- **Database Integration**: Full Supabase integration for data persistence

## Troubleshooting

### Build Failures

If the build fails:

1. Check the build logs in Railway dashboard
2. Ensure all dependencies are in `package.json`
3. Verify the build commands in `nixpacks.toml`

### Health Check Failures  

If health checks fail:

1. Verify the server starts properly on port 5000
2. Check that `/health` endpoint returns 200 status
3. Ensure the server binds to `0.0.0.0` not just `localhost`

### Environment Variable Issues

1. Double-check all Supabase credentials
2. Ensure `NODE_ENV=production` is set
3. Verify `PORT` is not hardcoded in the application

## Monitoring

Railway provides:

- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Health Checks**: Automatic service monitoring
- **Deployments**: History of all deployments

## Database Setup

The application uses Supabase for data persistence. Ensure your Supabase project has:

1. All required tables created
2. Row Level Security (RLS) policies configured
3. API keys with appropriate permissions

## Support

For deployment issues:

1. Check Railway documentation
2. Review application logs
3. Verify environment variables
4. Test health check endpoint locally