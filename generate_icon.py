import os
from PIL import Image

def create_maskable_icon(input_path, output_path, bg_color, size, logo_scale=0.7):
    # Open the original logo
    try:
        img = Image.open(input_path).convert("RGBA")
    except Exception as e:
        print(f"Failed to open {input_path}: {e}")
        return

    # Calculate new logo size limits
    logo_max_size = int(size * logo_scale)
    
    # Resize keeping aspect ratio
    img.thumbnail((logo_max_size, logo_max_size), Image.Resampling.LANCZOS)
    
    # Create the background image
    bg = Image.new("RGBA", (size, size), bg_color)
    
    # Calculate position to center the logo
    x = (size - img.width) // 2
    y = (size - img.height) // 2
    
    # Paste the logo on the background using the logo itself as a mask
    bg.paste(img, (x, y), img)
    
    # Save the result
    bg.save(output_path, "PNG")
    print(f"Generated {output_path} ({size}x{size})")

input_logo = r"c:\Users\comec\Downloads\FinAI-main\public\logo.png"

# We will create standard and maskable icons.
# For maskable, Google recommends logo to fit inside a inner circle (safe zone).
# logo_scale=0.7 ensures it fits well inside the mask.
bg_color = (255, 255, 255, 255) # White background

create_maskable_icon(input_logo, r"c:\Users\comec\Downloads\FinAI-main\public\pwa-192x192.png", bg_color, 192, 0.75)
create_maskable_icon(input_logo, r"c:\Users\comec\Downloads\FinAI-main\public\pwa-512x512.png", bg_color, 512, 0.75)
create_maskable_icon(input_logo, r"c:\Users\comec\Downloads\FinAI-main\public\pwa-maskable-192x192.png", bg_color, 192, 0.65)
create_maskable_icon(input_logo, r"c:\Users\comec\Downloads\FinAI-main\public\pwa-maskable-512x512.png", bg_color, 512, 0.65)
