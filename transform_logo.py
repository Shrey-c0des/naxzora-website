from PIL import Image

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        r, g, b, a = item
        # If it is white or near-white background, make it transparent
        if r > 200 and g > 200 and b > 200:
            new_data.append((0, 0, 0, 0)) # transparent
        else:
            # If it is dark text (near black/gray), make it gold (#d7b469)
            # Gold color: R=215, G=180, B=105
            # We can scale it or make it solid gold
            if a > 0:
                new_data.append((215, 180, 105, a))
            else:
                new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Processed {input_path} and saved to {output_path}")

if __name__ == "__main__":
    process_logo("public/images/logo_left.png", "public/images/logo_left.png")
    process_logo("public/images/logo_waves.png", "public/images/logo_waves.png")
