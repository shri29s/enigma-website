# Vercel Deployment Fix Guide

## Issues Fixed

1. **JSON Parse Error** - Added proper error handling for non-JSON responses
2. **CORS Configuration** - Updated to properly handle production frontend URLs
3. **Environment Variables** - Added better configuration examples

## Critical Environment Variables

### Backend (Server)

You **MUST** set these in your Vercel backend project settings:

1. `NODE_ENV=production`
2. `DATABASE_URL=your-mongodb-connection-string`
3. `JWT_SECRET=your-secure-random-string`
4. `SESSION_SECRET=your-secure-random-string`
5. `FRONTEND_URL=https://your-frontend-domain.vercel.app` (your client Vercel URL)
6. `PORT=3000` (optional, Vercel handles this)

### Frontend (Client)

You **MUST** set these in your Vercel frontend project settings:

1. `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.vercel.app/api`

## Deployment Steps

### Option 1: Redeploy with Correct Configuration (Recommended)

1. **Set Environment Variables on Vercel:**
   - Go to your backend Vercel project → Settings → Environment Variables
   - Add all backend environment variables listed above
   - Go to your frontend Vercel project → Settings → Environment Variables
   - Add `NEXT_PUBLIC_API_BASE_URL` pointing to your backend

2. **Redeploy Both Projects:**

   ```bash
   # Backend will redeploy automatically when you push, or trigger manually in Vercel
   # Frontend will redeploy automatically when you push, or trigger manually in Vercel
   ```

3. **DO NOT CLEAR THE DATABASE** - The errors are configuration issues, not data issues

### Option 2: Test Locally First

1. **Create `.env.local` files:**

   Backend (`server/.env.local`):

   ```env
   NODE_ENV=development
   DATABASE_URL=your-mongodb-connection-string
   JWT_SECRET=your-secure-secret-key
   SESSION_SECRET=your-secure-session-secret
   FRONTEND_URL=http://localhost:3001
   DEFAULT_ADMIN_EMAIL=admin@example.com
   DEFAULT_ADMIN_PASSWORD=securepassword
   ```

   Frontend (`client/.env.local`):

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
   ```

2. **Test locally:**

   ```bash
   # Terminal 1 - Backend
   cd server
   npm install
   npm start

   # Terminal 2 - Frontend
   cd client
   npm install
   npm run dev
   ```

3. **Once working locally, deploy to Vercel with correct environment variables**

## Common Issues & Solutions

### Issue 1: "Failed to fetch events"

**Cause:** `NEXT_PUBLIC_API_BASE_URL` not set or incorrect
**Fix:** Set correct backend URL in frontend Vercel environment variables

### Issue 2: "JSON.parse: unexpected end of data"

**Cause:** CORS blocking requests or backend not responding with JSON
**Fix:**

- Set `FRONTEND_URL` in backend Vercel environment variables
- Ensure it matches your frontend Vercel URL exactly
- Check browser console for CORS errors

### Issue 3: CORS Errors in Browser Console

**Cause:** Backend `FRONTEND_URL` doesn't match frontend domain
**Fix:** Update `FRONTEND_URL` to match your frontend Vercel URL exactly

### Issue 4: 503 Service Unavailable

**Cause:** Database connection failing
**Fix:** Check `DATABASE_URL` is correct and MongoDB Atlas allows connections from Vercel IPs (0.0.0.0/0)

## Verification Steps

After deployment:

1. **Check Backend Health:**
   - Visit: `https://your-backend.vercel.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Check CORS:**
   - Open browser console on your frontend
   - Look for CORS errors
   - If present, verify `FRONTEND_URL` matches exactly

3. **Check Environment Variables:**
   - Backend: Vercel Dashboard → Your Backend Project → Settings → Environment Variables
   - Frontend: Vercel Dashboard → Your Frontend Project → Settings → Environment Variables

## MongoDB Atlas Configuration

Ensure your MongoDB Atlas allows Vercel connections:

1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allows all IPs including Vercel)
3. Or add specific Vercel IPs if you prefer tighter security

## What NOT to Do

❌ **DO NOT clear the database** - Your data is fine
❌ **DO NOT change code further** - The fixes are already implemented
✅ **DO set environment variables correctly**
✅ **DO redeploy after setting environment variables**
