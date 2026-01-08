# Visual Guide: Visitor Image & Health Declaration Display

## Quick Reference for What Changed

---

## 1. Check Status Page - BEFORE vs AFTER

### BEFORE:
```
┌─────────────────────────────────────┐
│ [Name]                  [Status]    │
│ Company                             │
│                                     │
│ Details Grid:                       │
│ • Company                           │
│ • Person to Meet                    │
│ • Submitted At                      │
│                                     │
│ Reason for Visit:                   │
│ Meeting about project               │
│                                     │
│ [Visitor Number if approved]        │
└─────────────────────────────────────┘
```

### AFTER:
```
┌─────────────────────────────────────┐
│ [Name]                  [Status]    │
│ Company                             │
│                                     │
│ Details Grid:                       │
│ • Company                           │
│ • Person to Meet                    │
│ • Submitted At                      │
│                                     │
│ Reason for Visit:                   │
│ Meeting about project               │
│                                     │
│ Warehouse: ━━━━━━━━━━━━━━━ NEW     │
│ W202                                │
│                                     │
│ Visitor Photo: ━━━━━━━━━━━ NEW     │
│ ┌──────────┐                        │
│ │          │                        │
│ │  Photo   │ 192x192px              │
│ │          │                        │
│ └──────────┘                        │
│                                     │
│ Health & Safety Declaration: ━ NEW │
│ ┌─────────────────────────────┐    │
│ │ ✅ Healthy                   │    │
│ │                             │    │
│ │ Current Health Status:      │    │
│ │ • Respiratory: No ✓         │    │
│ │ • Skin Infection: No ✓      │    │
│ │ • Gastrointestinal: No ✓    │    │
│ │ • ENT Infection: No ✓       │    │
│ │ • Viral Fever: No ✓         │    │
│ │ • COVID-19: No ✓            │    │
│ │                             │    │
│ │ Past Medical History:       │    │
│ │ • Had Past Illness: No ✓    │    │
│ │                             │    │
│ │ Travel History:             │    │
│ │ • Foreign Travel: Yes ⚠️    │    │
│ │   📍 USA in November 2024   │    │
│ │   💉 Vaccinated: Yes ✓      │    │
│ │                             │    │
│ │ COVID-19 Status:            │    │
│ │ • Recent COVID: No ✓        │    │
│ │ • Vaccination: Fully ✅     │    │
│ │                             │    │
│ │ Safety Acknowledgments:     │    │
│ │ ✅ All guidelines accepted  │    │
│ │ ✓ Protective Clothing       │    │
│ │ ✓ Food and Drinks           │    │
│ │ ✓ Jewelry/Watches           │    │
│ │ ✓ Personal Hygiene          │    │
│ │ ✓ Perfume/Nails             │    │
│ │ ✓ Hygiene Norms             │    │
│ └─────────────────────────────┘    │
│                                     │
│ [Visitor Number if approved]        │
└─────────────────────────────────────┘
```

---

## 2. Approver Dashboard - Card Preview

### BEFORE:
```
┌──────────────────────────────────────┐
│ [Name]              [Pending Badge]  │
│ Company Name                         │
│                                      │
│ Mobile: 9876543210                   │
│ Email: visitor@example.com           │
│ Reason: Meeting about project        │
│ Submitted: 25 Nov 2025, 10:30 AM     │
│ Person to Meet: Yash - CEO           │
│                                      │
│ [Approve] [Reject] [View Details]    │
└──────────────────────────────────────┘
```

### AFTER:
```
┌──────────────────────────────────────┐
│  ╭─────╮                              │
│  │     │ [Name]      [Pending Badge] │  ← NEW: Photo thumbnail
│  │Photo│ Company Name                 │
│  │     │                              │
│  ╰─────╯                              │
│                                      │
│ Mobile: 9876543210                   │
│ Email: visitor@example.com           │
│ Reason: Meeting about project        │
│ Submitted: 25 Nov 2025, 10:30 AM     │
│ Person to Meet: Yash - CEO           │
│                                      │
│ [Approve] [Reject] [View Details]    │
└──────────────────────────────────────┘
```

