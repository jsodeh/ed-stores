# Netlify Deployment Guide - Fix SPA Routing

## The Issue

You're getting "Page not found" errors when reloading pages like `/cart`, `/admin`, etc. on Netlify because Netlify doesn't know how to handle client-side routing by default.

## Root Cause

- Your app is a **Single Page Application (SPA)** using React Router
- When someone visits `/cart` directly or reloads the page, Netlify looks for a file at `/cart`
- Since that file doesn't exist, Netlify returns a 404
- The solution is to tell Netlify to serve `index.html` for all routes

## Fixes Applied

### 1. Created `public/_redirects` file ✅
This tells Netlify to serve `index.html` for all routes that don't match actual files.

### 2. Created `netlify.toml` configuration ✅
This provides comprehensive Netlify build and deployment settings.

### 3. Added `build:netlify` script ✅
Optimized build command specifically for Netlify deployment.

## Netlify Configuration

### Current Settings in `netlify.toml`:
- **Build command**: `npm run build:client` (builds only the frontend)
- **Publish directory**: `dist/spa` (where Vite outputs the built files)
- **Redirects**: All routes (`/*`) redirect to `/index.html` with 200 status

## Deployment Steps

### Option 1: Update Existing Netlify Site
1. **Push these changes to your repository**
2. **In Netlify Dashboard**:
   - Go to your site settings
   - Build & Deploy → Build settings
   - Update **Build command** to: `npm run build:client`
   - Update **Publish directory** to: `dist/spa`
3. **Trigger a new deployment**

### Option 2: Use Netlify CLI (if you have it)
```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Build and deploy
npm run build:client
netlify deploy --prod --dir=dist/spa
```

### Option 3: Manual Verification
1. **Build locally**:
   ```bash
   npm run build:client
   ```
2. **Check that `dist/spa` contains**:
   - `index.html`
   - `assets/` folder with JS/CSS files
   - `_redirects` file (copied from `public/`)

## Why This Happens

### Development vs Production:
- **Development** (`npm run dev`): Vite dev server handles routing automatically
- **Production** (Netlify): Static files need explicit routing configuration

### Your Current Setup:
- You have both client and server builds
- For Netlify, you only need the client build (static site)
- The server build is for if you were deploying to a Node.js server

## Expected Results After Fix

- ✅ Direct URL access works: `yoursite.netlify.app/cart`
- ✅ Page reloads work correctly
- ✅ Browser back/forward buttons work
- ✅ Bookmarked URLs work
- ✅ All routes load the correct React components

## Troubleshooting

### If Still Getting 404s:
1. **Check Netlify build logs** for errors
2. **Verify `_redirects` file** is in the published directory
3. **Check publish directory** is set to `dist/spa`
4. **Ensure build command** is `npm run build:client`

### Common Issues:
- **Wrong publish directory**: Should be `dist/spa`, not `dist` or `build`
- **Missing `_redirects` file**: Should be copied from `public/` during build
- **Wrong build command**: Should build client only, not server

## Files Created/Modified:

1. `public/_redirects` - Netlify routing rules
2. `netlify.toml` - Netlify configuration
3. `package.json` - Added `build:netlify` script
4. `NETLIFY-DEPLOYMENT-GUIDE.md` - This guide

## Next Steps:

1. **Commit and push** these changes to your repository
2. **Update Netlify build settings** as described above
3. **Trigger a new deployment**
4. **Test** by visiting your site and reloading different pages

Your SPA routing should work perfectly after this deployment! 🚀