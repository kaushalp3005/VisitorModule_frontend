# Warehouse QR Code Setup Guide

This guide explains how to generate and use warehouse QR codes for the Visitor Management System.

## 📋 Overview

The system now supports warehouse-specific check-ins via QR codes. When a visitor scans a warehouse QR code with their phone's camera app, they are directed to the check-in page with the warehouse automatically pre-filled.

## 🏭 Warehouses

The following 5 warehouses are configured:

1. **W202**
2. **A185**
3. **A68**
4. **A101**
5. **F53**

---

## 🔧 How to Generate QR Codes

### Method 1: HTML Generator (Easiest - No Installation Required)

1. **Open the HTML file:**
   - Double-click `warehouse-qr-generator.html`
   - Opens in your web browser

2. **Update the URL:**
   - Replace `https://your-deployed-app.com` with your actual deployed URL
   - Example: `https://vms.yourcompany.com`

3. **Generate QR Codes:**
   - Click "🔄 Generate QR Codes"
   - QR codes for all 5 warehouses will appear

4. **Download:**
   - Click the "⬇️ Download" button under each QR code
   - Or right-click on any QR code and select "Save Image As..."

5. **Print and Deploy:**
   - Print each QR code
   - Recommended size: 10cm x 10cm (4" x 4")
   - Laminate for durability
   - Place at respective warehouse security cabins

---

### Method 2: Python Script (For Bulk Generation)

1. **Install Requirements:**
   ```bash
   pip install qrcode[pil]
   ```

2. **Update the Script:**
   - Open `generate_warehouse_qr_codes.py`
   - Change line 11:
     ```python
     BASE_URL = "https://your-deployed-app.com"
     ```
     to your actual URL:
     ```python
     BASE_URL = "https://vms.yourcompany.com"
     ```

3. **Run the Script:**
   ```bash
   python generate_warehouse_qr_codes.py
   ```

4. **Find Generated QR Codes:**
   - Location: `warehouse_qr_codes/` folder
   - Files created for each warehouse:
     - `QR_W202.png` (simple version)
     - `QR_W202_with_label.png` (with warehouse name label)

---

### Method 3: Online QR Generator

1. **Go to any QR generator website:**
   - https://www.qr-code-generator.com/
   - https://qrcode-monkey.com/
   - https://www.the-qrcode-generator.com/

2. **For each warehouse, create a QR code with these URLs:**

   | Warehouse | URL |
   |-----------|-----|
   | W202 | `https://your-deployed-app.com/?warehouse=W202` |
   | A185 | `https://your-deployed-app.com/?warehouse=A185` |
   | A68 | `https://your-deployed-app.com/?warehouse=A68` |
   | A101 | `https://your-deployed-app.com/?warehouse=A101` |
   | F53 | `https://your-deployed-app.com/?warehouse=F53` |

   *Replace `your-deployed-app.com` with your actual domain*

3. **Download and print each QR code**

---

## 🧪 Testing QR Codes

### Local Testing (Before Deployment)

For testing on localhost, use these URLs:

| Warehouse | Localhost URL |
|-----------|--------------|
| W202 | `http://localhost:3000/?warehouse=W202` |
| A185 | `http://localhost:3000/?warehouse=A185` |
| A68 | `http://localhost:3000/?warehouse=A68` |
| A101 | `http://localhost:3000/?warehouse=A101` |
| F53 | `http://localhost:3000/?warehouse=F53` |

### Testing Steps

1. **Generate test QR code** with localhost URL
2. **Scan with phone camera**
3. **Verify:**
   - ✅ Website opens automatically
   - ✅ Warehouse badge appears at top (e.g., "W202")
   - ✅ Warehouse field is filled in the form
   - ✅ Form submits successfully with warehouse data

---

## 📱 How It Works

### User Flow

