import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
OUT_PATH = os.path.join(ASSETS_DIR, "dynamic_icons_homescreen_preview.png")

def create_preview():
    canvas_w = 1920
    canvas_h = 1080
    
    # 1. Base Dark Solid Canvas (Deep Obsidian / Graphite)
    canvas = Image.new('RGB', (canvas_w, canvas_h), (10, 13, 18))
    
    # Ambient glow layer
    ambient = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    amb_draw = ImageDraw.Draw(ambient)
    
    # Very soft, subtle top ambient lighting
    for r in range(700, 0, -20):
        factor = (1 - (r / 700)) ** 2
        a = int(factor * 35)
        amb_draw.ellipse([canvas_w // 2 - r, -200 - r // 3, canvas_w // 2 + r, -200 + r], fill=(30, 48, 64, a))
    
    canvas.paste(ambient, (0, 0), ambient)
    draw = ImageDraw.Draw(canvas)

    # Fonts
    try:
        title_font = ImageFont.truetype("arialbd.ttf", 34)
        subtitle_font = ImageFont.truetype("arial.ttf", 16)
        pill_font = ImageFont.truetype("arialbd.ttf", 12)
        card_title_font = ImageFont.truetype("arialbd.ttf", 20)
        clock_font = ImageFont.truetype("arial.ttf", 13)
        widget_date_font = ImageFont.truetype("arialbd.ttf", 15)
        widget_temp_font = ImageFont.truetype("arial.ttf", 13)
        app_name_font = ImageFont.truetype("arialbd.ttf", 14)
        desc_title_font = ImageFont.truetype("arialbd.ttf", 14)
        desc_body_font = ImageFont.truetype("arial.ttf", 13)
    except:
        title_font = subtitle_font = pill_font = card_title_font = clock_font = \
        widget_date_font = widget_temp_font = app_name_font = desc_title_font = desc_body_font = ImageFont.load_default()

    # Header section
    draw.text((canvas_w // 2, 42), "FEATURE A9: DYNAMIC LAUNCHER ICONS (FINANCIAL HEALTH BADGE)", fill=(212, 255, 50), font=title_font, anchor="mt")
    draw.text((canvas_w // 2, 88), "The app icon on your Android home screen dynamically transforms based on your spending velocity & goals", fill=(155, 163, 175), font=subtitle_font, anchor="mt")

    # 4 Variants
    variants = [
        {
            "state": "HEALTHY",
            "tag": "ON TRACK • BALANCED",
            "tag_bg": (16, 70, 50),
            "tag_fg": (74, 222, 128),
            "accent": (212, 255, 50),
            "icon_file": "icon-healthy.png",
            "trigger": "Safe-to-Spend > 50%",
            "desc": "Standard Obsidian & Electric Chartreuse\nAvailable spend is healthy\nAll daily pacing envelopes calm",
        },
        {
            "state": "CAUTION",
            "tag": "HEADS UP • FAST BURN",
            "tag_bg": (70, 48, 12),
            "tag_fg": (251, 191, 36),
            "accent": (245, 158, 11),
            "icon_file": "icon-caution.png",
            "trigger": "Safe-to-Spend: 15% – 50%",
            "desc": "Warm Neon Amber-Gold shift\nGlanceable heads-up before overspending\nPassive awareness on every phone unlock",
        },
        {
            "state": "CRITICAL",
            "tag": "ALERT • CYCLE EXHAUSTED",
            "tag_bg": (75, 20, 20),
            "tag_fg": (248, 113, 113),
            "accent": (239, 68, 68),
            "icon_file": "icon-critical.png",
            "trigger": "Safe-to-Spend < 15% / Overspent",
            "desc": "Laser Crimson Outline + Alert Pulse Badge\nVisual reminder without opening app\nHelps curb impulsive checkout sessions",
        },
        {
            "state": "GOAL HIT",
            "tag": "CELEBRATION • 24H TROPHY",
            "tag_bg": (70, 55, 10),
            "tag_fg": (253, 224, 71),
            "accent": (252, 211, 77),
            "icon_file": "icon-goal.png",
            "trigger": "Target 100% Achieved",
            "desc": "24k Imperial Gold & Sparkle Accents\nHome screen reward for meeting savings target\nReverts to health state automatically after 24h",
        },
    ]

    card_w = 400
    card_h = 880
    margin_x = 42
    start_x = (canvas_w - (4 * card_w + 3 * margin_x)) // 2
    card_y = 135

    for i, var in enumerate(variants):
        cx = start_x + i * (card_w + margin_x)

        # ─── Glass Display Container Card ───
        draw.rounded_rectangle([cx, card_y, cx + card_w, card_y + card_h], radius=24, fill=(18, 22, 30), outline=(38, 44, 58), width=1)
        
        # Subtle top edge glowing stroke
        draw.line([cx + 40, card_y, cx + card_w - 40, card_y], fill=var["accent"], width=2)

        # State Tag Pill
        tag_w = 260
        tag_h = 28
        tag_x = cx + (card_w - tag_w) // 2
        tag_y = card_y + 18
        draw.rounded_rectangle([tag_x, tag_y, tag_x + tag_w, tag_y + tag_h], radius=14, fill=var["tag_bg"], outline=var["accent"], width=1)
        draw.text((tag_x + tag_w // 2, tag_y + 14), var["tag"], fill=var["tag_fg"], font=pill_font, anchor="mm")

        # Main Title
        draw.text((cx + card_w // 2, card_y + 60), var["state"], fill=(255, 255, 255), font=card_title_font, anchor="mt")

        # ─── Phone Hardware Frame (Sleek Modern Android Flagship) ───
        phone_w = 310
        phone_h = 520
        phone_x = cx + (card_w - phone_w) // 2
        phone_y = card_y + 102

        # Outer bezel
        draw.rounded_rectangle([phone_x, phone_y, phone_x + phone_w, phone_y + phone_h], radius=38, fill=(12, 14, 18), outline=(50, 56, 70), width=2)
        # Inner screen boundary
        screen_x = phone_x + 6
        screen_y = phone_y + 6
        screen_w = phone_w - 12
        screen_h = phone_h - 12
        draw.rounded_rectangle([screen_x, screen_y, screen_x + screen_w, screen_y + screen_h], radius=32, fill=(15, 18, 25))

        # Wallpaper: Dark minimal atmospheric gradient + subtle geometric glow
        wp_layer = Image.new('RGBA', (screen_w, screen_h), (0, 0, 0, 0))
        wp_draw = ImageDraw.Draw(wp_layer)
        # Deep circular ambient sphere on wallpaper
        wp_draw.ellipse([screen_w // 2 - 130, 80, screen_w // 2 + 130, 340], fill=(24, 30, 42, 180))
        # Accent subtle color glow behind the app icon
        r_acc, g_acc, b_acc = var["accent"]
        wp_draw.ellipse([screen_w // 2 - 80, 160, screen_w // 2 + 80, 320], fill=(r_acc, g_acc, b_acc, 26))
        wp_layer = wp_layer.filter(ImageFilter.GaussianBlur(radius=16))
        canvas.paste(wp_layer, (screen_x, screen_y), wp_layer)

        # ─── Phone Status Bar ───
        # Camera punch hole
        punch_r = 5
        punch_cx = screen_x + screen_w // 2
        punch_cy = screen_y + 14
        draw.ellipse([punch_cx - punch_r, punch_cy - punch_r, punch_cx + punch_r, punch_cy + punch_r], fill=(0, 0, 0))

        # Clock
        draw.text((screen_x + 22, screen_y + 14), "09:41", fill=(210, 215, 225), font=clock_font, anchor="lm")
        # Battery icon
        bat_w = 22
        bat_h = 11
        bat_x = screen_x + screen_w - 44
        bat_y = screen_y + 9
        draw.rounded_rectangle([bat_x, bat_y, bat_x + bat_w, bat_y + bat_h], radius=3, outline=(200, 205, 215), width=1)
        draw.rectangle([bat_x + 2, bat_y + 2, bat_x + 16, bat_y + bat_h - 2], fill=var["accent"])
        draw.rectangle([bat_x + bat_w, bat_y + 3, bat_x + bat_w + 2, bat_y + bat_h - 3], fill=(200, 205, 215))

        # ─── Android At-A-Glance Widget ───
        widget_y = screen_y + 44
        draw.text((screen_x + 24, widget_y), "Tuesday, Oct 18", fill=(240, 245, 255), font=widget_date_font, anchor="lt")
        draw.text((screen_x + 24, widget_y + 20), "24°C • Mostly Clear", fill=(160, 168, 184), font=widget_temp_font, anchor="lt")

        # ─── Center Launcher Icon Placement ───
        icon_path = os.path.join(ASSETS_DIR, var["icon_file"])
        var_icon = Image.open(icon_path).convert('RGBA')
        
        icon_size = 104
        icon_resized = var_icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)

        # Premium soft shadow under icon
        icon_x = screen_x + (screen_w - icon_size) // 2
        icon_y = screen_y + 128
        
        shadow = Image.new('RGBA', (icon_size + 40, icon_size + 40), (0, 0, 0, 0))
        sh_draw = ImageDraw.Draw(shadow)
        sh_draw.rounded_rectangle([20, 20, 20 + icon_size, 20 + icon_size], radius=26, fill=(0, 0, 0, 170))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=10))
        canvas.paste(shadow, (icon_x - 20, icon_y - 10), shadow)

        # Paste the launcher icon
        canvas.paste(icon_resized, (icon_x, icon_y), icon_resized)

        # Label under icon
        draw.text((icon_x + icon_size // 2, icon_y + icon_size + 14), "MyWallet", fill=(255, 255, 255), font=app_name_font, anchor="mt")

        # ─── Android Companion App Grid (Realism) ───
        row_y = icon_y + icon_size + 52
        comp_apps = [
            ((37, 99, 235), "Drive"),
            ((16, 185, 129), "Messages"),
            ((234, 88, 12), "Camera"),
            ((147, 51, 234), "Music"),
        ]
        comp_size = 38
        total_comp_w = 4 * comp_size + 3 * 22
        comp_start_x = screen_x + (screen_w - total_comp_w) // 2
        for c_idx, (c_col, c_lbl) in enumerate(comp_apps):
            c_x = comp_start_x + c_idx * (comp_size + 22)
            draw.rounded_rectangle([c_x, row_y, c_x + comp_size, row_y + comp_size], radius=11, fill=(c_col[0] // 4 + 10, c_col[1] // 4 + 10, c_col[2] // 4 + 10), outline=c_col, width=1)

        # ─── Bottom Android Dock & Search Bar ───
        search_w = screen_w - 36
        search_h = 36
        search_x = screen_x + 18
        search_y = screen_y + screen_h - 110
        draw.rounded_rectangle([search_x, search_y, search_x + search_w, search_y + search_h], radius=18, fill=(30, 36, 48), outline=(48, 56, 74), width=1)
        # Search G dot & mic placeholders
        draw.text((search_x + 16, search_y + 18), "G", fill=(180, 185, 200), font=app_name_font, anchor="mm")
        draw.text((search_x + search_w - 18, search_y + 18), "🎙", fill=(180, 185, 200), font=desc_body_font, anchor="mm")

        # Bottom 4 Dock icons
        dock_y = search_y + 44
        for d_idx, d_col in enumerate([(16, 185, 129), (59, 130, 246), (249, 115, 22), (168, 85, 247)]):
            d_x = comp_start_x + d_idx * (comp_size + 22)
            draw.rounded_rectangle([d_x, dock_y, d_x + comp_size, dock_y + comp_size], radius=11, fill=(d_col[0] // 4 + 10, d_col[1] // 4 + 10, d_col[2] // 4 + 10), outline=d_col, width=1)

        # Home Navigation Bar indicator
        nav_w = 84
        nav_x = screen_x + (screen_w - nav_w) // 2
        nav_y = screen_y + screen_h - 10
        draw.rounded_rectangle([nav_x, nav_y, nav_x + nav_w, nav_y + 4], radius=2, fill=(180, 185, 195))

        # ─── Description Card below phone ───
        info_y = phone_y + phone_h + 24
        # Trigger condition badge
        trig_w = card_w - 48
        trig_h = 28
        trig_x = cx + 24
        draw.rounded_rectangle([trig_x, info_y, trig_x + trig_w, info_y + trig_h], radius=6, fill=(25, 30, 42), outline=(50, 58, 76), width=1)
        draw.text((trig_x + 12, info_y + 14), "Trigger:", fill=(140, 148, 164), font=desc_body_font, anchor="lm")
        draw.text((trig_x + 72, info_y + 14), var["trigger"], fill=var["accent"], font=desc_title_font, anchor="lm")

        # Bullet descriptions
        lines = var["desc"].split('\n')
        line_start_y = info_y + 40
        for l_idx, line in enumerate(lines):
            draw.text((cx + 28, line_start_y + l_idx * 22), f"•  {line}", fill=(175, 182, 198), font=desc_body_font, anchor="lt")

    # Save final high-res showroom image
    canvas.save(OUT_PATH, "PNG", quality=98)
    print(f"Generated showroom preview at: {OUT_PATH}")

if __name__ == "__main__":
    create_preview()
