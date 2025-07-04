# DukaFiti Render Deployment Guide

## Quick Setup for Render

### 1. Repository Connection
1. Connect your GitHub repository to Render
2. Choose "Web Service" as the service type

### 2. Build & Start Settings
```bash
# Build Command:
npm install && npm run build

# Start Command:
node server.js
```

### 3. Environment Variables
Set these environment variables in your Render dashboard:

```env
NODE_ENV=production
SUPABASE_URL=https://kwdzbssuovwemthmiuht.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ
DATABASE_URL=postgresql://postgres:alvinkibet@db.kwdzbssuovwemthmiuht.supabase.co:5432/postgres
VITE_SUPABASE_URL=https://kwdzbssuovwemthmiuht.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA
```

### 4. Advanced Settings
- **Runtime**: Node.js
- **Node Version**: 20
- **Root Directory**: Leave empty (use repository root)
- **Auto-Deploy**: Enable for main branch

### 5. Health Check
- **Health Check Path**: `/`
- The app will be available once deployed successfully

## Alternative Deployment Files

The repository includes:
- `render.yaml` - Infrastructure as Code for Render
- `Dockerfile` - For containerized deployments
- `server.js` - Production entry point

## Troubleshooting

### Common Issues:
1. **Build fails**: Ensure all dependencies are in `dependencies` not `devDependencies`
2. **Start command not found**: Use `node server.js` instead of `npm start`
3. **Environment variables**: Double-check all variables are set correctly
4. **Port binding**: App automatically binds to `process.env.PORT` or 5000

### Logs to Check:
- Build logs for compilation errors
- Deploy logs for runtime errors
- Application logs for runtime issues

## Manual Deploy Steps:
1. Push your code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Set build/start commands
5. Add environment variables
6. Deploy

The application will be available at your Render URL once deployment completes.