---

## 3. Approver Dashboard - Expanded Details View

### BEFORE:
```
┌──────────────────────────────────────┐
│ [Name]              [Pending Badge]  │
│ Company Name                         │
│                                      │
│ ╔════════════════════════════════╗  │
│ ║ Full Details                    ║  │
│ ║                                 ║  │
│ ║ Name: John Doe                  ║  │
│ ║ Mobile: 9876543210              ║  │
│ ║ Email: visitor@example.com      ║  │
│ ║ Company: ABC Corp               ║  │
│ ║ Person to Meet: Yash - CEO      ║  │
│ ║ Reason: Meeting                 ║  │
│ ║ Request ID: VIS-123             ║  │
│ ║ Submitted: 25 Nov, 10:30 AM     ║  │
│ ╚════════════════════════════════╝  │
│                                      │
│ [Approve] [Reject] [Hide Details]    │
└──────────────────────────────────────┘
```

### AFTER:
```
┌──────────────────────────────────────┐
│  ╭─────╮                              │
│  │     │ [Name]      [Pending Badge] │
│  │Photo│ Company Name                 │
│  │     │                              │
│  ╰─────╯                              │
│                                      │
│ ╔════════════════════════════════╗  │
│ ║ Full Details                    ║  │
│ ║                                 ║  │
│ ║ Name: John Doe                  ║  │
│ ║ Mobile: 9876543210              ║  │
│ ║ Email: visitor@example.com      ║  │
│ ║ Company: ABC Corp               ║  │
│ ║ Person to Meet: Yash - CEO      ║  │
│ ║ Warehouse: W202    ━━━━━━━ NEW ║  │
│ ║ Reason: Meeting                 ║  │
│ ║ Request ID: VIS-123             ║  │
│ ║ Submitted: 25 Nov, 10:30 AM     ║  │
│ ╠════════════════════════════════╣  │
│ ║ Visitor Photo: ━━━━━━━━━━━ NEW ║  │
│ ║ ┌──────────┐                    ║  │
│ ║ │          │                    ║  │
│ ║ │  Photo   │ 192x192px          ║  │
│ ║ │          │                    ║  │
│ ║ └──────────┘                    ║  │
│ ╠════════════════════════════════╣  │
│ ║ Health & Safety Declaration:    ║  │
│ ║ ━━━━━━━━━━━━━━━━━━━━━━━━━ NEW ║  │
│ ║ ┌───────────────────────────┐  ║  │
│ ║ │ ✅ Healthy                 │  ║  │
│ ║ │                           │  ║  │
│ ║ │ Current Health Status:    │  ║  │
│ ║ │ • Respiratory: No ✓       │  ║  │
│ ║ │ • Skin Infection: No ✓    │  ║  │
│ ║ │ • Gastrointestinal: No ✓  │  ║  │
│ ║ │ • ENT Infection: No ✓     │  ║  │
│ ║ │ • Viral Fever: No ✓       │  ║  │
│ ║ │ • COVID-19: No ✓          │  ║  │
│ ║ │                           │  ║  │
│ ║ │ [Past Medical History]    │  ║  │
│ ║ │ [Travel History]          │  ║  │
│ ║ │ [COVID-19 Status]         │  ║  │
│ ║ │ [Safety Acknowledgments]  │  ║  │
│ ║ └───────────────────────────┘  ║  │
│ ╚════════════════════════════════╝  │
│                                      │
│ [Approve] [Reject] [Hide Details]    │
└──────────────────────────────────────┘
```

---

## 4. Health Declaration Component Breakdown

