import glob
import re

for f in glob.glob("app/models/*.py"):
    with open(f, "r") as file:
        content = file.read()
    
    # Simple regex to find Enum(Something...) and add values_callable
    # Only if it doesn't already have values_callable
    def replacer(match):
        inner = match.group(1)
        if "values_callable" in inner:
            return match.group(0)
        return f"Enum({inner}, values_callable=lambda obj: [e.value for e in obj])"
        
    new_content = re.sub(r'Enum\(([^)]+)\)', replacer, content)
    
    if new_content != content:
        with open(f, "w") as file:
            file.write(new_content)
        print(f"Updated {f}")
