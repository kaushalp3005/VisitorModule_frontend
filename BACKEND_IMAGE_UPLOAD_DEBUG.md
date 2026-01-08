# Backend Image Upload Issue - 404 Not Found

## 🔴 Current Issue

**Error:** Images are returning **404 Not Found** from S3

**Example URL that's failing:**
```
https://visitor-selfie.s3.ap-south-1.amazonaws.com/visitors/20251126103405.jpg
```

**Test result:**
```bash
curl -I "https://visitor-selfie.s3.ap-south-1.amazonaws.com/visitors/20251126103405.jpg"

# Returns: HTTP/1.1 404 Not Found
```

**This means:** The backend is generating the S3 URL and returning it to the frontend, but the image file **does not actually exist** in the S3 bucket at that location.

---

## 🔍 Root Cause Analysis

The backend is likely:
1. ✅ Receiving the image from frontend (FormData)
2. ✅ Generating the S3 URL/path
3. ❌ **NOT actually uploading the file to S3**
4. ✅ Returning the URL anyway (which points to non-existent file)

---

## 🐛 What to Check in Your Backend

### 1. Verify Image Upload is Happening

Look for your S3 upload code. It should look something like this:

```python
import boto3
from fastapi import UploadFile

s3_client = boto3.client('s3')

async def upload_visitor_image(image: UploadFile, visitor_id: int) -> str:
    """Upload visitor image to S3 and return URL"""

    # Read image data
    image_data = await image.read()

    # Generate S3 key (path)
    s3_key = f"visitors/{visitor_id}.jpg"

    # ⚠️ THIS IS THE CRITICAL STEP - Upload to S3
    try:
        s3_client.put_object(
            Bucket='visitor-selfie',
            Key=s3_key,
            Body=image_data,
            ContentType=image.content_type or 'image/jpeg'
        )
        print(f"✅ Successfully uploaded image to S3: {s3_key}")
    except Exception as e:
        print(f"❌ Failed to upload to S3: {e}")
        raise

    # Generate and return URL
    s3_url = f"https://visitor-selfie.s3.ap-south-1.amazonaws.com/{s3_key}"
    return s3_url
```

### 2. Check for These Common Issues

#### Issue A: Upload Code Never Executes

```python
# ❌ BAD - Only generates URL, doesn't upload
async def upload_visitor_image(image: UploadFile, visitor_id: int) -> str:
    s3_key = f"visitors/{visitor_id}.jpg"
    # Missing: s3_client.put_object() call
    return f"https://visitor-selfie.s3.ap-south-1.amazonaws.com/{s3_key}"

# ✅ GOOD - Actually uploads to S3
async def upload_visitor_image(image: UploadFile, visitor_id: int) -> str:
    image_data = await image.read()
    s3_key = f"visitors/{visitor_id}.jpg"

    s3_client.put_object(
        Bucket='visitor-selfie',
        Key=s3_key,
        Body=image_data,
        ContentType='image/jpeg'
    )

    return f"https://visitor-selfie.s3.ap-south-1.amazonaws.com/{s3_key}"
```

#### Issue B: Exception is Caught and Ignored

```python
# ❌ BAD - Silently fails, returns URL anyway
try:
    s3_client.put_object(...)
except Exception as e:
    print(f"Error: {e}")
    # Still returns URL even though upload failed!
    return s3_url

# ✅ GOOD - Re-raises exception
try:
    s3_client.put_object(...)
except Exception as e:
    print(f"S3 upload failed: {e}")
    raise HTTPException(status_code=500, detail="Failed to upload image")
```

#### Issue C: AWS Credentials Not Configured

```python
# Check if boto3 can access S3
import boto3

s3_client = boto3.client('s3')

try:
    # Test connection
    s3_client.head_bucket(Bucket='visitor-selfie')
    print("✅ S3 connection successful")
except Exception as e:
    print(f"❌ S3 connection failed: {e}")
    # Common errors:
    # - NoCredentialsError: AWS credentials not configured
    # - ClientError (403): Credentials don't have S3 access
    # - ClientError (404): Bucket doesn't exist
```

