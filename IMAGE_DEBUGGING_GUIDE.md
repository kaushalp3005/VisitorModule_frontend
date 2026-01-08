# Image Loading Debugging Guide

## ✅ Changes Made

I've fixed the image loading issues by:

1. **Removed `crossOrigin="anonymous"`** - This was blocking public S3 URLs
2. **Using S3 URLs directly** - No URL manipulation, using them as-is from backend
3. **Added console logging** - You'll see success/error messages for each image
4. **Fixed visitor-pass page** - Now uses VisitorImage component
5. **Added image fields** - imageUrl, healthDeclaration, warehouse in the newRequest object

---

## 🔍 How to Debug

### Step 1: Open Browser DevTools

1. Press **F12** or **Right-click → Inspect**
2. Go to **Console** tab

### Step 2: Check What You'll See

When images load successfully:
```
✅ Thumbnail loaded successfully: https://your-s3-bucket.amazonaws.com/path/image.jpg
✅ Image loaded successfully: https://your-s3-bucket.amazonaws.com/path/image.jpg
```

When images fail:
```
❌ Thumbnail failed to load: https://your-s3-bucket.amazonaws.com/path/image.jpg
Error details: [Error object]
```

### Step 3: Check Network Tab

1. Go to **Network** tab in DevTools
2. Filter by **Img** (images only)
3. Look for your S3 URLs

**What to check:**

| Status | What it means | What to do |
|--------|--------------|------------|
| **200 OK** | ✅ Image loaded successfully | Images should display |
| **403 Forbidden** | ❌ S3 bucket permissions issue | Make bucket public or use presigned URLs |
| **404 Not Found** | ❌ Image doesn't exist in S3 | Check if upload succeeded |
| **CORS error** | ❌ CORS headers missing | Configure S3 CORS (see below) |
| **Failed** | ❌ Network issue | Check internet connection |

---

## 🐛 Common Issues & Fixes

### Issue 1: Images Not Loading (Placeholder Shows)

**Console shows:**
```
❌ Thumbnail failed to load: https://bucket.s3.amazonaws.com/image.jpg
```

**Possible causes:**

1. **S3 URL is wrong** - Check the `img_url` field in API response
2. **Image doesn't exist** - Verify file was uploaded to S3
3. **S3 permissions** - Bucket or object is not publicly accessible

**Fix:**

```bash
# Test the S3 URL directly in browser
# Copy the URL from console and paste in new tab
# If it downloads/shows: S3 is OK
# If it shows Access Denied: Fix S3 permissions
```

---

### Issue 2: CORS Error

**Console shows:**
```
Access to image at 'https://bucket.s3.amazonaws.com/image.jpg'
from origin 'http://localhost:4000' has been blocked by CORS policy
```

**Fix: Configure S3 CORS**

1. Go to AWS Console → S3 → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit**
5. Paste this:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Click **Save changes**

---

### Issue 3: 403 Forbidden Error

**Network tab shows:** `403 Forbidden`

**This means:** S3 bucket or object is not publicly accessible

**Fix Option 1: Make Bucket Public**

1. Go to AWS Console → S3 → Your Bucket
2. Click **Permissions** tab
3. Scroll to **Block public access**
4. Click **Edit** → Uncheck all boxes → **Save changes**
5. Scroll to **Bucket policy**
6. Click **Edit** and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

Replace `YOUR-BUCKET-NAME` with your actual bucket name.

7. Click **Save changes**

**Fix Option 2: Use Presigned URLs (More Secure)**

Update your backend to generate presigned URLs:

```python
import boto3
from datetime import timedelta

s3_client = boto3.client('s3')

# Generate presigned URL (valid for 7 days)
presigned_url = s3_client.generate_presigned_url(
    'get_object',
    Params={
        'Bucket': 'your-bucket-name',
        'Key': f'visitors/{visitor_id}_image.jpg'
    },
    ExpiresIn=604800  # 7 days
)

# Return this URL as img_url
```

---

### Issue 4: Image Shows in Browser but Not in App

**This means:** The URL works, but React can't load it

**Check:**

1. **Console for errors** - Any error messages?
2. **Image URL format** - Is it a valid URL?
3. **Mixed content** - HTTPS site loading HTTP image?

**Debug:**

