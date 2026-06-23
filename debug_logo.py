from PIL import Image
from collections import Counter

def inspect_image(img_path):
    img = Image.open(img_path)
    print("Mode:", img.mode)
    print("Size:", img.size)
    img_rgba = img.convert("RGBA")
    pixels = list(img_rgba.getdata())
    print("Total pixels:", len(pixels))
    
    # Print first 20 pixels
    print("First 20 pixels:", pixels[:20])
    
    # Print color counter (most common 20 colors)
    counter = Counter(pixels)
    print("Most common 20 colors:")
    for color, count in counter.most_common(20):
        print(f"Color: {color}, Count: {count}")

if __name__ == "__main__":
    inspect_image("public/images/logo_left.png")
