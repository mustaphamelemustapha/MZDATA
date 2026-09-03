import os
import re

directory = '/Users/mustaphamelemustapha/Code/client_vtu_app_standalone'

replacements = {
    'MZDATA': 'MZDATA',
    'MzData': 'MzData',
    'mzdata': 'mzdata',
    'MZDATA': 'MZDATA',
    'Mzdata': 'Mzdata',
    'mzdata': 'mzdata'
}

for root, dirs, files in os.walk(directory):
    if '.git' in root or 'node_modules' in root or '.dart_tool' in root or 'build' in root:
        continue
    for file in files:
        if file.endswith(('.dart', '.py', '.svg', '.txt', '.md', '.json', '.yaml', '.yml', '.html')):
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
print("Done!")
