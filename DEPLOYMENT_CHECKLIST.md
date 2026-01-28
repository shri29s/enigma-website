# Vercel Deployment Checklist

## Before Redeploying

### Backend Vercel Environment Variables

- [ ] `NODE_ENV` = `production`
- [ ] `DATABASE_URL` = Your MongoDB connection string
- [ ] `JWT_SECRET` = A secure random string (min 32 characters)
- [ ] `SESSION_SECRET` = A secure random string (min 32 characters)
- [ ] `FRONTEND_URL` = Your frontend Vercel URL (e.g., `https://enigma-frontend.vercel.app`)

### Frontend Vercel Environment Variables

- [ ] `NEXT_PUBLIC_API_BASE_URL` = Your backend Vercel URL + `/api` (e.g., `https://enigma-backend.vercel.app/api`)

### MongoDB Atlas

- [ ] Network Access allows `0.0.0.0/0` OR Vercel IPs
- [ ] Database user has proper read/write permissions
- [ ] Connection string is correct in `DATABASE_URL`

## After Redeploying

### Testing

- [ ] Visit `https://your-backend.vercel.app/` - Should show API welcome message
- [ ] Visit `https://your-backend.vercel.app/api/health` - Should return `{"status":"OK"}`
- [ ] Visit your frontend - Events should load
- [ ] Try logging in - Should work without JSON parse errors
- [ ] Check browser console - No CORS errors

## Answer to Your Question

**Should you clear the database and redeploy?**

❌ **NO - Do NOT clear the database!**

The issue is **NOT** with your data. The errors are caused by:

1. Missing/incorrect environment variables on Vercel
2. CORS configuration not allowing your frontend to access backend
3. Client not handling non-JSON error responses properly (now fixed)

**What to do instead:**

1. ✅ Set the environment variables listed above in Vercel
2. ✅ Redeploy (or Vercel will auto-redeploy when you push the fixes)
3. ✅ Test the endpoints

The code fixes I made will now show you much better error messages telling you exactly what's wrong (e.g., "Server returned non-JSON response - check if API_BASE_URL is correct").
