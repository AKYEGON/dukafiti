# DukaFiti Vercel Deployment Guide

## Vercel Environment Variables Setup

Follow these steps to configure your environment variables in the Vercel Dashboard:

### Step 1: Access Environment Variables
1. Go to **Vercel Dashboard** → **Projects** → **Your DukaFiti Project** → **Settings** → **Environment Variables**

### Step 2: Add Required Variables
Click "Add" and enter the following environment variables:

#### Supabase Configuration
- **Name**: `VITE_SUPABASE_URL`
  - **Value**: `https://kwdzbssuovwemthmiuht.supabase.co`
  - **Environment**: Production, Preview, Development

- **Name**: `VITE_SUPABASE_ANON_KEY`
  - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA`
  - **Environment**: Production, Preview, Development

#### Alternative Environment Variables (for compatibility)
- **Name**: `REACT_APP_SUPABASE_URL`
  - **Value**: `https://kwdzbssuovwemthmiuht.supabase.co`
  - **Environment**: Production, Preview, Development

- **Name**: `REACT_APP_SUPABASE_ANON_KEY`
  - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDEyMDYsImV4cCI6MjA2NzExNzIwNn0.7AGomhrpXHBnSgJ15DxFMi80E479S9w9mIeqMnsvNrA`
  - **Environment**: Production, Preview, Development

### Step 3: Save and Deploy
1. Click **Save** for each environment variable
2. Trigger a new deployment by:
   - Pushing any commit to your repository, OR
   - Go to **Deployments** tab and click **Redeploy**

## Deploy & Distribute

### 🚀 Deploy to Vercel

#### Automatic Deployment
1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Settings**:
   - **Framework Preset**: Other
   - **Build Command**: `node comprehensive-supabase-migration.js`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm ci`
3. **Add Environment Variables**: Follow the setup guide above
4. **Auto-Deploy**: Vercel automatically deploys on every push to `main` branch

#### Manual Build Commands
```bash
# For local testing
npm ci
node comprehensive-supabase-migration.js

# Files will be generated in dist/public/
```

### 📱 PWA Installation

#### Mobile Installation
- **Chrome/Safari Mobile**: Tap "Add to Home Screen" when prompted
- **Manual Install**: Use browser menu → "Add to Home Screen" or "Install App"
- **Offline Support**: App works offline with cached data and queued actions

#### Desktop Installation
- **Chrome**: Click install icon in address bar or use menu → "Install DukaFiti"
- **Edge**: Similar install options available in browser interface

### 📦 Mobile App Packaging (Optional)

#### Using Capacitor
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init DukaFiti com.dukafiti.app

# Add platforms
npx cap add android
npx cap add ios

# Build and sync
npm run build
npx cap copy
npx cap open android
npx cap open ios
```

### 🌐 Custom Domain Setup

#### Adding Custom Domain (app.dukafiti.co.ke)
1. **Vercel Dashboard**:
   - Go to **Settings** → **Domains**
   - Click **Add Domain**
   - Enter `app.dukafiti.co.ke`

2. **DNS Configuration**:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate**:
   - Vercel automatically provisions SSL certificates
   - Certificate renewal is handled automatically

#### Domain Verification
- DNS changes may take 24-48 hours to propagate
- Use `dig app.dukafiti.co.ke` to verify DNS resolution
- Vercel will show verification status in dashboard

### 🔧 Troubleshooting

#### Common Issues
1. **Build Failures**: Check environment variables are set correctly
2. **API Errors**: Verify Supabase keys and URL are correct
3. **PWA Issues**: Clear browser cache and reinstall
4. **Domain Issues**: Check DNS propagation and CNAME record

#### Build Logs
- Check Vercel deployment logs for detailed error information
- Ensure all syntax errors are resolved (176 files were fixed in audit)

### 📊 Performance Optimization

#### Vercel Features
- **Edge Functions**: API endpoints deployed to edge locations
- **Analytics**: Built-in performance monitoring
- **Image Optimization**: Automatic image compression and resizing
- **CDN**: Global content delivery network

#### PWA Features
- **Service Worker**: Offline functionality with cached data
- **App Shell**: Fast loading app interface
- **Background Sync**: Queued actions sync when online
- **Push Notifications**: Real-time updates (can be implemented)

## Deployment Status

✅ **Syntax Errors Fixed**: All 176 files cleaned
✅ **Vercel Configuration**: Ready for deployment
✅ **Supabase Integration**: Fully functional
✅ **PWA Features**: Service worker and manifest ready
✅ **Production Build**: Optimized dist/public output

Your DukaFiti application is now ready for seamless Vercel deployment with full PWA capabilities and Supabase integration.