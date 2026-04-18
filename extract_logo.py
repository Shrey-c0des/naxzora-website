import fitz
from PIL import Image
from collections import Counter
import sys

def process_pdf(pdf_path, output_image_path):
    doc = fitz.open(pdf_path)
    page = doc.load_page(0)
    # Render with higher resolution to crop out logo later or just see colors
    pix = page.get_pixmap(dpi=300)
    pix.save(output_image_path)
    
    img = Image.open(output_image_path).convert('RGB')
    
    # Get colors, skip white and light grays, also dark blacks
    pixels = list(img.getdata())
    filtered = []
    for r, g, b in pixels:
        # Ignore near-white and near-black
        if (r > 240 and g > 240 and b > 240): continue
        if (r < 20 and g < 20 and b < 20): continue
        # Ignore pure grays
        if abs(r-g) < 10 and abs(g-b) < 10: continue
        filtered.append((r,g,b))
    
    counts = Counter(filtered)
    top_colors = counts.most_common(5)
    
    print("Dominant Non-Grayscale Colors (RGB):")
    for color, count in top_colors:
        hex_color = '#{:02x}{:02x}{:02x}'.format(*color)
        print(f"{hex_color} - rgb({color[0]}, {color[1]}, {color[2]}) - Count: {count}")

if __name__ == "__main__":
    process_pdf(sys.argv[1], sys.argv[2])
