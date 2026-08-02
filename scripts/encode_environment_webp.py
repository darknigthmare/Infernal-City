"""Encode the authored OpenAI environment bitmaps for efficient web delivery.

The PNG masters stay in the repository as the provenance/source-of-truth files.
Runtime WebP derivatives are deterministic build artifacts committed alongside
them so the static game does not require a build step in production.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ENVIRONMENT = ROOT / "assets" / "environment"
SOURCES = (
    "infernal-city-floor.png",
    "infernal-city-approach-terrain.png",
    "infernal-city-coastline.png",
    "infernal-city-spawn-gate-atlas.png",
    "map-western-wall.png",
    "map-southern-watch.png",
    "map-twin-rift.png",
)


def main() -> None:
    for filename in SOURCES:
        source = ENVIRONMENT / filename
        target = source.with_suffix(".webp")
        with Image.open(source) as image:
            image.save(target, "WEBP", quality=88, method=6, exact=True)
        print(f"{target.relative_to(ROOT)}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()