```javascript
// Check what URL is being passed
console.log('Image URL:', visitor.img_url);

// Should be a full URL like:
// https://bucket.s3.amazonaws.com/path/image.jpg
```

---

## 📝 Checklist

Run through this checklist:

### Backend Checklist
- [ ] Backend uploads image to S3 successfully
- [ ] Backend returns `img_url` field in response
- [ ] `img_url` is a full, complete URL (starts with `https://`)
- [ ] S3 URL is accessible in browser (test by pasting URL)

### S3 Checklist
- [ ] S3 bucket exists and image is uploaded
- [ ] Bucket has public read access OR using presigned URLs
- [ ] CORS is configured to allow your frontend origin
- [ ] Image file exists at the path specified in `img_url`

### Frontend Checklist
- [ ] API response includes `img_url` field (check console)
- [ ] `imageUrl` is being set in the visitor object
- [ ] VisitorImage component receives valid `src` prop
- [ ] No console errors when image loads
- [ ] Network tab shows image request with 200 status

---

## 🧪 Test Each Component

### Test 1: Check API Response

After submitting a visitor form:

```javascript
// Check console for this log:
console.log('API Response:', data);

// Look for:
{
  visitor: {
    id: 123,
    img_url: "https://bucket.s3.amazonaws.com/visitors/123.jpg",  // ← Should be here
    ...
  }
}
```

### Test 2: Check Image URL in State

In the visitor-pass page or dashboard:

```javascript
// You should see these logs:
console.log('✅ Image loaded successfully: https://...');

// Or if error:
console.log('❌ Image failed to load: https://...');
```

### Test 3: Direct S3 Access

Copy the S3 URL from console and paste in browser address bar.

**Expected:** Image downloads or displays
**If Access Denied:** Fix S3 permissions
**If 404:** Image wasn't uploaded properly

---

## 🎯 Quick Fix Steps

If images still not loading:

1. **Open browser console (F12)**
2. **Look for red error messages**
3. **Check Network tab for failed image requests**
4. **Copy the S3 URL from console**
5. **Test URL directly in browser**
6. **If works in browser but not app:** Check console for specific error
7. **If doesn't work in browser:** Fix S3 permissions/CORS

---

## 💡 What Should Work Now

After my fixes, you should see:

### In Approver Dashboard:
- ✅ Circular thumbnails (48x48) in card headers
- ✅ Full images (192x192) when clicking "View Details"
- ✅ Loading spinner while fetching from S3
- ✅ Placeholder avatar if image fails

### In Check Status Page:
- ✅ Visitor photo (192x192) in dedicated section
- ✅ Loading spinner while fetching
- ✅ Placeholder if no image

### In Visitor Pass Page:
- ✅ Visitor photo (192x192) displayed prominently
- ✅ Loading spinner while fetching
- ✅ Placeholder if error

---

## 🔧 Still Not Working?

Share these details:

1. **Console log output** - Any errors?
2. **Network tab** - What status code for image requests?
3. **S3 URL example** - What does the `img_url` look like?
4. **S3 permissions** - Is bucket public? CORS configured?
5. **Backend response** - What does the full API response look like?

---

## 📊 Expected Console Output (Success)

```javascript
// When visitor checks in:
Submitting to: http://localhost:8000/api/visitors/check-in-with-image
Response status: 201
API Response: {
  message: "Visitor checked in successfully with image",
  visitor: {
    id: 123,
    visitor_name: "John Doe",
    img_url: "https://bucket.s3.amazonaws.com/visitors/123_image.jpg",
    ...
  }
}

// When image loads:
✅ Thumbnail loaded successfully: https://bucket.s3.amazonaws.com/visitors/123_image.jpg
✅ Image loaded successfully: https://bucket.s3.amazonaws.com/visitors/123_image.jpg
```

---

## Summary

**What I Fixed:**
- ✅ Removed `crossOrigin` attribute (was blocking public S3 URLs)
- ✅ Using S3 URLs directly without modification
- ✅ Added console logging to debug image loading
- ✅ Updated visitor-pass page to use VisitorImage component
- ✅ Added imageUrl, healthDeclaration, warehouse to stored visitor data

**What You Need to Check:**
1. Backend returns `img_url` in API response
2. S3 URLs are accessible (test in browser)
3. S3 CORS is configured
4. Console shows success messages

The images should now load! Check your browser console for the log messages.
