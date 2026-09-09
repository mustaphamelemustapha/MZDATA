import glob

for f in glob.glob("alembic/versions/*.py"):
    with open(f, "r") as file:
        content = file.read()
    if "text(\"now()\")" in content or "text('now()')" in content:
        content = content.replace("text(\"now()\")", "text(\"CURRENT_TIMESTAMP\")").replace("text('now()')", "text(\"CURRENT_TIMESTAMP\")")
        with open(f, "w") as file:
            file.write(content)
print("Updated!")