**Fix:** Configure AWS credentials

```bash
# Option 1: Environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="ap-south-1"

# Option 2: AWS credentials file (~/.aws/credentials)
[default]
aws_access_key_id = your-access-key
aws_secret_access_key = your-secret-key

# Option 3: In code (not recommended for production)
s3_client = boto3.client(
    's3',
    aws_access_key_id='your-access-key',
    aws_secret_access_key='your-secret-key',
    region_name='ap-south-1'
)
```

#### Issue D: Wrong Bucket Name or Region

```python
# Make sure these match your actual S3 setup
BUCKET_NAME = 'visitor-selfie'  # ✅ Correct bucket name
REGION = 'ap-south-1'           # ✅ Correct region

# Wrong examples:
# BUCKET_NAME = 'visitors'       # ❌ Wrong bucket
# REGION = 'us-east-1'           # ❌ Wrong region
```

---

## 🧪 How to Test

### Test 1: Check S3 Bucket Contents

```bash
# List all files in the visitors/ folder
aws s3 ls s3://visitor-selfie/visitors/

# Expected: Should see uploaded image files
# If empty: Images are not being uploaded
```

### Test 2: Manual Upload Test

```python
# Test S3 upload independently
import boto3

s3_client = boto3.client('s3', region_name='ap-south-1')

# Test upload
test_data = b"test image data"
try:
    s3_client.put_object(
        Bucket='visitor-selfie',
        Key='visitors/test.txt',
        Body=test_data
    )
    print("✅ Test upload successful")

    # Verify it exists
    response = s3_client.head_object(
        Bucket='visitor-selfie',
        Key='visitors/test.txt'
    )
    print("✅ Test file exists in S3")
except Exception as e:
    print(f"❌ Test upload failed: {e}")
```

### Test 3: Check Backend Logs

When you submit a visitor form, your backend logs should show:

```
✅ Received image upload: filename=selfie.jpg, size=45678 bytes
✅ Generated S3 key: visitors/20251126103405.jpg
✅ Uploading to S3 bucket: visitor-selfie
✅ Upload successful
✅ Generated URL: https://visitor-selfie.s3.ap-south-1.amazonaws.com/visitors/20251126103405.jpg
```

If you see:
```
❌ S3 upload failed: NoCredentialsError
❌ S3 upload failed: AccessDenied
❌ S3 upload failed: NoSuchBucket
```

This confirms the upload is failing.

---

## 🔧 Complete Backend Example

Here's a complete, working implementation:

```python
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import Optional
import boto3
from datetime import datetime
import os

app = FastAPI()

# S3 Configuration
S3_BUCKET = 'visitor-selfie'
S3_REGION = 'ap-south-1'

# Initialize S3 client
s3_client = boto3.client('s3', region_name=S3_REGION)

async def upload_to_s3(image: UploadFile, visitor_id: int) -> str:
    """Upload image to S3 and return public URL"""

    try:
        # Read image data
        image_data = await image.read()
        print(f"📸 Image received: {len(image_data)} bytes")

        # Generate S3 key
        s3_key = f"visitors/{visitor_id}.jpg"
        print(f"📤 Uploading to S3: {S3_BUCKET}/{s3_key}")

        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=image_data,
            ContentType=image.content_type or 'image/jpeg',
            ACL='public-read'  # Make publicly accessible
        )

        print(f"✅ Upload successful: {s3_key}")

        # Generate public URL
        s3_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{s3_key}"
        print(f"🔗 Image URL: {s3_url}")

        return s3_url

    except Exception as e:
        print(f"❌ S3 upload failed: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image to S3: {str(e)}"
        )

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
    """Check in visitor with image upload"""

    # Generate visitor ID
    visitor_id = int(datetime.now().strftime("%Y%m%d%H%M%S"))

    print(f"\n{'='*60}")
    print(f"📝 New visitor check-in: {visitor_name}")
    print(f"🆔 Visitor ID: {visitor_id}")
    print(f"📱 Mobile: {mobile_number}")

    # Upload image to S3
    try:
        img_url = await upload_to_s3(image, visitor_id)
    except Exception as e:
        print(f"❌ Image upload failed, aborting check-in")
        raise

    # Save to database (your existing code)
    # ... database save logic ...

    print(f"✅ Visitor checked in successfully")
    print(f"{'='*60}\n")

    return {
        "message": "Visitor checked in successfully with image",
        "visitor": {
            "id": visitor_id,
            "visitor_name": visitor_name,
            "mobile_number": mobile_number,
            "email_address": email_address,
            "company": company,
            "person_to_meet": person_to_meet,
            "reason_to_visit": reason_to_visit,
            "warehouse": warehouse,
            "img_url": img_url,  # ⚠️ Make sure this is included!
            "health_declaration": health_declaration,
            "status": "WAITING",
            "check_in_time": datetime.now().isoformat(),
        }
    }
```

