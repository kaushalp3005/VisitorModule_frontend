# 🚨 FINAL CORS FIX GUIDE

## Current Status

✅ **Frontend:** Correctly configured and ready
✅ **API URL:** `http://localhost:8000` (confirmed in `.env`)
✅ **Request Format:** FormData with proper image blob conversion
✅ **Endpoint:** `/api/visitors/check-in-with-image`

❌ **Backend CORS:** Not allowing requests from `http://localhost:4000`

---

## The Problem

```
Access to fetch at 'http://localhost:8000/api/visitors/check-in-with-image'
from origin 'http://localhost:4000' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Translation:** Your FastAPI backend is rejecting requests from your Next.js frontend because CORS is not properly configured.

---

## The Solution (3 Steps)

### Step 1: Find Your Backend Main File

Look in your backend folder for:
- `main.py`
- `app.py`
- `server.py`
- Or files in `api/`, `src/`, `app/` folders

### Step 2: Add/Update CORS Middleware

**If you already have CORS middleware**, update it:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# UPDATE THIS SECTION
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",      # ← ADD THIS
        "http://localhost:3000",
        "http://127.0.0.1:4000",      # ← ADD THIS
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**If you DON'T have CORS middleware**, add this after `app = FastAPI()`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ← ADD THIS IMPORT

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

**For quick testing (development only)**, you can allow all origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # Allow all origins
    allow_credentials=False,          # Must be False when origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)
```

⚠️ **Important:** The CORS middleware must be added BEFORE any route definitions.

### Step 3: Restart Backend Server

```bash
# Stop the backend (Ctrl+C)

# Then restart it:
uvicorn main:app --reload --port 8000

# OR
python main.py

# OR
fastapi dev main.py
```

---

## Verify the Fix

### Test 1: Quick Terminal Test

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

### Test 2: Use the Test HTML File

Open `test-api-connection.html` in your browser and click "Test CORS" button.

### Test 3: Try the Actual Form

1. Go to `http://localhost:4000`
2. Fill out the visitor form (both steps)
3. Submit
4. Check browser console - you should see:
   ```
   Submitting to: http://localhost:8000/api/visitors/check-in-with-image
   Response status: 201
   API Response: {message: "Visitor checked in successfully with image", visitor: {...}}
   ```

---

## Common Mistakes to Avoid

❌ **Forgetting to restart backend** - Changes only take effect after restart
❌ **CORS middleware after routes** - Must be added BEFORE route definitions
❌ **Wrong port in allow_origins** - Must be `4000`, not `3000`
❌ **Browser cache** - Clear cache or hard refresh (Ctrl+Shift+R)
❌ **Typos in origin URL** - Must be `http://localhost:4000` (no trailing slash)

---

## Complete Example

Here's a complete minimal example of what your backend file should look like:

```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI()

# ============ CORS CONFIGURATION ============
# THIS MUST BE BEFORE ROUTE DEFINITIONS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",      # Next.js frontend
        "http://localhost:3000",      # Alternative frontend port
        "http://127.0.0.1:4000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("✅ CORS middleware loaded - allowing port 4000")

# ============ YOUR ROUTES ============
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
    """
    Check in a visitor with image and optional health declaration

    health_declaration is a JSON string with structure:
    {
      "hasRespiratoryAilment": false,
      "hasSkinInfection": false,
      "hasGastrointestinalAilment": false,
      "hasENTInfection": false,
      "hasViralFever": false,
      "hasCovid19": false,
      "hadPastIllness": false,
      "pastIllnessDetails": "",
      "hasForeignTravel": false,
      "foreignTravelDetails": "",
      "hasVaccination": false,
      "hadRecentCovid": false,
      "vaccinationStatus": "fully" | "partially" | "none",
      "protectiveClothingAck": true,
      "foodDrinksAck": true,
      "jewelryAck": true,
      "personalHygieneAck": true,
      "perfumeNailsAck": true,
      "hygieneNormsAck": true
    }
    """
    # Your implementation here
    pass

# ... rest of your routes ...

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## What Happens After You Fix This

Once CORS is configured correctly:

1. ✅ Frontend form submission will work
2. ✅ Visitor data (including health declaration) will be sent to backend
3. ✅ Image will be uploaded properly
4. ✅ Success message will display
5. ✅ Reference ID will be shown
6. ✅ Call button to person to meet will appear

---

## Still Not Working?

### Check These:

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 4000
- [ ] CORS middleware is added to backend
- [ ] Backend was restarted after adding CORS
- [ ] Browser cache was cleared (Ctrl+Shift+R)
- [ ] No firewall blocking localhost connections
- [ ] CORS middleware is BEFORE route definitions

### Debug Command:

Run this in your terminal to see exactly what your backend is sending:

```bash
curl -X OPTIONS http://localhost:8000/api/visitors/check-in-with-image \
  -H "Origin: http://localhost:4000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

Look for these headers in the response:
- `access-control-allow-origin`
- `access-control-allow-methods`
- `access-control-allow-headers`

---

## Summary

**Your only task:** Add/update CORS middleware in your backend's main file to allow `http://localhost:4000`, then restart the backend server.

**The frontend is 100% ready and correct.** Once you fix CORS on the backend, everything will work immediately.

---

**Need the file?** Check these locations in your backend:
- `main.py`
- `app.py`
- `api/main.py`
- `src/main.py`
- `backend/main.py`
