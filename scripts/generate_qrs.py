import os
import subprocess
import sys

def install(package):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    except Exception as e:
        print(f"Failed to install {package}: {e}")

try:
    import qrcode
except ImportError:
    print("Installing required Python packages (qrcode, pillow)...")
    install("qrcode")
    install("pillow")
    import qrcode

stations = [
    {"id": "trang-an", "name": "Tràng An"},
    {"id": "tam-coc", "name": "Tam Cốc - Bích Động"},
    {"id": "hoa-lu", "name": "Cố Đô Hoa Lư"},
    {"id": "pho-co-hoa-lu", "name": "Phố Cổ Hoa Lư"},
    {"id": "hang-mua", "name": "Hang Múa"},
    {"id": "bai-dinh", "name": "Chùa Bái Đính"}
]

# Ensure output directory exists in public/ar/qr-codes
out_dir = os.path.join("public", "ar", "qr-codes")
os.makedirs(out_dir, exist_ok=True)

print(f"Generating QR codes in: {out_dir}")

for st in stations:
    data_payload = st['id']
    
    # Create QR code with high error correction (H)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data_payload)
    qr.make(fit=True)
    
    # Generate image with branding green color (#104c27)
    img = qr.make_image(fill_color="#104C27", back_color="white").convert('RGB')
    
    # Save to public directory
    filepath = os.path.join(out_dir, f"qr-{st['id']}.png")
    img.save(filepath)
    print(f"Generated: {st['id']} -> Data: {data_payload} -> {filepath}")

print("\nSuccess! All 6 QR codes generated successfully!")
