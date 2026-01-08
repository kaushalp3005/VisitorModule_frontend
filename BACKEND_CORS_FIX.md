# 🔧 Backend CORS Fix - Step by Step

## Problem Identified
```
Access to fetch at 'http://localhost:8000/api/visitors/check-in-with-image'
from origin 'http://localhost:4000' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ Solution

Your backend (FastAPI) needs to allow requests from `http://localhost:4000`

---

## Step 1: Find Your Backend Main File

Look for one of these files in your backend directory:
- `main.py`
- `app.py`
- `api/main.py`
- `src/main.py`

---

## Step 2: Add/Update CORS Middleware

### Option A: If CORS middleware already exists

Find the existing `CORSMiddleware` configuration and update it:

```python
from fastapi.middleware.cors import CORSMiddleware

# EXISTING CODE - UPDATE THIS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",  # ADD THIS LINE
        "http://localhost:3000",
        "http://127.0.0.1:4000",  # ADD THIS LINE
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Option B: If NO CORS middleware exists

Add this code after `app = FastAPI()`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ADD THIS IMPORT

app = FastAPI()

# ADD THIS ENTIRE BLOCK
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",
        "http://localhost:3000",
        "http://127.0.0.1:4000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Option C: Development Mode (Allow All Origins)

**For development only** - allows all origins:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins
    allow_credentials=False,      # Must be False when origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)
```

⚠️ **Warning:** Option C is less secure. Use Option A or B for production.

---

## Step 3: Restart Backend Server

After making the changes:

1. **Stop the backend** (Ctrl+C in the terminal running the backend)
2. **Restart the backend:**
   ```bash
   # Navigate to your backend directory
   cd path/to/backend

   # Start the server (adjust command as needed)
   uvicorn main:app --reload --port 8000
   # OR
   python main.py
   # OR
   fastapi dev main.py
   ```

---

## Step 4: Verify the Fix

### Test 1: Check CORS Headers
Open a new terminal and run:
```bash
curl -X OPTIONS http://localhost:8000/api/visitors/check-in-with-image \
  -H "Origin: http://localhost:4000" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i "access-control"
```

**Expected output:**
```
< access-control-allow-origin: http://localhost:4000
< access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Test 2: Try Frontend Again
1. Go to your frontend: `http://localhost:4000`
2. Fill out the visitor form (both steps)
3. Submit
4. Check browser console - you should see:
   ```
   Submitting to: http://localhost:8000/api/visitors/check-in-with-image
   Response status: 201
   API Response: {...}
   ```

---

## Complete Example: main.py

Here's a complete example of what your `main.py` should look like:

```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI()

# ============ CORS Configuration ============
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",  # Next.js frontend
        "http://localhost:3000",  # Alternative port
        "http://127.0.0.1:4000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Your Routes ============
@app.post("/api/visitors/check-in-with-image")
async def check_in_with_image(
    visitor_name: str = Form(...),
    mobile_number: str = Form(...),
    person_to_meet: str = Form(...),
    reason_to_visit: str = Form(...),
    image: UploadFile = File(...),
    email_address: Optional[str] = Form(None),
    company: Optional[str] = Form(None),
    warehouse: Optional[str] = Form(None),
    health_declaration: Optional[str] = Form(None),
):
    # Your existing implementation
    pass

# ... rest of your code ...
```

---

## Troubleshooting

### Still getting CORS error after restart?

1. **Make sure you saved the file**
2. **Make sure you restarted the backend** (Ctrl+C then restart)
3. **Hard refresh the frontend** (Ctrl+Shift+R)
4. **Check terminal** - make sure there are no errors when backend starts
5. **Verify the middleware is being loaded** - add a print statement:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:4000", ...],
       ...
   )
   print("✅ CORS middleware loaded with origins: http://localhost:4000")
   ```

### Backend won't start?

Check for syntax errors:
```bash
python -m py_compile main.py
```

### Still not working?

Double-check:
- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 4000
- [ ] CORS middleware is added BEFORE route definitions
- [ ] Backend was restarted after changes
- [ ] Browser cache was cleared (Ctrl+Shift+R)

---

## ✅ Success Indicators

After the fix, you should see in browser console:
1. ✅ `Submitting to: http://localhost:8000/api/visitors/check-in-with-image`
2. ✅ `Response status: 201`
3. ✅ `API Response: { message: "Visitor checked in successfully with image", visitor: {...} }`
4. ✅ No CORS errors

---

## Quick Copy-Paste Fix

If you just want to fix it quickly (development only):

**Add this right after `app = FastAPI()` in your backend:**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then restart your backend server!

---

**Need the exact file location?** Look in your backend project for files named:
- `main.py`
- `app.py`
- `server.py`
- Or check in folders like `api/`, `src/`, `app/`
