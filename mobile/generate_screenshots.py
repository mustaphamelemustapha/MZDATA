import os
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def get_font(size):
    font_path = "Roboto-Bold.ttf"
    if not os.path.exists(font_path):
        url = "https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Bold.ttf"
        urllib.request.urlretrieve(url, font_path)
    return ImageFont.truetype(font_path, size)

def create_framed_screenshot(input_path, output_path, heading, subheading, bg_color):
    try:
        # Create canvas 1080x1920
        canvas_w, canvas_h = 1080, 1920
        canvas = Image.new('RGB', (canvas_w, canvas_h), bg_color)
        draw = ImageDraw.Draw(canvas)
        
        # Load fonts
        try:
            heading_font = get_font(72)
            subheading_font = get_font(40)
        except Exception:
            heading_font = ImageFont.load_default()
            subheading_font = ImageFont.load_default()

        # Draw Text
        # Assuming text is white or dark based on background
        text_color = (255, 255, 255) if bg_color != (204, 255, 0) else (15, 23, 42)
        
        # Heading
        try:
            _, _, w, h = draw.textbbox((0, 0), heading, font=heading_font)
        except:
            w, h = heading_font.getsize(heading)
        draw.text(((canvas_w - w) / 2, 150), heading, font=heading_font, fill=text_color)
        
        # Subheading
        try:
            _, _, w2, h2 = draw.textbbox((0, 0), subheading, font=subheading_font)
        except:
            w2, h2 = subheading_font.getsize(subheading)
        draw.text(((canvas_w - w2) / 2, 250), subheading, font=subheading_font, fill=text_color)

        # Load Screenshot
        with Image.open(input_path) as ss:
            ss = ss.convert("RGBA")
            # Target width 800, maintain aspect ratio
            target_w = 840
            ratio = target_w / ss.width
            target_h = int(ss.height * ratio)
            ss = ss.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            # Create rounded corners mask
            mask = Image.new("L", ss.size, 0)
            draw_mask = ImageDraw.Draw(mask)
            radius = 40
            draw_mask.rounded_rectangle((0, 0, target_w, target_h), radius=radius, fill=255)
            ss.putalpha(mask)
            
            # Position for screenshot
            ss_x = (canvas_w - target_w) // 2
            ss_y = 400
            
            # Draw shadow
            shadow_offset = 20
            shadow_canvas = Image.new("RGBA", canvas.size, (0,0,0,0))
            shadow_draw = ImageDraw.Draw(shadow_canvas)
            shadow_draw.rounded_rectangle(
                (ss_x, ss_y, ss_x+target_w, ss_y+target_h), 
                radius=radius, fill=(0,0,0,100)
            )
            shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(15))
            
            # Paste shadow and screenshot
            canvas.paste(shadow_canvas, (shadow_offset, shadow_offset), shadow_canvas)
            canvas.paste(ss, (ss_x, ss_y), ss)
            
        canvas.save(output_path, "PNG")
        print(f"Generated {output_path}")
    except Exception as e:
        print(f"Failed to generate {output_path}: {e}")

if __name__ == "__main__":
    out_dir = "play_store_ready"
    os.makedirs(out_dir, exist_ok=True)
    
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
        out_path = os.path.join(out_dir, filename.replace(".jpeg", ".png"))
        if os.path.exists(in_path):
            create_framed_screenshot(in_path, out_path, heading, sub, bg)
        else:
            print(f"Skipping {in_path} - file not found")
