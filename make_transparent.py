from PIL import Image
import sys

def make_transparent(img_path):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # change all white (also shades of whites)
        # to transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(img_path, "PNG")

if __name__ == "__main__":
    make_transparent(sys.argv[1])
