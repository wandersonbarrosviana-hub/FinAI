import sys
from PIL import Image

def analyze_image(path):
    try:
        img = Image.open(path).convert("RGBA")
        bbox = img.getbbox()
        width, height = img.size
        print(f"Image: {path}")
        print(f"Size: {width}x{height}")
        print(f"Non-transparent bounding box: {bbox}")
        
        if bbox:
            content_w = bbox[2] - bbox[0]
            content_h = bbox[3] - bbox[1]
            print(f"Content width: {content_w} ({content_w/width*100:.1f}%)")
            print(f"Content height: {content_h} ({content_h/height*100:.1f}%)")
    except Exception as e:
        print(f"Error: {e}")

analyze_image(r"c:\Users\comec\Downloads\FinAI-main\public\pwa-512x512.png")
analyze_image(r"c:\Users\comec\Downloads\FinAI-main\public\pwa-192x192.png")
analyze_image(r"c:\Users\comec\Downloads\FinAI-main\public\logo.png")
