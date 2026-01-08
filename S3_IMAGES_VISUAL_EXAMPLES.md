# S3 Images - Visual Examples

## What You'll See After Implementation

---

## 1. Approver Dashboard - Card View

### Before Clicking "View Details"

```
┌────────────────────────────────────────────┐
│  ╭─────╮                                   │
│  │     │  John Doe         [Pending]       │
│  │  📸 │  ABC Corporation                  │  ← S3 Image Thumbnail
│  │     │                                   │     (48x48, circular)
│  ╰─────╯                                   │
│                                            │
│  Mobile: 9876543210                        │
│  Email: john@example.com                   │
│  Reason: Meeting about project             │
│  Submitted: 26 Nov 2025, 10:30 AM          │
│  Person to Meet: Yash - CEO                │
│                                            │
│  [Approve] [Reject] [View Details]         │
└────────────────────────────────────────────┘
```

**What happens:**
1. Component fetches image from S3 URL
2. Shows spinner (⟳) for ~100-500ms
3. Image loads and appears
4. If S3 fails: Shows person icon (👤) instead

---

## 2. Approver Dashboard - Details Expanded

### After Clicking "View Details"

```
┌────────────────────────────────────────────┐
│  ╭─────╮                                   │
│  │     │  John Doe         [Pending]       │
│  │  📸 │  ABC Corporation                  │
│  │     │                                   │
│  ╰─────╯                                   │
│                                            │
│  ╔══════════════════════════════════════╗ │
│  ║ Full Details                         ║ │
│  ║                                      ║ │
│  ║ Name: John Doe                       ║ │
│  ║ Mobile: 9876543210                   ║ │
│  ║ Email: john@example.com              ║ │
│  ║ Company: ABC Corporation             ║ │
│  ║ Person to Meet: Yash - CEO           ║ │
│  ║ Warehouse: W202                      ║ │
│  ║ Reason: Meeting                      ║ │
│  ║ Request ID: VIS-123                  ║ │
│  ║ Submitted: 26 Nov, 10:30 AM          ║ │
│  ║                                      ║ │
│  ║ ─────────────────────────────────── ║ │
│  ║ Visitor Photo:                       ║ │
│  ║                                      ║ │
│  ║ ┌────────────────────┐               ║ │
│  ║ │                    │               ║ │
│  ║ │                    │               ║ │
│  ║ │   Visitor Photo    │  ← S3 Image  ║ │
│  ║ │   from S3 Bucket   │     192x192  ║ │
│  ║ │                    │               ║ │
│  ║ │                    │               ║ │
│  ║ └────────────────────┘               ║ │
│  ║                                      ║ │
│  ║ ─────────────────────────────────── ║ │
│  ║ Health & Safety Declaration:         ║ │
│  ║ ┌──────────────────────────────────┐ ║ │
│  ║ │ ✅ Healthy                        │ ║ │
│  ║ │                                  │ ║ │
│  ║ │ Current Health Status:           │ ║ │
│  ║ │ • Respiratory: No ✓              │ ║ │
│  ║ │ • Skin Infection: No ✓           │ ║ │
│  ║ │ [... more health info ...]       │ ║ │
│  ║ └──────────────────────────────────┘ ║ │
│  ╚══════════════════════════════════════╝ │
│                                            │
│  [Approve] [Reject] [Hide Details]         │
└────────────────────────────────────────────┘
```

---

## 3. Check Status Page

### When Visitor Checks Their Status

