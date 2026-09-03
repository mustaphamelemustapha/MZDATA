import os
import subprocess

source_img = '/Users/mustaphamelemustapha/.gemini/antigravity-ide/brain/d84ca030-9fcf-4c23-9550-1a04e061c7d9/.user_uploaded/media_1788441744990.jpg'
brand_dir = '/Users/mustaphamelemustapha/Code/client_vtu_app_standalone/mobile/assets/brand'

for filename in os.listdir(brand_dir):
    if filename.startswith('mele') and (filename.endswith('.png') or filename.endswith('.jpg')):
        dest_img = os.path.join(brand_dir, filename)
        if filename.endswith('.png'):
            subprocess.run(['sips', '-s', 'format', 'png', source_img, '--out', dest_img])
        else:
            subprocess.run(['cp', source_img, dest_img])
        print(f"Updated {filename}")
