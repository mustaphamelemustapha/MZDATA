import glob
import re

lowercase_enums = {
    "UserRole",
    "LedgerType",
    "PricingRole",
    "TransactionStatus",
    "AnnouncementLevel",
}

for f in glob.glob("app/models/*.py"):
    with open(f, "r") as file:
        content = file.read()
    
    # Replace Enum(X, values_callable=...) with Enum(X) if X not in lowercase_enums
    def replacer(match):
        enum_name = match.group(1).split(',')[0].strip()
        if enum_name not in lowercase_enums:
            # Remove values_callable
            inner = match.group(1).replace(", values_callable=lambda obj: [e.value for e in obj]", "")
            return f"Enum({inner})"
        return match.group(0)
        
    new_content = re.sub(r'Enum\(([^)]+)\)', replacer, content)
    
    if new_content != content:
        with open(f, "w") as file:
            file.write(new_content)
        print(f"Reverted in {f}")
