# CORS Fix Checklist

Use this checklist to fix the CORS issue step by step.

---

## Pre-Fix Checklist

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 4000
- [ ] I can access `http://localhost:4000` in my browser
- [ ] I know where my backend main file is located

---

## Fix Implementation

### Step 1: Locate Backend File
- [ ] Found the backend main file (main.py, app.py, or similar)
- [ ] File contains `app = FastAPI()` line
- [ ] I have opened the file in my code editor

### Step 2: Check Existing CORS Configuration
- [ ] I checked if CORS middleware already exists
  - **If YES:** Note the current `allow_origins` list
  - **If NO:** Proceed to add new CORS middleware

### Step 3: Update/Add CORS Middleware

**If CORS middleware EXISTS:**
- [ ] Found the `app.add_middleware(CORSMiddleware, ...)` block
- [ ] Added `"http://localhost:4000"` to the `allow_origins` list
- [ ] Added `"http://127.0.0.1:4000"` to the `allow_origins` list
- [ ] Saved the file

**If CORS middleware DOES NOT EXIST:**
- [ ] Added `from fastapi.middleware.cors import CORSMiddleware` at the top
- [ ] Added the complete CORS middleware block after `app = FastAPI()`
- [ ] Verified the block is BEFORE any route definitions
- [ ] Saved the file

### Step 4: Code Verification
- [ ] CORS middleware is placed AFTER `app = FastAPI()`
- [ ] CORS middleware is placed BEFORE route definitions (like `@app.post(...)`)
- [ ] `allow_origins` includes `"http://localhost:4000"`
- [ ] `allow_methods` is set to `["*"]`
- [ ] `allow_headers` is set to `["*"]`
- [ ] No syntax errors (check for missing commas, brackets, quotes)

---

## Backend Restart

- [ ] Stopped the backend server (pressed Ctrl+C in terminal)
- [ ] Waited for server to fully stop
- [ ] Restarted backend with: `uvicorn main:app --reload --port 8000`
- [ ] Backend started successfully without errors
- [ ] Terminal shows something like "Uvicorn running on http://127.0.0.1:8000"

---

## Frontend Verification

- [ ] Frontend is still running on `http://localhost:4000`
- [ ] Opened browser to `http://localhost:4000`
- [ ] Cleared browser cache (Ctrl+Shift+Delete) OR hard refreshed (Ctrl+Shift+R)
- [ ] Opened browser DevTools (F12)
- [ ] Opened Console tab in DevTools

---

## Testing

### Test 1: Terminal CORS Test
- [ ] Opened a new terminal
- [ ] Ran the command:
  ```bash
  curl -X OPTIONS http://localhost:8000/api/visitors/check-in-with-image \
    -H "Origin: http://localhost:4000" \
    -H "Access-Control-Request-Method: POST" \
    -v 2>&1 | grep "access-control-allow-origin"
  ```
- [ ] Output shows: `access-control-allow-origin: http://localhost:4000` or `access-control-allow-origin: *`

### Test 2: Browser Test (test-api-connection.html)
- [ ] Opened `test-api-connection.html` in browser
- [ ] Clicked "Test Backend" button
- [ ] Result shows: ✅ Backend is running
- [ ] Clicked "Test CORS" button
- [ ] Result shows: ✅ CORS is properly configured
- [ ] Clicked "Test Form Submission" button
- [ ] Result shows: ✅ Form submission successful (or shows specific error)

### Test 3: Actual Form Submission
- [ ] Went to `http://localhost:4000`
- [ ] Filled out Step 1 of visitor form:
  - [ ] Name
  - [ ] Mobile number (10 digits)
  - [ ] Email
  - [ ] Company
  - [ ] Person to meet
  - [ ] Reason for visit
  - [ ] Took selfie
- [ ] Clicked "Next: Health Declaration →"
- [ ] Filled out Step 2 (Health Declaration):
  - [ ] Answered all health questions
  - [ ] Checked all acknowledgment boxes
- [ ] Clicked "Submit Check-In Request"
- [ ] Watched browser console for output

---

## Success Indicators

**In Browser Console:**
- [ ] ✅ See: `Submitting to: http://localhost:8000/api/visitors/check-in-with-image`
- [ ] ✅ See: `Response status: 201`
- [ ] ✅ See: `API Response: {message: "Visitor checked in successfully...", visitor: {...}}`
- [ ] ❌ NO "CORS policy" errors
- [ ] ❌ NO "Failed to fetch" errors

**In Browser UI:**
- [ ] ✅ Success message appears (green toast notification)
- [ ] ✅ "Request Submitted Successfully!" screen shows
- [ ] ✅ Reference ID is displayed
- [ ] ✅ Person to meet name and call button appear

---

## If Still Not Working

### Debugging Steps
- [ ] Checked backend terminal for any error messages
- [ ] Verified backend is actually running (try accessing `http://localhost:8000/docs`)
- [ ] Verified frontend is on port 4000 (check browser address bar)
- [ ] Tried restarting BOTH frontend and backend
- [ ] Tried in a different browser or incognito mode
- [ ] Checked if firewall is blocking localhost connections
- [ ] Verified no other application is using port 8000 or 4000

### Additional Diagnostic Commands

**Check if backend is running:**
```bash
curl http://localhost:8000/api/visitors/
```
Expected: `{"detail":"Not authenticated"}` (403 status is OK)

**Check CORS headers in detail:**
```bash
curl -X OPTIONS http://localhost:8000/api/visitors/check-in-with-image \
  -H "Origin: http://localhost:4000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```
Look for all `access-control-*` headers in the response.

**Check if port 8000 is in use:**
```bash
# Windows:
netstat -ano | findstr :8000

# Mac/Linux:
lsof -i :8000
```

---

## Final Verification

Once everything works:
- [ ] Form submits successfully
- [ ] No CORS errors in console
- [ ] Reference ID is generated
- [ ] Visitor data appears in backend/database
- [ ] Can check status using the reference ID

---

## Notes Section

Use this space to write down any issues you encountered:

```
Issue:


Solution:


```

---

**Still stuck?** Review these files:
1. `FINAL_CORS_FIX_GUIDE.md` - Complete guide
2. `QUICK_FIX_REFERENCE.txt` - Quick copy-paste fix
3. `BACKEND_CORS_FIX.md` - Step-by-step backend fix
4. `TROUBLESHOOTING_CORS.md` - Detailed troubleshooting

The frontend code is 100% correct. The issue is only in the backend CORS configuration.