```
┌──────────────────────────────────────────────┐
│ John Doe                      [Pending]      │
│                                              │
│ Details Grid:                                │
│ ┌──────────────┬──────────────────────────┐ │
│ │ Company      │ ABC Corporation          │ │
│ │ Person       │ Yash - CEO               │ │
│ │ Submitted    │ 26 Nov 2025, 10:30 AM    │ │
│ └──────────────┴──────────────────────────┘ │
│                                              │
│ Reason for Visit:                            │
│ Meeting about new project proposal           │
│                                              │
│ ───────────────────────────────────────────  │
│ Warehouse:                                   │
│ W202                                         │
│                                              │
│ ───────────────────────────────────────────  │
│ Visitor Photo:                               │
│                                              │
│ ┌────────────────────┐                       │
│ │                    │                       │
│ │                    │                       │
│ │   Your Photo       │  ← S3 Image          │
│ │   from Check-in    │     192x192          │
│ │                    │                       │
│ │                    │                       │
│ └────────────────────┘                       │
│                                              │
│ ───────────────────────────────────────────  │
│ Health & Safety Declaration:                 │
│ ┌──────────────────────────────────────────┐ │
│ │ ✅ Healthy                                │ │
│ │                                          │ │
│ │ Current Health Status:                   │ │
│ │ • Respiratory Ailment:       No ✓        │ │
│ │ • Skin Infection:            No ✓        │ │
│ │ • Gastrointestinal Ailment:  No ✓        │ │
│ │ • ENT Infection:             No ✓        │ │
│ │ • Viral Fever:               No ✓        │ │
│ │ • COVID-19:                  No ✓        │ │
│ │                                          │ │
│ │ Past Medical History:                    │ │
│ │ Had Past Illness: No ✓                   │ │
│ │                                          │ │
│ │ Travel History:                          │ │
│ │ Foreign Travel: Yes ⚠️                   │ │
│ │ ┌────────────────────────────────────┐  │ │
│ │ │ Details: USA in November 2024      │  │ │
│ │ └────────────────────────────────────┘  │ │
│ │ Vaccinated for travel: Yes ✓            │ │
│ │                                          │ │
│ │ COVID-19 Status:                         │ │
│ │ • Recent COVID (2 months):  No ✓         │ │
│ │ • Vaccination Status:       Fully ✅     │ │
│ │                                          │ │
│ │ Safety Guidelines Acknowledgment:        │ │
│ │ ✅ All safety guidelines acknowledged    │ │
│ │ ✓ Protective Clothing                   │ │
│ │ ✓ Food and Drinks Policy                │ │
│ │ ✓ Jewelry/Watches Policy                │ │
│ │ ✓ Personal Hygiene Standards            │ │
│ │ ✓ Perfume/Nails Policy                  │ │
│ │ ✓ Hygiene Norms Compliance              │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ───────────────────────────────────────────  │
│ 🟡 Your request is awaiting approval         │
│                                              │
│ [Call Yash - CEO]                            │
│ [Submit Another Request]                     │
└──────────────────────────────────────────────┘
```

---

## 4. Loading States - Real-Time View

### State 1: Image Loading (First 100-500ms)

```
┌────────────┐
│            │
│            │
│     ⟳      │  ← Spinning animation
│            │
│            │
└────────────┘
```

### State 2: Image Loaded (After S3 Fetch)

```
┌────────────┐
│  ╭──────╮  │
│  │      │  │
│  │ 📸   │  │  ← Actual photo fades in
│  │      │  │     smoothly
│  ╰──────╯  │
└────────────┘
```

### State 3: Image Failed / No Image

```
┌────────────┐
│            │
│            │
│     👤     │  ← Default avatar icon
│            │
│            │
└────────────┘
```

---

## 5. Real S3 URL Example

### What Backend Returns

```json
{
  "visitor": {
    "id": 123,
    "visitor_name": "John Doe",
    "mobile_number": "9876543210",
    "email_address": "john@example.com",
    "company": "ABC Corporation",
    "image_url": "https://vms-visitor-photos.s3.ap-south-1.amazonaws.com/visitors/20251126_123_selfie.jpg",
    "health_declaration": "{\"hasRespiratoryAilment\":false,...}",
    "warehouse": "W202",
    "status": "WAITING",
    ...
  }
}
```

### What Browser Fetches

```
GET https://vms-visitor-photos.s3.ap-south-1.amazonaws.com/visitors/20251126_123_selfie.jpg

Request Headers:
  Origin: http://localhost:4000

Response Headers:
  Access-Control-Allow-Origin: http://localhost:4000
  Content-Type: image/jpeg
  Content-Length: 45678

Status: 200 OK
```

### What User Sees

```
┌────────────────────┐
│  ╭──────────────╮  │
│  │              │  │
│  │   [Actual    │  │
│  │   visitor    │  │  ← Photo loaded from S3
│  │   selfie]    │  │
│  │              │  │
│  ╰──────────────╯  │
└────────────────────┘
```

---

## 6. Mobile View

### Dashboard Card (Mobile)

```
┌─────────────────────────┐
│ ╭───╮                   │
│ │📸 │ John Doe          │
│ ╰───╯ ABC Corp          │
│       [Pending]         │
│                         │
│ Mobile: 9876543210      │
│ Email: john@example.com │
│ Reason: Meeting         │
│                         │
│ [Approve]  [Reject]     │
│ [View Details]          │
└─────────────────────────┘
```

### Details View (Mobile - Expanded)

