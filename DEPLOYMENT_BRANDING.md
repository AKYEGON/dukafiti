# DukaFiti Deployment Branding Configuration

## Overview
This document explains how DukaFiti custom branding assets replace default Vercel branding during deployment.

## Custom Branding Assets

### Logo Files
- **logo-d-black.png** - Black "D" logo on purple background for light themes
- **logo-d-white.png** - White "D" logo on purple background for dark themes
- **og-image.png** - Open Graph image for social media sharing

### Deployment Integration

#### 1. Favicon & App Icons
- Browser tab icon: `/assets/logo-d-black.png`
- PWA app icon: `/assets/logo-d-black.png`
- Apple touch icon: `/assets/logo-d-black.png`

#### 2. PWA Manifest
```json
{
  "name": "DukaFiti - Shop Management",
  "short_name": "DukaFiti",
  "theme_color": "#7c3aed",
  "background_color": "#7c3aed",
  "icons": [
    {
      "src": "/assets/logo-d-black.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

#### 3. Meta Tags
- **Theme Color**: `#7c3aed` (DukaFiti Purple)
- **Open Graph Image**: Custom DukaFiti logo
- **Twitter Card**: Large image with custom logo

#### 4. Deployment Process
The `deploy-config.js` script runs before build to:
1. Copy custom logo assets to deployment directories
2. Ensure proper branding asset structure
3. Configure metadata for deployment platforms

## Vercel Deployment
When deploying to Vercel, the custom branding will appear in:
- Browser favicons
- PWA app icons
- Social media previews
- Deployment preview cards

## Build Command
```bash
node deploy-config.js && vite build --config vite.config.vercel.ts
```

This ensures custom DukaFiti branding replaces default Vercel branding throughout the deployment process.