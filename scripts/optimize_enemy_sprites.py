"""Downscale authored enemy sprites while preserving their alpha matte."""

from pathlib import Path

from PIL import Image


SPRITE_DIRECTORY = Path(__file__).resolve().parents[1] / "assets" / "enemies"
MAXIMUM_SIZE = (512, 512)


def optimize_sprite(source: Path) -> None:
    with Image.open(source) as image:
        sprite = image.convert("RGBA")
        sprite.thumbnail(MAXIMUM_SIZE, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", MAXIMUM_SIZE, (0, 0, 0, 0))
        offset = (
            (MAXIMUM_SIZE[0] - sprite.width) // 2,
            (MAXIMUM_SIZE[1] - sprite.height) // 2,
        )
        canvas.alpha_composite(sprite, offset)
        canvas.save(source, optimize=True)

    with Image.open(source) as result:
        if result.mode != "RGBA":
            raise RuntimeError(f"{source.name}: canal alpha absent")
        corners = (
            result.getpixel((0, 0))[3],
            result.getpixel((result.width - 1, 0))[3],
            result.getpixel((0, result.height - 1))[3],
            result.getpixel((result.width - 1, result.height - 1))[3],
        )
        if any(corners):
            raise RuntimeError(f"{source.name}: coin non transparent")
        print(f"{source.name}: {result.width}x{result.height}, RGBA, coins transparents")


for sprite_path in sorted(SPRITE_DIRECTORY.glob("*.png")):
    optimize_sprite(sprite_path)