---

## ✅ Verification Steps

After fixing the backend:

1. **Submit a new visitor form**
2. **Check backend console logs** - Should see:
   ```
   📸 Image received: 45678 bytes
   📤 Uploading to S3: visitor-selfie/visitors/20251126103405.jpg
   ✅ Upload successful: visitors/20251126103405.jpg
   🔗 Image URL: https://visitor-selfie.s3.ap-south-1.amazonaws.com/visitors/20251126103405.jpg
   ```
3. **Verify file exists in S3:**
   ```bash
   aws s3 ls s3://visitor-selfie/visitors/20251126103405.jpg
   # Should show the file
   ```
4. **Test URL in browser:**
   ```
   https://visitor-selfie.s3.ap-south-1.amazonaws.com/visitors/20251126103405.jpg
   # Should display the image
   ```
5. **Check frontend** - Image should now load!

---

## 🎯 Quick Checklist

- [ ] S3 upload code exists and is being called
- [ ] AWS credentials are configured
- [ ] Bucket name is correct: `visitor-selfie`
- [ ] Region is correct: `ap-south-1`
- [ ] Upload doesn't fail silently (exceptions are raised)
- [ ] Backend logs show successful uploads
- [ ] Files appear in S3 bucket after upload
- [ ] S3 URLs are accessible in browser
- [ ] `img_url` field is returned in API response

---

## 📊 Expected vs Actual

### Expected Behavior ✅
```
Frontend sends image
    ↓
Backend receives image (FormData)
    ↓
Backend uploads to S3 ← ⚠️ THIS STEP IS FAILING
    ↓
S3 returns success
    ↓
Backend generates URL
    ↓
Backend saves to database with URL
    ↓
Backend returns response with img_url
    ↓
Frontend displays image from S3
```

### Actual Behavior ❌
```
Frontend sends image
    ↓
Backend receives image (FormData)
    ↓
Backend generates URL (but doesn't upload!) ← ⚠️ PROBLEM HERE
    ↓
Backend saves to database with URL
    ↓
Backend returns response with img_url
    ↓
Frontend tries to load image
    ↓
S3 returns 404 (file doesn't exist)
```

---

## 🆘 If Still Stuck

Share these details:

1. **Backend logs** when submitting visitor form
2. **S3 bucket list** output:
   ```bash
   aws s3 ls s3://visitor-selfie/visitors/
   ```
3. **Your image upload code** from the backend
4. **AWS credentials check:**
   ```bash
   aws sts get-caller-identity
   ```
5. **Any error messages** from backend console

---

## Summary

**The Issue:** Backend is returning S3 URLs but not actually uploading the images to S3.

**The Fix:** Ensure your backend's S3 upload code:
1. Actually calls `s3_client.put_object()`
2. Has proper AWS credentials configured
3. Uses correct bucket name and region
4. Doesn't silently ignore upload failures
5. Logs upload success/failure

**Test:** After fixing, manually check that files appear in S3 bucket.

Once images are actually being uploaded to S3, the frontend will display them automatically!
