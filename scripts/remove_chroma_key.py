"""Remove a flat chroma background from an ImageGen sprite.

Requires Pillow. The implementation intentionally avoids NumPy so the asset
pipeline stays usable with the same dependency as optimize_enemy_sprites.py.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--auto-key", choices=("border",), default="border")
    parser.add_argument("--transparent-threshold", type=float, default=12)
    parser.add_argument("--opaque-threshold", type=float, default=220)
    parser.add_argument("--soft-matte", action="store_true")
    parser.add_argument("--despill", action="store_true")
    return parser.parse_args()


def average_border_key(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    pixels = image.load()
    sample: list[tuple[int, int, int]] = []
    stride = max(1, min(width, height) // 128)

    for x in range(0, width, stride):
        sample.append(pixels[x, 0][:3])
        sample.append(pixels[x, height - 1][:3])
    for y in range(0, height, stride):
        sample.append(pixels[0, y][:3])
        sample.append(pixels[width - 1, y][:3])

    return tuple(round(sum(pixel[channel] for pixel in sample) / len(sample)) for channel in range(3))


def remove_chroma(
    image: Image.Image,
    key: tuple[int, int, int],
    transparent_threshold: float,
    opaque_threshold: float,
    soft_matte: bool,
    despill: bool,
) -> Image.Image:
    if opaque_threshold <= transparent_threshold:
        raise ValueError("opaque-threshold doit être supérieur à transparent-threshold")

    sprite = image.convert("RGBA")
    output = Image.new("RGBA", sprite.size, (0, 0, 0, 0))
    source_pixels = sprite.load()
    output_pixels = output.load()

    for y in range(sprite.height):
        for x in range(sprite.width):
            red, green, blue, original_alpha = source_pixels[x, y]
            distance = math.sqrt(
                ((red - key[0]) ** 2)
                + ((green - key[1]) ** 2)
                + ((blue - key[2]) ** 2)
            )
            if distance <= transparent_threshold:
                matte_alpha = 0
            elif distance >= opaque_threshold or not soft_matte:
                matte_alpha = 255
            else:
                ratio = (distance - transparent_threshold) / (opaque_threshold - transparent_threshold)
                matte_alpha = round(255 * ratio * ratio * (3 - (2 * ratio)))

            alpha = round(original_alpha * (matte_alpha / 255))
            if despill and alpha < 255:
                green = min(green, max(red, blue) + round((255 - alpha) * 0.08))
            output_pixels[x, y] = (red, green, blue, alpha)

    return output


def main() -> None:
    arguments = parse_arguments()
    with Image.open(arguments.source) as source:
        rgba_source = source.convert("RGBA")
        key = average_border_key(rgba_source)
        result = remove_chroma(
            rgba_source,
            key,
            arguments.transparent_threshold,
            arguments.opaque_threshold,
            arguments.soft_matte,
            arguments.despill,
        )
        arguments.destination.parent.mkdir(parents=True, exist_ok=True)
        result.save(arguments.destination, optimize=True)
    print(f"{arguments.destination}: key={key}, RGBA {result.width}x{result.height}")


if __name__ == "__main__":
    main()
