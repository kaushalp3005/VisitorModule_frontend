# Warehouse QR Code URLs

## QR Code URLs for Each Warehouse

Replace `https://your-deployed-app.com` with your actual deployed application URL.

### Warehouse: W202
```
https://your-deployed-app.com/?warehouse=W202
```

### Warehouse: A185
```
https://your-deployed-app.com/?warehouse=A185
```

### Warehouse: A68
```
https://your-deployed-app.com/?warehouse=A68
```

### Warehouse: A101
```
https://your-deployed-app.com/?warehouse=A101
```

### Warehouse: F53
```
https://your-deployed-app.com/?warehouse=F53
```

---

## For Testing (Localhost)

If you want to test locally before deploying:

### Warehouse: W202
```
http://localhost:3000/?warehouse=W202
```

### Warehouse: A185
```
http://localhost:3000/?warehouse=A185
```

### Warehouse: A68
```
http://localhost:3000/?warehouse=A68
```

### Warehouse: A101
```
http://localhost:3000/?warehouse=A101
```

### Warehouse: F53
```
http://localhost:3000/?warehouse=F53
```

---

## How to Generate QR Codes

### Option 1: Online QR Generator (Easiest)

1. Go to https://www.qr-code-generator.com/ or https://qrcode-monkey.com/
2. Select "URL" type
3. Paste one of the URLs above
4. Click "Generate QR Code"
5. Download as PNG or SVG
6. Print and label with warehouse name

### Option 2: Bulk Generation with Python

Save this script as `generate_qr_codes.py`:

```python
import qrcode
import os

# Your deployed application URL
base_url = "https://your-deployed-app.com"  # Change this to your actual URL

# Warehouse names
warehouses = ["W202", "A185", "A68", "A101", "F53"]

# Create output directory
os.makedirs("warehouse_qr_codes", exist_ok=True)

# Generate QR codes
for warehouse in warehouses:
    # Create URL with warehouse parameter
    url = f"{base_url}/?warehouse={warehouse}"

    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Create image
    img = qr.make_image(fill_color="black", back_color="white")

    # Save with warehouse name
    filename = f"warehouse_qr_codes/QR_{warehouse}.png"
    img.save(filename)
    print(f"✓ Generated: {filename}")
    print(f"  URL: {url}")

print("\n✓ All QR codes generated successfully!")
print("  Location: warehouse_qr_codes/")
```

Run with:
```bash
pip install qrcode pillow
python generate_qr_codes.py
```

### Option 3: Using Online Bulk Generator

1. Go to https://www.qr-code-generator.com/
2. Generate each QR code individually using the URLs above
3. Download and save with warehouse names

---

## Printing Instructions

1. Print each QR code on A4/Letter paper
2. Add warehouse name label below each QR code
3. Laminate for durability
4. Place at respective security cabins/gates

**Recommended Size:** At least 3cm x 3cm (1.2" x 1.2") for easy scanning

---

## Testing the QR Codes

1. Use your phone's camera app to scan the QR code
2. The website should open automatically
3. Verify the warehouse name appears at the top of the check-in form
4. Complete a test check-in to ensure data is saved correctly

---

## Summary

| Warehouse | QR Code URL |
|-----------|-------------|
| W202 | `https://your-deployed-app.com/?warehouse=W202` |
| A185 | `https://your-deployed-app.com/?warehouse=A185` |
| A68 | `https://your-deployed-app.com/?warehouse=A68` |
| A101 | `https://your-deployed-app.com/?warehouse=A101` |
| F53 | `https://your-deployed-app.com/?warehouse=F53` |
