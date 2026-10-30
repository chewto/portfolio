"""Generate the Open Graph cover and Apple touch icon for the portfolio.

Requires Pillow. Uses Segoe UI when available (Windows), with DejaVu as fallback.
Run: python scripts/generate-og.py
"""

from __future__ import annotations

import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"

FONT_CANDIDATES = {
    "regular": [
        r"C:\Windows\Fonts\segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
    "bold": [
        r"C:\Windows\Fonts\segoeuib.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "semibold": [
        r"C:\Windows\Fonts\seguisb.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
}

_font_cache: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}


def get_font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    key = (weight, size)
    if key in _font_cache:
        return _font_cache[key]

    for path in FONT_CANDIDATES[weight]:
        if pathlib.Path(path).exists():
            font = ImageFont.truetype(path, size)
            _font_cache[key] = font
            return font

    fallback = ImageFont.load_default()
    _font_cache[key] = fallback
    return fallback


def lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vertical_gradient(width: int, height: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    image = Image.new("RGB", (width, height), top)
    draw = ImageDraw.Draw(image)
    for y in range(height):
        draw.line((0, y, width, y), fill=lerp(top, bottom, y / max(height - 1, 1)))
    return image.convert("RGBA")


def add_glow(base: Image.Image, box: tuple[int, int, int, int], color: tuple[int, int, int, int], blur: int) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse(box, fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def add_bubble(base: Image.Image, cx: int, cy: int, radius: int, alpha: int) -> None:
    pad = radius + 24
    diameter = radius * 2
    layer = Image.new("RGBA", (diameter + 48, diameter + 48), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse((24, 24, 24 + diameter, 24 + diameter), fill=(255, 255, 255, max(10, alpha // 4)), outline=(255, 255, 255, alpha), width=2)
    draw.ellipse((24 + radius * 0.35, 24 + radius * 0.28, 24 + radius * 0.95, 24 + radius * 0.72), fill=(255, 255, 255, min(230, alpha + 50)))
    base.alpha_composite(layer, (cx - pad, cy - pad))


def orb(size: int) -> Image.Image:
    stops = [
        (0.0, (255, 255, 255)),
        (0.22, (238, 255, 190)),
        (0.48, (169, 239, 88)),
        (0.74, (63, 199, 230)),
        (1.0, (14, 147, 209)),
    ]

    def color_at(t: float) -> tuple[int, int, int]:
        for index in range(1, len(stops)):
            t0, c0 = stops[index - 1]
            t1, c1 = stops[index]
            if t <= t1:
                local = (t - t0) / max(t1 - t0, 0.0001)
                return lerp(c0, c1, local)
        return stops[-1][1]

    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    center = size / 2
    radius = size / 2 - 2
    steps = 220
    for step in range(steps, 0, -1):
        current = radius * step / steps
        t = 1 - (current / radius)
        draw.ellipse((center - current, center - current, center + current, center + current), fill=(*color_at(t), 255))

    highlight = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(highlight)
    hdraw.ellipse(
        (size * 0.18, size * 0.12, size * 0.58, size * 0.38),
        fill=(255, 255, 255, 220),
    )
    highlight = highlight.filter(ImageFilter.GaussianBlur(size * 0.045))

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((2, 2, size - 2, size - 2), fill=255)
    image = Image.composite(Image.alpha_composite(image, highlight), Image.new("RGBA", (size, size), (0, 0, 0, 0)), mask)

    draw = ImageDraw.Draw(image)
    draw.ellipse((2, 2, size - 2, size - 2), outline=(255, 255, 255, 235), width=max(2, size // 80))

    initials_font = get_font("bold", int(size * 0.34))
    bbox = draw.textbbox((0, 0), "JL", font=initials_font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - th) / 2 - bbox[1] - size * 0.02
    draw.text((tx + 1, ty + 2), "JL", font=initials_font, fill=(6, 60, 44, 80))
    draw.text((tx, ty), "JL", font=initials_font, fill=(10, 59, 44, 255))

    return image


def draw_pill(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font: ImageFont.FreeTypeFont, pad: int = 16) -> tuple[int, int]:
    x, y = xy
    bbox = draw.textbbox((0, 0), text, font=font)
    width = bbox[2] - bbox[0] + pad * 2
    height = bbox[3] - bbox[1] + pad + 10
    draw.rounded_rectangle(
        (x, y, x + width, y + height),
        radius=height // 2,
        fill=(255, 255, 255, 185),
        outline=(255, 255, 255, 230),
        width=2,
    )
    draw.text((x + pad, y + pad // 2 + 1), text, font=font, fill=(7, 95, 128, 255))
    return x + width, y + height


LOCALES = {
    "en": {
        "eyebrow": "PROFESSIONAL PORTFOLIO",
        "role": "Full-Stack Developer",
        "specialties": "eKYC · Biometrics · OCR",
        "location": "Maturín, Monagas · Venezuela   ·   Remote",
        "tagline": "eKYC · OCR · Performance",
        "output": "og-cover.jpg",
    },
    "es": {
        "eyebrow": "PORTAFOLIO PROFESIONAL",
        "role": "Desarrollador Full-Stack",
        "specialties": "eKYC · Biometría · OCR",
        "location": "Maturín, Monagas · Venezuela   ·   Remoto",
        "tagline": "eKYC · OCR · Rendimiento",
        "output": "og-cover-es.jpg",
    },
}


def build_cover(copy: dict[str, str]) -> Image.Image:
    width, height = 1200, 630
    base = vertical_gradient(width, height, (215, 245, 255), (240, 255, 247))

    add_glow(base, (-220, -260, 620, 340), (46, 200, 240, 90), 120)
    add_glow(base, (720, -280, 1320, 260), (184, 243, 76, 85), 120)
    add_glow(base, (620, 380, 1320, 900), (159, 240, 229, 95), 130)

    for cx, cy, radius, alpha in [
        (1060, 90, 42, 150),
        (1130, 540, 78, 120),
        (620, 52, 26, 130),
        (48, 565, 55, 120),
        (790, 585, 30, 110),
    ]:
        add_bubble(base, cx, cy, radius, alpha)

    shadow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((62, 72, 1138, 570), radius=46, fill=(6, 52, 80, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(32))
    base.alpha_composite(shadow)

    card = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card)
    card_draw.rounded_rectangle((62, 62, 1138, 560), radius=46, fill=(255, 255, 255, 155), outline=(255, 255, 255, 235), width=2)
    sheen = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    sheen_draw = ImageDraw.Draw(sheen)
    sheen_draw.rounded_rectangle((62, 62, 1138, 210), radius=46, fill=(255, 255, 255, 55))
    sheen = sheen.filter(ImageFilter.GaussianBlur(18))
    card.alpha_composite(sheen)
    base.alpha_composite(card)

    draw = ImageDraw.Draw(base)

    eyebrow_font = get_font("bold", 17)
    eyebrow_bbox = draw.textbbox((0, 0), copy["eyebrow"], font=eyebrow_font)
    pill_w = eyebrow_bbox[2] - eyebrow_bbox[0] + 42
    pill_h = 38
    draw.rounded_rectangle(
        (108, 108, 108 + pill_w, 108 + pill_h),
        radius=19,
        fill=(255, 255, 255, 190),
        outline=(255, 255, 255, 240),
        width=2,
    )
    draw.ellipse((126, 122, 136, 132), fill=(82, 201, 107, 255))
    draw.text((146, 115), copy["eyebrow"], font=eyebrow_font, fill=(7, 95, 128, 255))

    name_font = get_font("bold", 88)
    draw.text((106, 158), "Jesús Lozada", font=name_font, fill=(6, 42, 69, 255))
    draw.rounded_rectangle((110, 266, 610, 269), radius=1.5, fill=(46, 200, 240, 90))

    role_font = get_font("semibold", 35)
    draw.text((108, 288), copy["role"], font=role_font, fill=(49, 86, 110, 255))

    specialty_font = get_font("bold", 34)
    draw.text((108, 336), copy["specialties"], font=specialty_font, fill=(7, 124, 158, 255))

    meta_font = get_font("regular", 23)
    draw.text((110, 402), copy["location"], font=meta_font, fill=(71, 100, 118, 255))

    chip_font = get_font("semibold", 20)
    chip_x = 110
    for label in ("React", "TypeScript", "Python", "Flask"):
        bbox = draw.textbbox((0, 0), label, font=chip_font)
        chip_w = bbox[2] - bbox[0] + 36
        draw.rounded_rectangle(
            (chip_x, 448, chip_x + chip_w, 490),
            radius=21,
            fill=(255, 255, 255, 195),
            outline=(255, 255, 255, 245),
            width=2,
        )
        draw.text((chip_x + 18, 454), label, font=chip_font, fill=(49, 86, 110, 255))
        chip_x += chip_w + 12

    url_font = get_font("bold", 24)
    draw.text((110, 508), "jesuslozada.dev", font=url_font, fill=(7, 111, 150, 255))

    halo = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(halo)
    hdraw.ellipse((700, 100, 1120, 520), fill=(255, 255, 255, 65))
    halo = halo.filter(ImageFilter.GaussianBlur(60))
    base.alpha_composite(halo)

    orbit = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(orbit)
    odraw.ellipse((688, 148, 1122, 472), outline=(255, 255, 255, 150), width=2)
    odraw.ellipse((748, 190, 1062, 430), outline=(255, 255, 255, 90), width=2)
    odraw.ellipse((1090, 270, 1104, 284), fill=(234, 255, 176, 255))
    odraw.ellipse((712, 390, 726, 404), fill=(255, 255, 255, 220))
    base.alpha_composite(orbit)

    orb_image = orb(300)
    base.alpha_composite(orb_image, (760, 150))

    label_font = get_font("bold", 18)
    label_text = copy["tagline"]
    label_bbox = draw.textbbox((0, 0), label_text, font=label_font)
    label_w = label_bbox[2] - label_bbox[0] + 42
    draw.rounded_rectangle((716, 454, 716 + label_w, 496), radius=21, fill=(6, 42, 69, 70), outline=(255, 255, 255, 130), width=1)
    draw.text((737, 461), label_text, font=label_font, fill=(255, 255, 255, 235))

    return base.convert("RGB")


def build_touch_icon() -> Image.Image:
    size = 360
    base = Image.new("RGBA", (size, size), (226, 247, 255, 255))
    draw = ImageDraw.Draw(base)
    for y in range(size):
        draw.line((0, y, size, y), fill=(*lerp((216, 245, 255), (235, 255, 245), y / size), 255))
    add_glow(base, (-80, -80, 220, 220), (46, 200, 240, 120), 70)
    add_glow(base, (180, 180, 440, 440), (184, 243, 76, 110), 70)
    icon = orb(260)
    base.alpha_composite(icon, ((size - 260) // 2, (size - 260) // 2))
    return base.convert("RGB").resize((180, 180), Image.Resampling.LANCZOS)


def main() -> int:
    if not hasattr(Image, "Resampling"):
        print("Pillow version is too old; install Pillow >= 9.", file=sys.stderr)
        return 1

    ASSETS.mkdir(parents=True, exist_ok=True)
    for copy in LOCALES.values():
        cover = build_cover(copy)
        output = ASSETS / copy["output"]
        cover.save(output, "JPEG", quality=90, optimize=True, progressive=True)
        print(f"Wrote {output}")

    build_touch_icon().save(ASSETS / "apple-touch-icon.png", "PNG", optimize=True)
    print(f"Wrote {ASSETS / 'apple-touch-icon.png'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
