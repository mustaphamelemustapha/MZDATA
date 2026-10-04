import re

with open('app/api/v1/endpoints/services.py', 'r') as f:
    content = f.read()

def replacer(match):
    indent = match.group(1)
    return (
        f"{indent}tx = db2.query(ServiceTransaction).with_for_update().get(tx_id)\n"
        f"{indent}if not tx:\n"
        f"{indent}    raise HTTPException(status_code=404, detail=\"Transaction not found\")\n"
        f"{indent}if tx.status in {{TransactionStatus.SUCCESS.value, TransactionStatus.REFUNDED.value, \"success\", \"refunded\"}}:\n"
        f"{indent}    db2.commit()\n"
        f"{indent}    return {{\"reference\": reference, \"status\": tx.status, \"message\": \"Transaction already processed asynchronously\"}}\n"
        f"{indent}wallet = get_or_create_wallet(db2, user_id)"
    )

pattern = re.compile(r"^([ \t]+)tx = db2\.query\(ServiceTransaction\)\.get\(tx_id\)\n[ \t]+wallet = get_or_create_wallet\(db2, user_id\)", re.MULTILINE)

new_content = pattern.sub(replacer, content)

with open('app/api/v1/endpoints/services.py', 'w') as f:
    f.write(new_content)

print(f"Replaced {len(pattern.findall(content))} instances in services.py")
