from PIL import Image

img = Image.open('village_map_v2.png').convert('RGB')
img = img.resize((100, 100))
out = ""
for y in range(100):
    for x in range(100):
        r, g, b = img.getpixel((x, y))
        if r > g and r > b and g > b * 0.8 and r > 100:
            out += "O"
        elif b > r and b > g:
            out += "~"
        elif g > r and g > b:
            out += "."
        else:
            out += "#"
    out += "\n"
with open("map.txt", "w") as f: f.write(out)
print("Saved map.txt")
