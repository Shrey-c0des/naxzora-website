from PIL import Image
import sys

def crop_logo(input_path, output_path):
    img = Image.open(input_path)
    w, h = img.size
    
    # Crop the top 15% of the page
    # A standard A4 is tall.
    # Also crop out some margins (e.g. left 10%, right 10%)
    cropped = img.crop((w*0.05, h*0.02, w*0.95, h*0.15))
    cropped.save(output_path)
    print("Logo cropped.")

if __name__ == "__main__":
    crop_logo(sys.argv[1], sys.argv[2])
