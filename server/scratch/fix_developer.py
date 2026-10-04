import re

with open('app/api/v1/endpoints/developer.py', 'r') as f:
    content = f.read()

# First replace: tx = db2.query(Transaction).get(tx_id)
def replacer1(match):
    indent = match.group(1)
    return (
        f"{indent}tx = db2.query(Transaction).with_for_update().get(tx_id)\n"
        f"{indent}if not tx:\n"
        f"{indent}    return {{\"status\": \"failed\", \"message\": \"Transaction not found\"}}\n"
        f"{indent}if tx.status in {{TransactionStatus.SUCCESS, TransactionStatus.REFUNDED, \"success\", \"refunded\"}}:\n"
        f"{indent}    db2.commit()\n"
        f"{indent}    return {{\"status\": \"success\" if tx.status in {{TransactionStatus.SUCCESS, \"success\"}} else \"failed\", \"message\": \"Transaction already processed asynchronously\", \"reference\": reference}}\n"
        f"{indent}user = db2.query(User).get(user_id)"
    )

pattern1 = re.compile(r"^([ \t]+)tx = db2\.query\(Transaction\)\.get\(tx_id\)\n[ \t]+user = db2\.query\(User\)\.get\(user_id\)", re.MULTILINE)
content = pattern1.sub(replacer1, content)

# Second replace: tx = db2.query(ServiceTransaction).get(tx_id)
def replacer2(match):
    indent = match.group(1)
    return (
        f"{indent}tx = db2.query(ServiceTransaction).with_for_update().get(tx_id)\n"
        f"{indent}if not tx:\n"
        f"{indent}    return {{\"status\": \"failed\", \"message\": \"Transaction not found\"}}\n"
        f"{indent}if tx.status in {{TransactionStatus.SUCCESS.value, TransactionStatus.REFUNDED.value, \"success\", \"refunded\"}}:\n"
        f"{indent}    db2.commit()\n"
        f"{indent}    return {{\"status\": \"success\" if tx.status in {{TransactionStatus.SUCCESS.value, \"success\"}} else \"failed\", \"message\": \"Transaction already processed asynchronously\", \"reference\": reference}}\n"
        f"{indent}user = db2.query(User).get(user_id)"
    )

pattern2 = re.compile(r"^([ \t]+)tx = db2\.query\(ServiceTransaction\)\.get\(tx_id\)\n[ \t]+user = db2\.query\(User\)\.get\(user_id\)", re.MULTILINE)
content = pattern2.sub(replacer2, content)

with open('app/api/v1/endpoints/developer.py', 'w') as f:
    f.write(content)
