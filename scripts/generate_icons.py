import os
from PIL import Image, ImageDraw

def generate_all_assets():
    home_src = r"d:\Aditya\Code\Projects\PaymentTracker\Design\HomeScreen.png"
    splash_src = r"d:\Aditya\Code\Projects\PaymentTracker\Design\ScreenSplash.png"
    project_root = r"d:\Aditya\Code\Projects\PaymentTracker\MyWallet"

    print(f"Loading HomeScreen icon: {home_src}")
    home_img = Image.open(home_src).convert("RGBA")
    home_crop = home_img.crop((10, 10, 630, 630))

    print(f"Loading ScreenSplash icon: {splash_src}")
    splash_img = Image.open(splash_src).convert("RGBA")
    splash_crop = splash_img.crop((10, 10, 630, 630))

    # 1. Main app icon (1024x1024)
    icon_1024 = home_crop.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon_1024.save(os.path.join(project_root, "assets", "images", "icon.png"), "PNG")
    print("Saved assets/images/icon.png from HomeScreen.png")

    # 2. Adaptive launcher foreground helper (from HomeScreen.png)
    def create_adaptive_foreground(size):
        fg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        logo_size = int(size * 0.72)
        resized_logo = home_crop.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        offset = (size - logo_size) // 2
        fg.paste(resized_logo, (offset, offset), resized_logo)
        return fg

    def create_adaptive_background(size):
        return Image.new("RGBA", (size, size), (16, 19, 25, 255))

    fg_432 = create_adaptive_foreground(432)
    fg_432.save(os.path.join(project_root, "assets", "images", "android-icon-foreground.png"), "PNG")
    bg_432 = create_adaptive_background(432)
    bg_432.save(os.path.join(project_root, "assets", "images", "android-icon-background.png"), "PNG")
    print("Saved assets/images/android-icon-foreground.png from HomeScreen.png")

    # 3. Splash icon for Expo asset (from ScreenSplash.png)
    splash_expo = splash_crop.resize((512, 512), Image.Resampling.LANCZOS)
    splash_expo.save(os.path.join(project_root, "assets", "images", "splash-icon.png"), "PNG")
    print("Saved assets/images/splash-icon.png from ScreenSplash.png")

    # Helper for round legacy launcher icon
    def create_round_icon(size):
        base = home_crop.resize((size, size), Image.Resampling.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size - 1, size - 1), fill=255)
        output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        output.paste(base, (0, 0), mask)
        return output

    # Mipmap densities for Android Launcher (from HomeScreen.png)
    densities = {
        "mdpi": {"legacy": 48, "adaptive": 108},
        "hdpi": {"legacy": 72, "adaptive": 162},
        "xhdpi": {"legacy": 96, "adaptive": 216},
        "xxhdpi": {"legacy": 144, "adaptive": 324},
        "xxxhdpi": {"legacy": 192, "adaptive": 432},
    }

    res_dir = os.path.join(project_root, "android", "app", "src", "main", "res")

    for density, sizes in densities.items():
        folder = os.path.join(res_dir, f"mipmap-{density}")
        os.makedirs(folder, exist_ok=True)

        leg_size = sizes["legacy"]
        ad_size = sizes["adaptive"]

        # ic_launcher.webp
        leg_icon = home_crop.resize((leg_size, leg_size), Image.Resampling.LANCZOS)
        leg_icon.save(os.path.join(folder, "ic_launcher.webp"), "WEBP", quality=100)

        # ic_launcher_round.webp
        round_icon = create_round_icon(leg_size)
        round_icon.save(os.path.join(folder, "ic_launcher_round.webp"), "WEBP", quality=100)

        # ic_launcher_foreground.webp
        fg = create_adaptive_foreground(ad_size)
        fg.save(os.path.join(folder, "ic_launcher_foreground.webp"), "WEBP", quality=100)

        # ic_launcher_background.webp
        bg = create_adaptive_background(ad_size)
        bg.save(os.path.join(folder, "ic_launcher_background.webp"), "WEBP", quality=100)

        print(f"Generated launcher icons for mipmap-{density}")

    # Splash screen densities (from ScreenSplash.png)
    splash_densities = {
        "drawable-mdpi": (288, 128),
        "drawable-hdpi": (432, 192),
        "drawable-xhdpi": (576, 256),
        "drawable-xxhdpi": (864, 384),
        "drawable-xxxhdpi": (1152, 512),
    }

    for folder_name, (canvas_size, logo_size) in splash_densities.items():
        canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        resized_logo = splash_crop.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        offset = (canvas_size - logo_size) // 2
        canvas.paste(resized_logo, (offset, offset), resized_logo)
        out_path = os.path.join(res_dir, folder_name, "splashscreen_logo.png")
        canvas.save(out_path, "PNG")
        print(f"Generated {folder_name}/splashscreen_logo.png from ScreenSplash.png")

    print("All HomeScreen launcher icons and ScreenSplash icons generated successfully!")

if __name__ == "__main__":
    generate_all_assets()