```
┌─────────────────────────────────────────────────────┐
│ Health & Safety Declaration    [✅ Healthy]         │ ← Badge changes based on health
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐│
│ │ Current Health Status                           ││
│ │                                                 ││
│ │ Respiratory Ailment:     No ✓                   ││ ← Green checkmark = No
│ │ Skin Infection:          No ✓                   ││
│ │ Gastrointestinal:        Yes ✗                  ││ ← Red X = Yes
│ │ ENT Infection:           No ✓                   ││
│ │ Viral Fever/Dengue:      No ✓                   ││
│ │ COVID-19:                No ✓                   ││
│ └─────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────┐│
│ │ Past Medical History (Last 4 Months)            ││
│ │                                                 ││
│ │ Had Past Illness: Yes ⚠️                        ││
│ │ ┌─────────────────────────────────────────────┐││
│ │ │ Details:                                    │││ ← Yellow box for details
│ │ │ Had dengue fever in October 2024, fully    │││
│ │ │ recovered                                   │││
│ │ └─────────────────────────────────────────────┘││
│ └─────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────┐│
│ │ Travel History (Last 6 Months)                  ││
│ │                                                 ││
│ │ Foreign Travel: Yes ⚠️                          ││
│ │ ┌─────────────────────────────────────────────┐││
│ │ │ Details:                                    │││ ← Blue box for travel
│ │ │ USA in November 2024                        │││
│ │ └─────────────────────────────────────────────┘││
│ │ Vaccinated for travel: Yes ✓                    ││
│ └─────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────┐│
│ │ COVID-19 Status                                 ││
│ │                                                 ││
│ │ Recent COVID (2 months):  No ✓                  ││
│ │ Vaccination Status:       Fully Vaccinated ✅   ││ ← Color coded
│ └─────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────┐│
│ │ Safety Guidelines Acknowledgment                ││
│ │                                                 ││
│ │ ✅ All safety guidelines acknowledged           ││ ← Overall status
│ │                                                 ││
│ │ Protective Clothing              ✓              ││ ← Individual checks
│ │ Food and Drinks Policy           ✓              ││
│ │ Jewelry/Watches Policy           ✓              ││
│ │ Personal Hygiene Standards       ✓              ││
│ │ Perfume/Nails Policy             ✓              ││
│ │ Hygiene Norms Compliance         ✓              ││
│ └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## 5. Color Coding Reference

### Status Badges:
| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| ✅ Healthy | Green | Checkmark circle | No current health issues |
| ⚠️ Health Issue Reported | Red | X circle | Has health condition(s) |

### Individual Health Items:
| Value | Display | Color | Icon |
|-------|---------|-------|------|
| No | No ✓ | Green text | Checkmark |
| Yes | Yes ✗ | Red text | X mark |

### Vaccination Status:
| Status | Color | Display |
|--------|-------|---------|
| Fully | Green | Fully Vaccinated ✅ |
| Partially | Yellow | Partially Vaccinated ⚠️ |
| None | Red | Not Vaccinated ❌ |

### Details Boxes:
| Type | Background | Border | Text |
|------|------------|--------|------|
| Past Illness | Yellow-50 | Yellow-200 | Yellow-900 |
| Travel Info | Blue-50 | Blue-200 | Blue-900 |
| Safety Complete | Green-50 | Green-200 | Green-800 |
| Safety Incomplete | Red-50 | Red-200 | Red-800 |

---

## 6. Image Sizes & Styles

### Thumbnail (Cards):
```
┌─────┐
│     │  48x48 pixels
│  👤 │  Circular (rounded-full)
│     │  Border: 2px
└─────┘
```

### Full Size (Details):
```
┌──────────┐
│          │
│          │  192x192 pixels
│    👤    │  Rounded corners (rounded-lg)
│          │  Border: 2px
│          │  Object-fit: cover
└──────────┘
```

---

## 7. Responsive Breakpoints

### Mobile (< 640px):
- Health conditions: 1 column
- Full-width images
- Stacked layouts
- Compact spacing

### Tablet (640px - 1024px):
- Health conditions: 2 columns
- Side-by-side grids
- Comfortable spacing

### Desktop (> 1024px):
- Dashboard cards: 2 columns (lg:grid-cols-2)
- Optimized layouts
- Maximum readability

---

## 8. When Sections Appear

| Section | Condition | Display |
|---------|-----------|---------|
| Thumbnail Photo | `request.imageUrl` exists | Always shown in card if available |
| Warehouse | `request.warehouse` exists | Separate labeled section |
| Full Size Photo | `request.imageUrl` exists + Details expanded | 192x192px image |
| Health Declaration | `request.healthDeclaration` exists + Details expanded | Full component |
| Travel Details Box | `hasForeignTravel === true` | Blue box with details |
| Past Illness Box | `hadPastIllness === true` | Yellow box with details |

---

## 9. User Journey

### Visitor Checks Status:
1. Enter mobile number or reference ID
2. Click "Check Status"
3. **SEE**: Status card with:
   - ✨ Their selfie photo
   - 📍 Warehouse (if scanned QR)
   - 🏥 Health declaration summary
   - ✅ Approval status

### Approver Reviews Request:
1. Login to dashboard
2. Go to "Pending" tab
3. **SEE**: Cards with:
   - ✨ Visitor photo thumbnail
   - Quick info preview
4. Click "View Details"
5. **SEE**: Expanded view with:
   - ✨ Larger photo for identification
   - 🏥 Complete health declaration
   - 📊 Visual health indicators
6. Make decision: Approve or Reject

---

## 10. Data Flow

```
┌─────────────────┐
│ Visitor Submit  │
│ Form (page.tsx) │
└────────┬────────┘
         │
         │ FormData with:
         │ • visitor_name
         │ • mobile_number
         │ • image (Blob)
         │ • health_declaration (JSON string)
         │ • warehouse
         │
         ▼
