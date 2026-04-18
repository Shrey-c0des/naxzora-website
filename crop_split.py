from PIL import Image
import sys

def crop_and_transparent(input_path, out_left, out_right):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # 1. Crop Left Logo
    # Top 15%, Left 5% to 45%
    left_crop = img.crop((w*0.05, h*0.02, w*0.45, h*0.15))
    
    # Make left transparent
    datas = left_crop.getdata()
    new_data = []
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    left_crop.putdata(new_data)
    # Autocrop empty space
    bbox = left_crop.getbbox()
    if bbox:
        left_crop = left_crop.crop(bbox)
    left_crop.save(out_left, "PNG")

    # 2. Crop Right Waves
    # Top 15%, Right 45% to 95%
    right_crop = img.crop((w*0.45, h*0.02, w*0.95, h*0.15))
    
    # Make right transparent
    datas = right_crop.getdata()
    new_data = []
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    right_crop.putdata(new_data)
    # Autocrop empty space
    bbox = right_crop.getbbox()
    if bbox:
        right_crop = right_crop.crop(bbox)
    right_crop.save(out_right, "PNG")
    print("Cropped left logo and right waves.")

if __name__ == "__main__":
    crop_and_transparent(sys.argv[1], sys.argv[2], sys.argv[3])
