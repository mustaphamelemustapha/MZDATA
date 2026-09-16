import os
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def get_font(size):
    font_path = "Roboto-Bold.ttf"
    if not os.path.exists(font_path):
        url = "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Bold.ttf"
        urllib.request.urlretrieve(url, font_path)
    return ImageFont.truetype(font_path, size)

def create_framed_screenshot(input_path, output_path, heading, subheading, bg_color, canvas_size):
    try:
        canvas_w, canvas_h = canvas_size
        canvas = Image.new('RGB', (canvas_w, canvas_h), bg_color)
        draw = ImageDraw.Draw(canvas)
        
        # Adjust fonts and positions based on canvas height/width
        is_tall = canvas_h > 2300
        
        # Load fonts
        try:
            heading_font = get_font(84 if is_tall else 76)
            subheading_font = get_font(48 if is_tall else 44)
        except Exception:
            heading_font = ImageFont.load_default()
            subheading_font = ImageFont.load_default()

        # Assuming text is white or dark based on background
        text_color = (255, 255, 255) if bg_color != (204, 255, 0) else (15, 23, 42)
        
        # Text y-positions
        heading_y = 200 if is_tall else 160
        subheading_y = 320 if is_tall else 270
        
        # Heading
        try:
            _, _, w, h = draw.textbbox((0, 0), heading, font=heading_font)
        except:
            w, h = heading_font.getsize(heading)
        draw.text(((canvas_w - w) / 2, heading_y), heading, font=heading_font, fill=text_color)
        
        # Subheading
        try:
            _, _, w2, h2 = draw.textbbox((0, 0), subheading, font=subheading_font)
        except:
            w2, h2 = subheading_font.getsize(subheading)
        draw.text(((canvas_w - w2) / 2, subheading_y), subheading, font=subheading_font, fill=text_color)

        # Load Screenshot
        with Image.open(input_path) as ss:
            ss = ss.convert("RGBA")
            
            # Target width proportional to canvas width
            target_w = int(canvas_w * 0.82)
            ratio = target_w / ss.width
            target_h = int(ss.height * ratio)
            
            # Crop screenshot height if it exceeds canvas (not typical for these aspect ratios)
            max_h = canvas_h - subheading_y - 100
            
            ss = ss.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            # Create rounded corners mask
            mask = Image.new("L", ss.size, 0)
            draw_mask = ImageDraw.Draw(mask)
            radius = 50 if is_tall else 40
            draw_mask.rounded_rectangle((0, 0, target_w, target_h), radius=radius, fill=255)
            ss.putalpha(mask)
            
            # Position for screenshot
            ss_x = (canvas_w - target_w) // 2
            ss_y = 500 if is_tall else 420
            
            # Draw shadow
            shadow_offset = 25 if is_tall else 20
            shadow_canvas = Image.new("RGBA", canvas.size, (0,0,0,0))
            shadow_draw = ImageDraw.Draw(shadow_canvas)
            shadow_draw.rounded_rectangle(
                (ss_x, ss_y, ss_x+target_w, ss_y+target_h), 
                radius=radius, fill=(0,0,0,100)
            )
            shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(20 if is_tall else 15))
            
            # Paste shadow and screenshot
            canvas.paste(shadow_canvas, (shadow_offset, shadow_offset), shadow_canvas)
            canvas.paste(ss, (ss_x, ss_y), ss)
            
        canvas.save(output_path, "PNG")
        print(f"Generated {output_path}")
    except Exception as e:
        print(f"Failed to generate {output_path}: {e}")

if __name__ == "__main__":
    base_out_dir = "app_store_ready"
    dir_65 = os.path.join(base_out_dir, "6.5_inch")
    dir_55 = os.path.join(base_out_dir, "5.5_inch")
    
    dir_13 = os.path.join(base_out_dir, "13_inch_ipad")
    
    os.makedirs(dir_65, exist_ok=True)
    os.makedirs(dir_55, exist_ok=True)
    os.makedirs(dir_13, exist_ok=True)
    
    # Text and colors
    blue_bg = (15, 23, 42)
    green_bg = (204, 255, 0) # CCFF00
    
    data = [
        ("1.jpeg", "Get Started in Seconds", "Create your free account and join us.", blue_bg),
        ("2.jpeg", "Secure & Reliable", "Your transactions are always 100% protected.", green_bg),
        ("3.jpeg", "Fast Fingerprint Login", "Access your account instantly and securely.", blue_bg),
        ("4.jpeg", "Everything in One Place", "Fund your wallet and access all services.", green_bg),
        ("5.jpeg", "Unbeatable Data Rates", "Buy cheap data bundles for all networks.", blue_bg),
    ]
    
    for filename, heading, sub, bg in data:
        in_path = os.path.join("raw_screenshots", filename)
        
        if os.path.exists(in_path):
            # Generate 6.5 inch (1284 x 2778)
            out_path_65 = os.path.join(dir_65, filename.replace(".jpeg", ".png"))
            create_framed_screenshot(in_path, out_path_65, heading, sub, bg, (1284, 2778))
            
            # Generate 5.5 inch (1242 x 2208)
            out_path_55 = os.path.join(dir_55, filename.replace(".jpeg", ".png"))
            create_framed_screenshot(in_path, out_path_55, heading, sub, bg, (1242, 2208))

            # Generate 13 inch iPad (2048 x 2732)
            out_path_13 = os.path.join(dir_13, filename.replace(".jpeg", ".png"))
            create_framed_screenshot(in_path, out_path_13, heading, sub, bg, (2048, 2732))
        else:
            print(f"Skipping {in_path} - file not found")