┌─────────────────────────┐
│ Backend API             │
│ /check-in-with-image    │
└────────┬────────────────┘
         │
         │ Stores:
         │ • Visitor data
         │ • Uploads image → generates URL
         │ • Saves health_declaration JSON
         │
         ▼
┌─────────────────────────┐
│ Database                │
│ visitors table          │
│ • id                    │
│ • visitor_name          │
│ • mobile_number         │
│ • image_url ← NEW       │
│ • health_declaration ←  │
│ • warehouse ← NEW       │
└────────┬────────────────┘
         │
         │ API Returns:
         │ {
         │   visitor: {
         │     id: 123,
         │     image_url: "http://...",
         │     health_declaration: "{...}",
         │     warehouse: "W202"
         │   }
         │ }
         │
         ▼
┌─────────────────────────┐
│ Frontend                │
│ • status/page.tsx       │
│ • dashboard/page.tsx    │
└────────┬────────────────┘
         │
         │ Maps to VisitorRequest:
         │ • imageUrl
         │ • healthDeclaration
         │ • warehouse
         │
         ▼
┌─────────────────────────┐
│ Components              │
│ • visitor-request-card  │
│ • health-declaration-   │
│   display               │
└─────────────────────────┘
         │
         │ Renders:
         │ • <img src={imageUrl} />
         │ • <HealthDeclarationDisplay
         │     healthDeclaration={JSON.parse(...)} />
         │
         ▼
┌─────────────────────────┐
│ User Sees:              │
│ ✨ Photo                │
│ 🏥 Health Info          │
│ 📍 Warehouse            │
└─────────────────────────┘
```

---

## Summary

### What the Visitor Sees:
- ✅ Their photo on status check
- ✅ Complete health declaration
- ✅ Warehouse they'll visit
- ✅ Professional, clear UI

### What the Approver Sees:
- ✅ Visitor photo thumbnail (quick ID)
- ✅ Full photo in details (verification)
- ✅ Complete health screening info
- ✅ Visual health indicators
- ✅ All safety acknowledgments
- ✅ Make informed, safe decisions

### Implementation Status:
- ✅ All components created
- ✅ All pages updated
- ✅ Types defined
- ✅ Responsive design complete
- ⏳ Waiting for backend CORS fix
- ⏳ Ready for testing

---

**Next:** Fix CORS on backend, test the complete flow!
