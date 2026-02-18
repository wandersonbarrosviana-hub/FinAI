from PIL import Image
import os

def crop_logo(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    # Get the bounding box of the non-white/transparent areas
    # We find areas where pixels are not fully white (255, 255, 255)
    # Actually, let's use the alpha channel if it exists, or just look for non-white
    bg = Image.new(img.mode, img.size, (255, 255, 255, 255))
    diff = Image.new("RGB", img.size)
    
    # Calculate difference from white background
    for x in range(img.width):
        for y in range(img.height):
            pixel = img.getpixel((x, y))
            if pixel[0] < 250 or pixel[1] < 250 or pixel[2] < 250: # Simple threshold
                diff.putpixel((x, y), (255, 255, 255))
            else:
                diff.putpixel((x, y), (0, 0, 0))
                
    bbox = diff.getbbox()
    if bbox:
        # Crop to the content
        cropped = img.crop(bbox)
        # Add a tiny bit of padding (optional, but let's keep it tight for "2x" effect)
        cropped.save(output_path)
        print(f"Logo cropped successfully to {bbox}")
    else:
        print("No content found to crop")

image_path = os.path.join("public", "logo.png")
output_path = os.path.join("public", "favicon-large.png")
crop_logo(image_path, output_path)
