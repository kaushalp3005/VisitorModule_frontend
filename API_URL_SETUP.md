# API URL Configuration Guide

## Problem: "Failed to fetch" Error

When accessing your frontend via a dev tunnel (e.g., `https://q80bvqq1-3000.inc1.devtunnels.ms/`), the frontend tries to connect to the backend API. If the API URL is not configured correctly, you'll get "Failed to fetch" errors.

## Solution: Configure API URL

### Option 1: Set Environment Variable (Recommended)

Create a `.env.local` file in the `frontend` directory:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-backend-tunnel-url.inc1.devtunnels.ms
```

**Example:**
- If your backend is exposed on: `https://abc123-8000.inc1.devtunnels.ms`
- Set: `NEXT_PUBLIC_API_URL=https://abc123-8000.inc1.devtunnels.ms`

### Option 2: Auto-Detection (Current Implementation)

The API config now tries to auto-detect the backend URL:
- If on dev tunnel, it tries to construct the backend URL from the frontend URL
- Falls back to `http://localhost:8000` if detection fails

**Note:** This only works if your backend is on the same dev tunnel domain with port 8000.

### Option 3: Use Localhost (Development Only)

If both frontend and backend are running locally:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- No configuration needed (uses default)

## How to Find Your Backend URL

### If Using Dev Tunnels:

1. **Check your backend dev tunnel URL:**
   - Look at your backend terminal output
   - Or check VS Code Dev Tunnels panel
   - Example: `https://xyz789-8000.inc1.devtunnels.ms`

2. **Set it in `.env.local`:**
   ```bash
   NEXT_PUBLIC_API_URL=https://xyz789-8000.inc1.devtunnels.ms
   ```

### If Using ngrok:

1. **Start ngrok for backend:**
   ```bash
   ngrok http 8000
   ```

2. **Copy the HTTPS URL:**
   - Example: `https://abc123.ngrok.io`

3. **Set it in `.env.local`:**
   ```bash
   NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
   ```

## Verify Configuration

1. **Check browser console:**
   - Look for: `[API Config] Using API URL: ...`
   - This shows what URL is being used

2. **Check network tab:**
   - Open browser DevTools → Network tab
   - Look for requests to `/api/approvers/list`
   - Check the full URL being requested

3. **Check backend CORS:**
   - Make sure your backend CORS includes your frontend URL
   - See `backend/app/main.py` for CORS configuration

## Troubleshooting

### Issue: "Failed to fetch" or CORS error

**Solution:**
1. Verify backend is running and accessible
2. Check backend CORS includes your frontend URL
3. Verify API URL in `.env.local` is correct
4. Restart Next.js dev server after changing `.env.local`

### Issue: "Network error" or "Connection refused"

**Solution:**
1. Verify backend is running on the expected port
2. Check if backend URL is accessible (try in browser)
3. Verify firewall/network settings

### Issue: API URL shows localhost but you're on dev tunnel

**Solution:**
1. Create `.env.local` file with correct backend URL
2. Restart Next.js dev server
3. Clear browser cache

## Quick Setup

1. **Create `.env.local` in frontend directory:**
   ```bash
   cd frontend
   echo "NEXT_PUBLIC_API_URL=https://your-backend-url" > .env.local
   ```

2. **Restart Next.js:**
   ```bash
   npm run dev
   ```

3. **Check console for API URL:**
   - Should show: `[API Config] Using API URL: https://your-backend-url`

## Backend CORS Configuration

Make sure your backend includes your frontend URL in CORS origins:

**File:** `backend/app/main.py`

```python
origins = [
    "http://localhost:3000",
    "https://q80bvqq1-3000.inc1.devtunnels.ms",  # Your frontend URL
    # ... other origins
]
```

**Or set in `.env` file:**
```bash
API_CORS_ORIGINS=https://q80bvqq1-3000.inc1.devtunnels.ms,http://localhost:3000
```

