import os
from PIL import Image, ImageDraw

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "assets", "images")
RES_DIR = os.path.join(PROJECT_ROOT, "android", "app", "src", "main", "res")

# Density scales for Android mipmaps
# Base mdpi = 1.0 (launcher: 48x48, foreground: 108x108)
DENSITIES = {
    "mipmap-mdpi": (48, 108),
    "mipmap-hdpi": (72, 162),
    "mipmap-xhdpi": (96, 216),
    "mipmap-xxhdpi": (144, 324),
    "mipmap-xxxhdpi": (192, 432),
}

VARIANTS = {
    "healthy": {
        "icon": "icon-healthy.png",
        "fg": "android-icon-foreground-healthy.png",
    },
    "caution": {
        "icon": "icon-caution.png",
        "fg": "android-icon-foreground-caution.png",
    },
    "critical": {
        "icon": "icon-critical.png",
        "fg": "android-icon-foreground-critical.png",
    },
    "goal": {
        "icon": "icon-goal.png",
        "fg": "android-icon-foreground-goal.png",
    },
}

def make_round_icon(square_img: Image.Image) -> Image.Image:
    """Masks square_img with a circular alpha mask."""
    w, h = square_img.size
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, w, h), fill=255)
    
    round_img = square_img.copy()
    round_img.putalpha(mask)
    return round_img

def main():
    print("Generating Android mipmap resources...")
    
    # 1. Generate adaptive XML definitions for API 26+
    v26_dir = os.path.join(RES_DIR, "mipmap-anydpi-v26")
    os.makedirs(v26_dir, exist_ok=True)
    
    for var_name in VARIANTS.keys():
        # ic_launcher_<var>.xml
        xml_content = f"""<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground_{var_name}"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
"""
        with open(os.path.join(v26_dir, f"ic_launcher_{var_name}.xml"), "w", encoding="utf-8") as f:
            f.write(xml_content)
            
        with open(os.path.join(v26_dir, f"ic_launcher_round_{var_name}.xml"), "w", encoding="utf-8") as f:
            f.write(xml_content)
            
    print("Created adaptive icon XML definitions in mipmap-anydpi-v26")

    # 2. Generate mipmap images for each density
    for folder, (launcher_size, fg_size) in DENSITIES.items():
        density_dir = os.path.join(RES_DIR, folder)
        os.makedirs(density_dir, exist_ok=True)
        
        for var_name, var_files in VARIANTS.items():
            icon_img = Image.open(os.path.join(ASSETS_DIR, var_files["icon"])).convert("RGBA")
            fg_img = Image.open(os.path.join(ASSETS_DIR, var_files["fg"])).convert("RGBA")
            
            # Resized launcher icon
            res_launcher = icon_img.resize((launcher_size, launcher_size), Image.Resampling.LANCZOS)
            res_round = make_round_icon(res_launcher)
            res_fg = fg_img.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
            
            # Save WEBP files
            launcher_path = os.path.join(density_dir, f"ic_launcher_{var_name}.webp")
            round_path = os.path.join(density_dir, f"ic_launcher_round_{var_name}.webp")
            fg_path = os.path.join(density_dir, f"ic_launcher_foreground_{var_name}.webp")
            
            res_launcher.save(launcher_path, "WEBP", quality=95)
            res_round.save(round_path, "WEBP", quality=95)
            res_fg.save(fg_path, "WEBP", quality=95)
            
        print(f"Generated icons for {folder}")

    print("All Android mipmap icons generated successfully!")

if __name__ == "__main__":
    main()
