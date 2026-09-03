import os
import glob

directory = '/Users/mustaphamelemustapha/Code/client_vtu_app_standalone/vtu-web-next/src'

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content.replace('mzdata-logo.png', 'mzdata-logo.jpg')
            new_content = new_content.replace('mzdata-icon.png', 'mzdata-logo.jpg')
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
