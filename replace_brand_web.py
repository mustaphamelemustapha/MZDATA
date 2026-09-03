import os
import shutil

directory = '/Users/mustaphamelemustapha/Code/client_vtu_app_standalone'
logo_source = '/Users/mustaphamelemustapha/.gemini/antigravity-ide/brain/d84ca030-9fcf-4c23-9550-1a04e061c7d9/.user_uploaded/media_1788441744990.jpg'

replacements = {
    'MZDATA': 'MZDATA',
    'MzData': 'MzData',
    'mzdata': 'mzdata',
    'Mzdata': 'Mzdata',
    'MZDATA': 'MZDATA',
    'mzdata.org': 'mzdata.org',
    'MzData': 'MzData',
    'mzdata': 'mzdata',
    'MzData': 'MzData',
    # Replace logo references in code
    'mzdata-logo.png': 'mzdata-logo.jpg',
    'mzdata-logo.svg': 'mzdata-logo.jpg',
    'mzdata-logo.png': 'mzdata-logo.jpg',
    'mzdata-logo.svg': 'mzdata-logo.jpg',
    'mzdata-logo.svg': 'mzdata-logo.jpg',
}

# 1. Place the new logo in all public/brand directories
for root, dirs, files in os.walk(directory):
    if '.git' in root or 'node_modules' in root or '.next' in root or 'dist' in root or '.vercel' in root:
        continue
    if os.path.basename(root) == 'brand':
        dest = os.path.join(root, 'mzdata-logo.jpg')
        shutil.copyfile(logo_source, dest)
        print(f"Copied logo to {dest}")
    # also overwrite favicon if it exists
    if 'favicon.png' in files or 'favicon.ico' in files:
        if 'favicon.png' in files:
            shutil.copyfile(logo_source, os.path.join(root, 'favicon.png'))
            print(f"Overwrote favicon.png in {root}")
        if 'favicon.ico' in files:
            shutil.copyfile(logo_source, os.path.join(root, 'favicon.ico'))
            print(f"Overwrote favicon.ico in {root}")

# 2. Search and replace text
extensions = ('.dart', '.py', '.svg', '.txt', '.md', '.json', '.yaml', '.yml', '.html', '.js', '.ts', '.jsx', '.tsx', '.vue', '.css', '.scss')

for root, dirs, files in os.walk(directory):
    if '.git' in root or 'node_modules' in root or '.next' in root or 'dist' in root or '.vercel' in root or 'build' in root:
        continue
    for file in files:
        if file.endswith(extensions):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r') as f:
                    content = f.read()
                
                original = content
                for old, new in replacements.items():
                    content = content.replace(old, new)
                
                if original != content:
                    with open(filepath, 'w') as f:
                        f.write(content)
                    print(f"Updated {filepath}")
            except Exception as e:
                pass
print("Text replacement Done!")
