# CORS & Connection Troubleshooting Guide

## 🔍 Problem
Frontend (port 4000) cannot connect to Backend (port 8000) - "Failed to fetch" error

## ✅ Current Setup
- **Frontend:** http://localhost:4000 (Next.js)
- **Backend:** http://localhost:8000 (FastAPI)
- **Environment:** `.env` has `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## 🧪 Step 1: Verify Backend is Running

Run this command:
```bash
curl http://localhost:8000/api/visitors/
```

**Expected:** `{"detail":"Not authenticated"}` (403 status)
**If fails:** Start your backend server

---

## 🧪 Step 2: Test CORS Configuration

Run this command:
```bash
curl -X OPTIONS http://localhost:8000/api/visitors/check-in-with-image \
  -H "Origin: http://localhost:4000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Expected headers in response:**
```
access-control-allow-origin: *
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## 🧪 Step 3: Test Actual Endpoint

Create a test file and run it:

**test-api.html**
```html
<!DOCTYPE html>
<html>
<head>
    <title>API Test</title>
</head>
<body>
    <h1>Testing API Connection</h1>
    <button onclick="testAPI()">Test POST Request</button>
    <pre id="result"></pre>

    <script>
        async function testAPI() {
            const resultEl = document.getElementById('result');
            resultEl.textContent = 'Testing...';

            try {
                const formData = new FormData();
                formData.append('visitor_name', 'Test User');
                formData.append('mobile_number', '9999999999');
                formData.append('person_to_meet', 'admin');
                formData.append('reason_to_visit', 'Test');

                // Create a small test image blob
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(0, 0, 100, 100);

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
                formData.append('image', blob, 'test.jpg');

                console.log('Sending request to:', 'http://localhost:8000/api/visitors/check-in-with-image');

                const response = await fetch('http://localhost:8000/api/visitors/check-in-with-image', {
                    method: 'POST',
                    body: formData,
                });

                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);

                resultEl.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                console.error('Error:', error);
                resultEl.textContent = 'ERROR: ' + error.message;
            }
        }
    </script>
</body>
</html>
```

**To test:**
1. Save the file as `test-api.html`
2. Open it in your browser (file:// protocol)
3. Click "Test POST Request"
4. Check browser console for detailed errors

---

## 🔧 Solution 1: Verify Backend CORS Settings

Your backend needs to allow requests from `http://localhost:4000`

**FastAPI CORS Configuration (main.py or app.py):**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS Configuration
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

**For development (allow all):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔧 Solution 2: Check Browser Console

1. Open your browser DevTools (F12)
2. Go to Console tab
3. Try submitting the form
4. Look for errors like:
   - `CORS policy` - CORS issue on backend
   - `net::ERR_CONNECTION_REFUSED` - Backend not running
   - `Failed to fetch` - Network or CORS issue

---

## 🔧 Solution 3: Restart Development Servers

Sometimes the issue is just cached or stale:

1. **Stop both servers** (Ctrl+C)
2. **Restart backend:**
   ```bash
   # Navigate to backend directory
   uvicorn main:app --reload --port 8000
   ```
3. **Restart frontend:**
   ```bash
   # Navigate to frontend directory
   npm run dev
   ```
4. **Clear browser cache** (Ctrl+Shift+Delete)
5. **Hard refresh** (Ctrl+Shift+R)

---

## 🔧 Solution 4: Check Network Tab

1. Open DevTools → Network tab
2. Submit the form
3. Look for the request to `check-in-with-image`
4. Check:
   - **Status:** Should be 201 (Created)
   - **Headers:** Check CORS headers
   - **Preview/Response:** See actual response

**Common Issues:**

| Status | Meaning | Solution |
|--------|---------|----------|
| (failed) | Network error | Check if backend is running |
| 0 | CORS blocked | Fix CORS configuration |
| 403 | Forbidden | Check authentication |
| 422 | Validation error | Check request format |
| 500 | Server error | Check backend logs |

---

## 🔧 Solution 5: Environment Variables

Make sure Next.js picks up the environment variable:

1. **Check `.env` file exists:**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. **Restart Next.js** (environment variables are loaded on startup)

3. **Verify in browser console:**
   ```javascript
   console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
   ```

---

## 🐛 Debugging Checklist

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 4000
- [ ] `.env` file has correct API URL
- [ ] CORS is enabled on backend with `allow_origins=["*"]` or includes `http://localhost:4000`
- [ ] Both servers were restarted after configuration changes
- [ ] Browser cache was cleared
- [ ] No firewall blocking localhost connections
- [ ] Console shows the correct API URL being called
- [ ] Network tab shows the request being sent

---

## 📝 Quick Test Command

Run this from your terminal to test the endpoint directly:

```bash
curl -X POST http://localhost:8000/api/visitors/check-in-with-image \
  -F "visitor_name=Test User" \
  -F "mobile_number=9999999999" \
  -F "person_to_meet=admin" \
  -F "reason_to_visit=Test Visit" \
  -F "email_address=test@example.com" \
  -F "company=Test Co" \
  -F "warehouse=W202" \
  -F "health_declaration={\"hasRespiratoryAilment\":false,\"hasSkinInfection\":false,\"hasGastrointestinalAilment\":false,\"hasENTInfection\":false,\"hasViralFever\":false,\"hasCovid19\":false,\"hadPastIllness\":false,\"pastIllnessDetails\":\"\",\"hasForeignTravel\":false,\"foreignTravelDetails\":\"\",\"hasVaccination\":false,\"hadRecentCovid\":false,\"vaccinationStatus\":\"fully\",\"protectiveClothingAck\":true,\"foodDrinksAck\":true,\"jewelryAck\":true,\"personalHygieneAck\":true,\"perfumeNailsAck\":true,\"hygieneNormsAck\":true}" \
  -F "image=@test-image.jpg"
```

**Expected:** 201 status with visitor data

---

## 🎯 Most Likely Solution

Based on the error, the most likely issue is:

### **Backend CORS needs to explicitly allow localhost:4000**

**Fix:** Update your FastAPI backend's CORS middleware:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then restart your backend server.

---

## ✅ After Fixing

1. Restart backend server
2. Hard refresh frontend (Ctrl+Shift+R)
3. Try submitting the form
4. Check browser console for:
   - `Submitting to: http://localhost:8000/api/visitors/check-in-with-image`
   - `Response status: 201`
   - `API Response: {...}`

---

**Need more help?** Check the browser console logs for the exact error message!
