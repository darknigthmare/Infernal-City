"""Build square PWA icons from the authored Infernal City cover."""

from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "cover.jpg"
DESTINATION = ROOT / "assets" / "icons"


def build_icon(size: int) -> None:
    with Image.open(SOURCE) as source:
        cover = source.convert("RGB")
        # The city is centered slightly above the geometric midpoint.
        square = ImageOps.fit(
            cover,
            (size, size),
            method=Image.Resampling.LANCZOS,
            centering=(0.5, 0.42),
        )
        destination = DESTINATION / f"icon-{size}.png"
        square.save(destination, optimize=True)
        print(f"{destination}: {size}x{size}")


DESTINATION.mkdir(parents=True, exist_ok=True)
for icon_size in (192, 512):
    build_icon(icon_size)
