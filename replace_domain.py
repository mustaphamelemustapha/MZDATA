import os

directory = '/Users/mustaphamelemustapha/Code/client_vtu_app_standalone'
replacements = {
    'mzdata.org': 'mzdata.org',
    'MZDATA.ORG': 'MZDATA.ORG',
    'mzdata.org': 'mzdata.org',
    'MZDATA.ORG': 'MZDATA.ORG'
}

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
print("Domain replacement Done!")
