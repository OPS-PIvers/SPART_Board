with open("components/widgets/Schedule/Settings.tsx", "r") as f:
    content = f.read()

# Replace `items={validItems.map((i) => i.id as string)}` with `items={validItems.map((i) => i.id)}`
old_str = "items={validItems.map((i) => i.id as string)}"
new_str = "items={validItems.map((i) => i.id)}"

if old_str in content:
    with open("components/widgets/Schedule/Settings.tsx", "w") as f:
        f.write(content.replace(old_str, new_str))
    print("Replaced assertion")
else:
    print("Assertion not found")