```
┌─────────────────────────┐
│ ╭───╮                   │
│ │📸 │ John Doe          │
│ ╰───╯ ABC Corp          │
│       [Pending]         │
│                         │
│ ╔═══════════════════╗   │
│ ║ Full Details      ║   │
│ ║                   ║   │
│ ║ [All visitor info]║   │
│ ║                   ║   │
│ ║ Visitor Photo:    ║   │
│ ║ ┌───────────┐     ║   │
│ ║ │           │     ║   │
│ ║ │   Photo   │     ║   │
│ ║ │           │     ║   │
│ ║ └───────────┘     ║   │
│ ║                   ║   │
│ ║ Health Info:      ║   │
│ ║ [Health details]  ║   │
│ ╚═══════════════════╝   │
│                         │
│ [Approve] [Reject]      │
│ [Hide Details]          │
└─────────────────────────┘
```

---

## 7. Component Code Examples

### How Images Are Rendered

#### Thumbnail in Card

```tsx
// components/visitor-request-card.tsx
<VisitorThumbnail
  src="https://bucket.s3.amazonaws.com/visitor.jpg"
  alt="Photo of John Doe"
/>

// Renders as:
// [Spinner] → [Image loads] → [Fade in]
// Or: [Show placeholder if error]
```

#### Full Image in Details

```tsx
// components/visitor-request-card.tsx
<VisitorImage
  src="https://bucket.s3.amazonaws.com/visitor.jpg"
  alt="Photo of John Doe"
  size="medium"
/>

// Renders as:
// ┌────────────┐
// │            │
// │   Photo    │  192x192px
// │            │
// └────────────┘
```

#### Status Page Image

```tsx
// app/status/page.tsx
<VisitorImage
  src={foundRequest.imageUrl}
  alt={`Photo of ${foundRequest.name}`}
  size="medium"
/>

// Same 192x192px display
```

---

## 8. Error Scenarios - What Users See

### Scenario 1: S3 Image Loads Successfully ✅

```
User experience:
1. Page loads
2. Brief spinner (⟳) for ~200ms
3. Image fades in smoothly
4. User sees actual photo

Console: No errors
Network: 200 OK
```

### Scenario 2: S3 CORS Not Configured ❌

```
User experience:
1. Page loads
2. Spinner appears
3. After ~1 second, placeholder avatar appears
4. User sees default icon (👤) instead of photo

Console: CORS policy error
Network: Request failed
```

**Fix:** Configure S3 CORS (see S3_IMAGE_INTEGRATION.md)

### Scenario 3: S3 Image Not Found (404) ❌

```
User experience:
1. Page loads
2. Spinner appears
3. Placeholder avatar appears immediately
4. User sees default icon (👤)

Console: 404 Not Found
Network: 404 status
```

**Fix:** Verify image exists in S3 at correct path

### Scenario 4: No image_url in Backend Response

```
User experience:
1. Page loads
2. Placeholder avatar appears immediately
3. No loading spinner
4. User sees default icon (👤)

Console: No errors
Network: No image request made
```

**Expected:** This is normal for visitors without photos

---

## 9. Production Examples

### With CloudFront CDN (Recommended)

```
Backend returns:
{
  "image_url": "https://d1234567890.cloudfront.net/visitors/123.jpg"
}

User sees:
- Faster loading (50-200ms)
- Better caching
- Lower S3 costs
```

### Direct S3 (Current)

```
Backend returns:
{
  "image_url": "https://bucket.s3.ap-south-1.amazonaws.com/visitors/123.jpg"
}

User sees:
- Slower loading (300-800ms)
- Works fine for development
```

---

## 10. Browser Developer Tools View

### Network Tab - Successful Load

```
Name: 123_selfie.jpg
Status: 200
Type: jpeg
Size: 48.2 KB
Time: 234 ms
Initiator: visitor-image.tsx:42

Response Headers:
  access-control-allow-origin: http://localhost:4000
  content-type: image/jpeg
  etag: "d41d8cd98f00b204e9800998ecf8427e"
```

### Console - No Errors

```
> Submitting to: http://localhost:8000/api/visitors/check-in-with-image
> Response status: 201
> API Response: {visitor: {id: 123, image_url: "https://...", ...}}
```

---

## Summary - What You'll See

### Approver Dashboard
- ✅ Circular photo thumbnails (48x48) in all cards
- ✅ Full photos (192x192) in expanded details
- ✅ Loading spinners while fetching from S3
- ✅ Placeholder avatars if images fail to load
- ✅ Smooth fade-in animations

### Check Status Page
- ✅ Visitor's photo (192x192) in dedicated section
- ✅ Always shows (placeholder if no image)
- ✅ Works for both mobile and reference ID search

### User Experience
- ✅ Professional, polished interface
- ✅ Fast loading with spinners
- ✅ Graceful error handling
- ✅ Accessible with alt text
- ✅ Responsive on all devices

**Ready to use with S3 image URLs from your backend!**
