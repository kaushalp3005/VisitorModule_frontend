#!/usr/bin/env python3
"""
Warehouse QR Code Generator
Generates QR codes for visitor management system warehouse locations
"""

import qrcode
import os
from PIL import Image, ImageDraw, ImageFont

# Configuration
BASE_URL = "https://your-deployed-app.com"  # Change this to your actual deployed URL
WAREHOUSES = ["W202", "A185", "A68", "A101", "F53"]
OUTPUT_DIR = "warehouse_qr_codes"

# QR Code settings
QR_BOX_SIZE = 10
QR_BORDER = 4


def create_qr_with_label(warehouse_name, url, output_path):
    """
    Generate a QR code with a label underneath
    """
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction
        box_size=QR_BOX_SIZE,
        border=QR_BORDER,
    )
    qr.add_data(url)
    qr.make(fit=True)

    # Create QR code image
    qr_img = qr.make_image(fill_color="black", back_color="white")

    # Convert to RGB for adding label
    qr_img = qr_img.convert('RGB')

    # Calculate dimensions for final image with label
    qr_width, qr_height = qr_img.size
    label_height = 80
    final_height = qr_height + label_height

    # Create new image with space for label
    final_img = Image.new('RGB', (qr_width, final_height), 'white')

    # Paste QR code
    final_img.paste(qr_img, (0, 0))

    # Draw label
    draw = ImageDraw.Draw(final_img)

    # Try to use a nice font, fallback to default if not available
    try:
        font_large = ImageFont.truetype("arial.ttf", 40)
        font_small = ImageFont.truetype("arial.ttf", 16)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Draw warehouse name
    text = f"Warehouse: {warehouse_name}"
    bbox = draw.textbbox((0, 0), text, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_x = (qr_width - text_width) // 2
    text_y = qr_height + 10
    draw.text((text_x, text_y), text, fill='black', font=font_large)

    # Draw instruction text
    instruction = "Scan to check in"
    bbox2 = draw.textbbox((0, 0), instruction, font=font_small)
    text_width2 = bbox2[2] - bbox2[0]
    text_x2 = (qr_width - text_width2) // 2
    text_y2 = text_y + 50
    draw.text((text_x2, text_y2), instruction, fill='gray', font=font_small)

    # Save final image
    final_img.save(output_path, quality=95)


def generate_simple_qr(warehouse_name, url, output_path):
    """
    Generate a simple QR code without label (fallback)
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=QR_BOX_SIZE,
        border=QR_BORDER,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_path)


def main():
    """
    Main function to generate all warehouse QR codes
    """
    print("=" * 60)
    print("Warehouse QR Code Generator")
    print("=" * 60)
    print()

    # Create output directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"✓ Created directory: {OUTPUT_DIR}/")
    else:
        print(f"✓ Using existing directory: {OUTPUT_DIR}/")
    print()

    # Generate QR codes
    print("Generating QR codes...")
    print("-" * 60)

    for warehouse in WAREHOUSES:
        # Create URL
        url = f"{BASE_URL}/?warehouse={warehouse}"

        # Output file paths
        filename_with_label = f"QR_{warehouse}_with_label.png"
        filename_simple = f"QR_{warehouse}.png"

        path_with_label = os.path.join(OUTPUT_DIR, filename_with_label)
        path_simple = os.path.join(OUTPUT_DIR, filename_simple)

        # Generate QR code with label
        try:
            create_qr_with_label(warehouse, url, path_with_label)
            print(f"✓ {warehouse:6} → {filename_with_label}")
        except Exception as e:
            print(f"⚠ {warehouse:6} → Label version failed: {str(e)}")

        # Generate simple QR code
        try:
            generate_simple_qr(warehouse, url, path_simple)
            print(f"  {' ':6}   {filename_simple}")
        except Exception as e:
            print(f"✗ {warehouse:6} → Failed: {str(e)}")

        print(f"  URL: {url}")
        print()

    print("-" * 60)
    print(f"✓ All QR codes generated successfully!")
    print(f"  Location: {os.path.abspath(OUTPUT_DIR)}/")
    print()
    print("Files generated for each warehouse:")
    print("  - QR_[warehouse].png (simple QR code)")
    print("  - QR_[warehouse]_with_label.png (QR code with label)")
    print()
    print("Next steps:")
    print("  1. Update BASE_URL in this script with your deployed URL")
    print("  2. Print the QR codes (recommended size: 10cm x 10cm)")
    print("  3. Laminate for durability")
    print("  4. Place at respective warehouse security cabins")
    print()
    print("=" * 60)


if __name__ == "__main__":
    # Check if qrcode is installed
    try:
        import qrcode
    except ImportError:
        print("Error: qrcode module not found")
        print("Please install it with: pip install qrcode[pil]")
        exit(1)

    main()