```
1. Visitor arrives at warehouse (e.g., W202)
   ↓
2. Security guard: "Please scan this QR code"
   ↓
3. Visitor scans QR with phone camera app
   ↓
4. Website opens with warehouse W202 pre-filled
   ↓
5. Visitor completes check-in form
   ↓
6. Form submits with warehouse information
   ↓
7. Admin/Approver sees warehouse in visitor details
```

### Technical Flow

```
QR Code: https://your-app.com/?warehouse=W202
   ↓
Phone Camera App scans QR
   ↓
Browser opens URL
   ↓
Page detects ?warehouse=W202 parameter
   ↓
Warehouse name extracted and displayed
   ↓
Form auto-filled with warehouse: "W202"
   ↓
Form submission includes warehouse field
   ↓
Backend stores warehouse with visitor record
```

---

## 🖨️ Printing Guidelines

### Recommended Specifications

- **Size:** 10cm x 10cm (4" x 4") or larger
- **Quality:** High resolution (300 DPI minimum)
- **Paper:** Thick cardstock or photo paper
- **Protection:** Laminate or use weatherproof sleeve

### Label Format

Create labels with:
```
┌─────────────────────┐
│   [QR CODE IMAGE]   │
│                     │
│   Warehouse W202    │
│  Scan to Check In   │
└─────────────────────┘
```

### Placement

- **Location:** Security cabin/gate entrance
- **Height:** Eye level or slightly below
- **Visibility:** Well-lit area, avoid glare
- **Protection:** Cover from rain/weather if outdoors

---

## 🔄 Updating QR Codes

If you need to change the URL or add new warehouses:

1. **Update the base URL** in the HTML generator or Python script
2. **Regenerate all QR codes**
3. **Print and replace** old QR codes
4. **Test** each new QR code before deployment

---

## ⚠️ Troubleshooting

### QR Code Doesn't Scan

- Ensure good lighting
- Clean the phone camera lens
- Hold phone steady, 15-20cm from QR code
- Try a different QR scanner app

### Wrong Warehouse Appears

- Verify the QR code URL is correct
- Regenerate the specific QR code
- Clear browser cache and rescan

### Warehouse Not Saved

- Check backend API is running
- Verify warehouse field is included in API request
- Check browser console for errors
- Ensure warehouse parameter is properly encoded

---

## 📊 Backend Integration

The warehouse field is sent to the backend API:

- **Endpoint:** `POST /api/visitors/check-in`
- **Field Name:** `warehouse`
- **Type:** String (optional)
- **Max Length:** 255 characters
- **Example Payload:**
  ```json
  {
    "visitor_name": "John Doe",
    "mobile_number": "9876543210",
    "email_address": "john@example.com",
    "company": "ABC Corp",
    "person_to_meet": "jane_smith",
    "reason_to_visit": "Business Meeting",
    "warehouse": "W202"
  }
  ```

---

## 📝 Files Included

1. **warehouse-qr-generator.html** - Web-based QR generator (no installation needed)
2. **generate_warehouse_qr_codes.py** - Python script for bulk generation
3. **warehouse-qr-codes.md** - Complete documentation with all URLs
4. **WAREHOUSE_QR_README.md** - This file

---

## 🚀 Quick Start

**Fastest way to get started:**

1. Open `warehouse-qr-generator.html` in your browser
2. Update the URL to your deployed application
3. Click "Generate QR Codes"
4. Download all 5 QR codes
5. Print, laminate, and deploy at warehouse locations
6. Test with your phone to verify

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Verify your deployed URL is correct
- Test with localhost first
- Check browser console for errors

---

## ✅ Checklist

Before deploying QR codes:

- [ ] Updated URL in generator with actual deployed domain
- [ ] Generated QR codes for all 5 warehouses
- [ ] Tested each QR code with phone camera
- [ ] Verified warehouse name appears correctly
- [ ] Completed test check-in for each warehouse
- [ ] Confirmed data is saved in backend
- [ ] Printed QR codes at correct size
- [ ] Laminated for protection
- [ ] Placed at respective warehouse locations
- [ ] Informed security guards about the new process

---

**Last Updated:** 2025-11-26
