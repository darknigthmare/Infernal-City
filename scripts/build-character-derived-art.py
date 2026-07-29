"""Build lightweight portraits, VN CGs and expression sheets from OpenAI atlases.

The source identity always comes from the final OpenAI ImageGen atlas. This
script performs only deterministic cropping, layout and WebP compression so
the expansion does not duplicate twenty large PNG files in the PWA payload.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
HEROES = {
    "nyx": ("nyx-circuit", ["ghost-in-the-rain", "unchained-frequency", "after-the-blackout"]),
    "aurelia": ("aurelia-brassheart", ["brass-after-hours", "borrowed-minute", "heart-under-glass"]),
    "maris": ("maris-blacktide", ["captains-table", "two-compasses", "blacktide-cabin"]),
    "zahra": ("zahra-mille-ciels", ["garden-above-sand", "unwritten-constellation", "lanterns-of-choice"]),
    "mircalla": ("mircalla-dollheart", ["porcelain-audience", "crack-in-perfection", "lace-curtain"]),
    "isolde": ("isolde-mourne", ["last-requiem", "voice-between-silences", "mourning-into-dawn"]),
    "hana": ("hana-kurogane", ["tea-without-rank", "truth-under-steel", "moon-on-empty-blade"]),
    "freyja": ("freyja-rimeborne", ["feast-after-storm", "erasable-oath", "warmth-under-rime"]),
    "vega": ("vega-solari", ["halo-at-rest", "permission-to-doubt", "eclipse-for-two"]),
    "amara": ("amara-verdigris", ["safe-greenhouse", "unowned-creation", "verdigris-bloom"]),
}
VILLAINS = {
    "xyra": "xyra-bioforge",
    "ossuary": "lady-ossuary",
    "nhalzara": "nhal-zara",
    "astarra": "astarra-infernal",
    "umbrael": "umbrael-shadow",
    "pestifera": "pestifera",
    "vexara": "vexara-dreadtide",
    "kalix": "kali-x",
    "malika": "malika-ash-djinn",
    "noctis": "madame-noctis",
}


def atlas_cell(atlas: Image.Image, column: int, row: int) -> Image.Image:
    cell_width = atlas.width // 4
    cell_height = atlas.height // 4
    return atlas.crop(
        (
            column * cell_width,
            row * cell_height,
            (column + 1) * cell_width,
            (row + 1) * cell_height,
        )
    )


def tight_sprite(cell: Image.Image, padding: int = 5) -> Image.Image:
    rgba = cell.convert("RGBA")
    bounds = rgba.getchannel("A").getbbox()
    if not bounds:
        raise ValueError("Cellule vide dans un atlas final")
    left, top, right, bottom = bounds
    return rgba.crop(
        (
            max(0, left - padding),
            max(0, top - padding),
            min(rgba.width, right + padding),
            min(rgba.height, bottom + padding),
        )
    )


def dominant_accent(sprite: Image.Image) -> tuple[int, int, int]:
    sample = sprite.resize((48, 48), Image.Resampling.LANCZOS)
    pixels = [
        (red, green, blue)
        for red, green, blue, alpha in sample.get_flattened_data()
        if alpha > 80 and max(red, green, blue) - min(red, green, blue) > 24
    ]
    if not pixels:
        return (236, 72, 153)
    pixels.sort(key=lambda rgb: max(rgb) + (max(rgb) - min(rgb)), reverse=True)
    chosen = pixels[len(pixels) // 5]
    return tuple(max(54, min(245, channel)) for channel in chosen)


def background(size: tuple[int, int], accent: tuple[int, int, int], variant: int) -> Image.Image:
    width, height = size
    canvas = Image.new("RGB", size)
    pixels = canvas.load()
    for y in range(height):
        vertical = y / max(1, height - 1)
        for x in range(width):
            radial = max(
                0.0,
                1.0 - math.hypot((x / width) - (0.72 - variant * 0.11), (y / height) - 0.42) * 1.8,
            )
            pixels[x, y] = (
                int(3 + accent[0] * radial * 0.20 + 8 * vertical),
                int(7 + accent[1] * radial * 0.18 + 5 * vertical),
                int(18 + accent[2] * radial * 0.24 + 10 * vertical),
            )
    draw = ImageDraw.Draw(canvas, "RGBA")
    spacing = 52 + variant * 9
    for offset in range(-height, width, spacing):
        draw.line(
            (offset, height, offset + height, 0),
            fill=(*accent, 22),
            width=2,
        )
    draw.rectangle((18, 18, width - 19, height - 19), outline=(*accent, 72), width=2)
    return canvas


def fit_sprite(sprite: Image.Image, size: tuple[int, int], margin: int) -> Image.Image:
    available = (max(1, size[0] - margin * 2), max(1, size[1] - margin * 2))
    scale = min(available[0] / sprite.width, available[1] / sprite.height)
    resized = sprite.resize(
        (max(1, round(sprite.width * scale)), max(1, round(sprite.height * scale))),
        Image.Resampling.LANCZOS,
    )
    layer = Image.new("RGBA", size)
    x = (size[0] - resized.width) // 2
    y = size[1] - margin - resized.height
    shadow = Image.new("RGBA", size)
    alpha = resized.getchannel("A").filter(ImageFilter.GaussianBlur(10))
    tinted = Image.new("RGBA", resized.size, (0, 0, 0, 150))
    tinted.putalpha(alpha)
    shadow.alpha_composite(tinted, (x + 8, y + 13))
    layer.alpha_composite(shadow)
    layer.alpha_composite(resized, (x, y))
    return layer


def save_webp(image: Image.Image, destination: Path, quality: int = 84) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=quality, method=6)


def build_portrait(
    atlas: Image.Image,
    destination: Path,
    row: int = 0,
    column: int = 0,
    variant: int = 0,
) -> None:
    sprite = tight_sprite(atlas_cell(atlas, column, row))
    accent = dominant_accent(sprite)
    canvas = background((512, 640), accent, variant).convert("RGBA")
    canvas.alpha_composite(fit_sprite(sprite, canvas.size, 42))
    save_webp(canvas.convert("RGB"), destination, quality=86)


def build_cg(atlas: Image.Image, destination: Path, variant: int) -> None:
    cells = [(0, 0), (1, 2), (2, 3)]
    column, row = cells[variant]
    sprite = tight_sprite(atlas_cell(atlas, column, row))
    accent = dominant_accent(sprite)
    canvas = background((960, 540), accent, variant).convert("RGBA")
    ghost = fit_sprite(sprite, (520, 500), 22)
    ghost = ImageEnhance.Brightness(ghost).enhance(0.35).filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(ghost, (18, 20))
    character = fit_sprite(sprite, (500, 520), 20)
    canvas.alpha_composite(character, (430, 10))
    draw = ImageDraw.Draw(canvas, "RGBA")
    draw.polygon(
        [(0, 390), (420, 250), (590, 540), (0, 540)],
        fill=(2, 6, 18, 178),
    )
    draw.line((38, 470, 390, 350), fill=(*accent, 120), width=3)
    save_webp(canvas.convert("RGB"), destination, quality=82)


def build_expression_sheet(atlas: Image.Image, destination: Path) -> None:
    sheet = Image.new("RGB", (768, 768), (4, 8, 20))
    source_cells = [
        (0, 0), (1, 0), (2, 0),
        (0, 2), (1, 2), (2, 2),
        (0, 3), (1, 3), (2, 3),
    ]
    for index, (column, row) in enumerate(source_cells):
        sprite = tight_sprite(atlas_cell(atlas, column, row))
        # VN tiles are portrait close-ups rather than nine unreadable full-body
        # combat sprites. The source remains the matching OpenAI atlas frame.
        closeup_height = max(1, round(sprite.height * 0.58))
        sprite = sprite.crop((0, 0, sprite.width, closeup_height))
        accent = dominant_accent(sprite)
        tile = background((256, 256), accent, index % 3).convert("RGBA")
        tile.alpha_composite(fit_sprite(sprite, tile.size, 12))
        sheet.paste(tile.convert("RGB"), ((index % 3) * 256, (index // 3) * 256))
    save_webp(sheet, destination, quality=80)


def build_campaign_conclusion(destination: Path) -> None:
    """Compose a wide victory archive entirely from the OpenAI character art."""
    canvas = Image.new("RGBA", (1280, 720), (3, 6, 18, 255))
    draw = ImageDraw.Draw(canvas, "RGBA")
    for y in range(720):
        vertical = y / 719
        draw.line(
            (0, y, 1280, y),
            fill=(
                round(3 + (9 * vertical)),
                round(6 + (8 * vertical)),
                round(18 + (20 * vertical)),
                255,
            ),
        )

    # Alpha glows are rendered on a separate layer before flattening; drawing
    # translucent RGB directly onto the final RGBA image would turn them into
    # harsh opaque discs when converted to WebP.
    glow = Image.new("RGBA", canvas.size)
    glow_draw = ImageDraw.Draw(glow, "RGBA")
    glow_draw.ellipse((300, -360, 980, 320), fill=(124, 58, 237, 24))
    glow_draw.ellipse((440, -170, 840, 230), fill=(0, 240, 255, 18))
    glow_draw.polygon(
        ((0, 720), (0, 535), (640, 355), (1280, 535), (1280, 720)),
        fill=(14, 24, 58, 118),
    )
    canvas.alpha_composite(glow)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # Deterministic Haven skyline: visual context without text, logos or
    # scenery copied from another property.
    for index in range(32):
        x = (index * 42) - 18
        height = 42 + ((index * 37) % 92)
        draw.rectangle((x, 390 - height, x + 27, 390), fill=(5, 10, 27, 235))
        if index % 3 == 0:
            draw.line((x + 13, 390 - height - 18, x + 13, 390 - height), fill=(0, 240, 255, 54), width=2)
        for window_y in range(390 - height + 12, 382, 22):
            draw.rectangle((x + 7, window_y, x + 10, window_y + 5), fill=(236, 72, 153, 42))
            draw.rectangle((x + 17, window_y, x + 20, window_y + 5), fill=(0, 240, 255, 34))
    draw.line((34, 398, 1246, 398), fill=(0, 240, 255, 76), width=2)

    hero_entries = list(HEROES.items())
    for index, (_, (slug, _)) in enumerate(hero_entries):
        atlas_path = ROOT / "assets" / "characters" / "heroines" / f"{slug}-atlas-v1.png"
        with Image.open(atlas_path) as atlas_image:
            sprite = tight_sprite(atlas_cell(atlas_image.convert("RGBA"), 0, 0))
        layer = fit_sprite(sprite, (118, 285), 5)
        x = 15 + (index * 125)
        y = 398 + round(abs(4.5 - index) * 2)
        canvas.alpha_composite(layer, (x, y))

    villain_entries = list(VILLAINS.values())
    for index, slug in enumerate(villain_entries):
        atlas_path = ROOT / "assets" / "characters" / "villains" / f"{slug}-atlas-v1.png"
        with Image.open(atlas_path) as atlas_image:
            sprite = tight_sprite(atlas_cell(atlas_image.convert("RGBA"), 0, 0))
        silhouette = fit_sprite(sprite, (108, 180), 4)
        silhouette = ImageEnhance.Brightness(silhouette).enhance(0.38)
        x = 23 + (index * 125)
        canvas.alpha_composite(silhouette, (x, 202 + ((index % 2) * 10)))

    draw.line((66, 688, 1214, 688), fill=(236, 72, 153, 72), width=2)
    draw.rectangle((22, 22, 1257, 697), outline=(236, 72, 153, 74), width=2)
    save_webp(canvas.convert("RGB"), destination, quality=84)


def main() -> None:
    generated = []
    for hero_id, (slug, chapters) in HEROES.items():
        atlas_path = ROOT / "assets" / "characters" / "heroines" / f"{slug}-atlas-v1.png"
        if not atlas_path.exists():
            raise FileNotFoundError(atlas_path)
        with Image.open(atlas_path) as atlas_image:
            atlas = atlas_image.convert("RGBA")
            portrait = atlas_path.with_name(f"{slug}-portrait-v1.webp")
            if not portrait.exists():
                build_portrait(atlas, portrait)
            generated.append(portrait)
            alternate = atlas_path.with_name(f"{slug}-night-portrait-v1.webp")
            if not alternate.exists():
                build_portrait(atlas, alternate, row=3, column=2, variant=2)
            generated.append(alternate)
            expression = ROOT / "assets" / "vn" / "expressions" / f"{hero_id}-expressions-v1.webp"
            if not expression.exists():
                build_expression_sheet(atlas, expression)
            generated.append(expression)
            for variant, chapter_id in enumerate(chapters):
                cg = ROOT / "assets" / "vn" / "cg" / "chapters" / f"{hero_id}-{chapter_id}.webp"
                if not cg.exists():
                    build_cg(atlas, cg, variant)
                generated.append(cg)

    for slug in VILLAINS.values():
        atlas_path = ROOT / "assets" / "characters" / "villains" / f"{slug}-atlas-v1.png"
        if not atlas_path.exists():
            raise FileNotFoundError(atlas_path)
        with Image.open(atlas_path) as atlas_image:
            portrait = atlas_path.with_name(f"{slug}-portrait-v1.webp")
            if not portrait.exists():
                build_portrait(atlas_image.convert("RGBA"), portrait, row=3)
            generated.append(portrait)

    conclusion = ROOT / "assets" / "vn" / "cg" / "ten-thrones-conclusion-v1.webp"
    build_campaign_conclusion(conclusion)
    generated.append(conclusion)

    total_bytes = sum(path.stat().st_size for path in generated)
    print(f"{len(generated)} assets dérivés OpenAI · {total_bytes} octets")
    for path in generated:
        print(path.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
