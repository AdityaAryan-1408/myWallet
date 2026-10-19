import os
import math
import colorsys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")

def shift_hue(image: Image.Image, target_hue: float, sat_mult=1.0, val_mult=1.0) -> Image.Image:
    """
    Shifts the neon accent (hues between 55 and 95) to target_hue (0..360),
    preserving the dark obsidian squircle and background intact.
    """
    img = image.convert('RGBA')
    pixels = img.load()
    w, h = img.size
    
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out_pixels = out.load()
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                out_pixels[x, y] = (0, 0, 0, 0)
                continue
            
            # Convert to HSV
            h_norm, s_norm, v_norm = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            h_deg = h_norm * 360.0
            
            # Target neon chartreuse line & glow (hues roughly 50..100 with saturation > 0.25)
            if 45.0 <= h_deg <= 105.0 and s_norm > 0.20 and v_norm > 0.25:
                new_h = target_hue / 360.0
                new_s = min(1.0, s_norm * sat_mult)
                new_v = min(1.0, v_norm * val_mult)
                
                nr, ng, nb = colorsys.hsv_to_rgb(new_h, new_s, new_v)
                out_pixels[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
            elif 45.0 <= h_deg <= 105.0 and s_norm <= 0.20 and v_norm > 0.15:
                # Faint ambient green glow around the wallet
                new_h = target_hue / 360.0
                nr, ng, nb = colorsys.hsv_to_rgb(new_h, s_norm * sat_mult, v_norm * val_mult)
                out_pixels[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
            else:
                out_pixels[x, y] = (r, g, b, a)
                
    return out

def add_critical_alert_badge(image: Image.Image) -> Image.Image:
    """Adds a glowing red alert pulse badge in the upper right."""
    out = image.copy()
    w, h = out.size
    overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Scale badge position based on resolution
    dot_radius = int(w * 0.048)  # ~49px on 1024
    dot_x = int(w * 0.81)
    dot_y = int(h * 0.19)
    
    # Outer glow
    glow_radius = dot_radius * 2.2
    glow_color = (239, 68, 68, 120)
    draw.ellipse([dot_x - glow_radius, dot_y - glow_radius, dot_x + glow_radius, dot_y + glow_radius], fill=glow_color)
    
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=dot_radius * 0.8))
    
    # Crisp outer ring + solid core
    crisp = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(crisp)
    # Dark border separation
    c_draw.ellipse([dot_x - dot_radius - 6, dot_y - dot_radius - 6, dot_x + dot_radius + 6, dot_y + dot_radius + 6], fill=(16, 19, 25, 255))
    # Crimson core
    c_draw.ellipse([dot_x - dot_radius, dot_y - dot_radius, dot_x + dot_radius, dot_y + dot_radius], fill=(239, 68, 68, 255))
    # Bright inner highlight
    hi_r = int(dot_radius * 0.35)
    c_draw.ellipse([dot_x - hi_r - 2, dot_y - hi_r - 4, dot_x + hi_r - 2, dot_y + hi_r - 4], fill=(255, 200, 200, 220))
    
    out = Image.alpha_composite(out, overlay)
    out = Image.alpha_composite(out, crisp)
    return out

def add_celebratory_sparkles(image: Image.Image) -> Image.Image:
    """Adds subtle celebratory 4-point sparkle stars for goal achieved."""
    out = image.copy()
    w, h = out.size
    overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    def draw_sparkle(cx, cy, radius, color):
        # 4-point diamond star
        pts = [
            (cx, cy - radius),
            (cx + radius * 0.25, cy - radius * 0.25),
            (cx + radius, cy),
            (cx + radius * 0.25, cy + radius * 0.25),
            (cx, cy + radius),
            (cx - radius * 0.25, cy + radius * 0.25),
            (cx - radius, cy),
            (cx - radius * 0.25, cy - radius * 0.25),
        ]
        draw.polygon(pts, fill=color)
        # Inner core glow
        c_r = radius * 0.35
        draw.ellipse([cx - c_r, cy - c_r, cx + c_r, cy + c_r], fill=(255, 255, 255, 255))

    star_color = (252, 211, 77, 240)
    # Top-right sparkle
    draw_sparkle(int(w * 0.82), int(h * 0.18), int(w * 0.065), star_color)
    # Top-left smaller sparkle
    draw_sparkle(int(w * 0.20), int(h * 0.22), int(w * 0.040), (254, 240, 138, 210))
    # Bottom-right micro sparkle
    draw_sparkle(int(w * 0.78), int(h * 0.76), int(w * 0.035), (252, 211, 77, 190))
    
    out = Image.alpha_composite(out, overlay)
    return out

def main():
    icon_base_path = os.path.join(ASSETS_DIR, "icon.png")
    fg_base_path = os.path.join(ASSETS_DIR, "android-icon-foreground.png")
    
    base_icon = Image.open(icon_base_path).convert('RGBA')
    base_fg = Image.open(fg_base_path).convert('RGBA')
    
    # 1. 🟢 Healthy (Standard Neon Chartreuse #D4FF32, approx 73°)
    healthy_icon = base_icon
    healthy_fg = base_fg
    healthy_icon.save(os.path.join(ASSETS_DIR, "icon-healthy.png"))
    healthy_fg.save(os.path.join(ASSETS_DIR, "android-icon-foreground-healthy.png"))
    print("Saved Healthy icons")
    
    # 2. 🟡 Caution (Vibrant Neon Amber-Gold #F59E0B, hue = 38°)
    caution_icon = shift_hue(base_icon, target_hue=38.0, sat_mult=1.1, val_mult=1.0)
    caution_fg = shift_hue(base_fg, target_hue=38.0, sat_mult=1.1, val_mult=1.0)
    caution_icon.save(os.path.join(ASSETS_DIR, "icon-caution.png"))
    caution_fg.save(os.path.join(ASSETS_DIR, "android-icon-foreground-caution.png"))
    print("Saved Caution icons")
    
    # 3. 🔴 Critical (Laser Crimson Alert #EF4444, hue = 356°) + Alert Badge
    critical_icon = shift_hue(base_icon, target_hue=356.0, sat_mult=1.1, val_mult=1.0)
    critical_fg = shift_hue(base_fg, target_hue=356.0, sat_mult=1.1, val_mult=1.0)
    critical_icon = add_critical_alert_badge(critical_icon)
    critical_fg = add_critical_alert_badge(critical_fg)
    critical_icon.save(os.path.join(ASSETS_DIR, "icon-critical.png"))
    critical_fg.save(os.path.join(ASSETS_DIR, "android-icon-foreground-critical.png"))
    print("Saved Critical icons")
    
    # 4. 🎯 Goal Achieved (Celebratory 24k Bullion Gold #FCD34D, hue = 48°) + Sparkles
    goal_icon = shift_hue(base_icon, target_hue=48.0, sat_mult=1.0, val_mult=1.05)
    goal_fg = shift_hue(base_fg, target_hue=48.0, sat_mult=1.0, val_mult=1.05)
    goal_icon = add_celebratory_sparkles(goal_icon)
    goal_fg = add_celebratory_sparkles(goal_fg)
    goal_icon.save(os.path.join(ASSETS_DIR, "icon-goal.png"))
    goal_fg.save(os.path.join(ASSETS_DIR, "android-icon-foreground-goal.png"))
    print("Saved Goal icons")

if __name__ == "__main__":
    main()
